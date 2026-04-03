import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/core';

export const RichTextKeymap = Extension.create({
  name: 'richTextKeymap',

  addKeyboardShortcuts() {
    return {
      'Alt-Shift-5': () => this.editor.commands.toggleStrike(),
      Space: ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        const linkMark = state.schema.marks.link;
        if (!linkMark) return false;
        const marks = $from.marks();
        const hasLink = marks.some((m) => m.type === linkMark);
        if (!hasLink) return false;
        const nodeAfter = $from.nodeAfter;
        const atLinkEnd = !nodeAfter || !linkMark.isInSet(nodeAfter.marks);
        if (atLinkEnd) {
          editor.chain().unsetMark('link').insertContent(' ').run();
          return true;
        }
        return false;
      },
    };
  },
});

export const CompactParagraphs = Extension.create({
  name: 'compactParagraphs',

  addOptions() {
    return {
      enabled: false,
    };
  },

  addKeyboardShortcuts() {
    if (!this.options.enabled) return {} as Record<string, any>;

    return {
      Enter: ({ editor }: { editor: Editor }) => {
        const { state } = editor;
        const { $head, $anchor } = state.selection;

        if ($head.parent.type.name !== 'paragraph' || !$head.sameParent($anchor)) return false;

        const nodeBefore = state.selection.$from.nodeBefore;
        const nodeAfter = state.selection.$from.nodeAfter;

        if (nodeBefore && nodeBefore.text && nodeBefore.text.slice(-1) !== '\n') {
          editor.commands.setHardBreak();
          return true;
        } else if (nodeBefore && !nodeBefore.text && !nodeAfter) {
          const { tr } = state;
          tr.delete(state.selection.from - 1, state.selection.from);
          editor.view.dispatch(tr);
          return false;
        }

        return false;
      },
    };
  },
});

export const LinkExitOnPaste = Extension.create({
  name: 'linkExitOnPaste',
  priority: 100,

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey('linkExitOnPaste'),
        props: {
          handlePaste(_view: any, _event: any) {
            setTimeout(() => {
              const { state } = editor;
              const { $from } = state.selection;
              const linkMark = state.schema.marks.link;
              if (!linkMark) return;
              const marks = $from.marks();
              const hasLink = marks.some((m) => m.type === linkMark);
              if (!hasLink) return;
              const nodeAfter = $from.nodeAfter;
              const atLinkEnd = !nodeAfter || !linkMark.isInSet(nodeAfter.marks);
              if (atLinkEnd) {
                editor.chain().unsetMark('link').insertContent(' ').run();
              }
            }, 10);
            return false;
          },
        },
      }),
    ];
  },
});
