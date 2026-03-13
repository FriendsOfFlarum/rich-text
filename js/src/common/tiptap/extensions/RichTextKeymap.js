import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const RichTextKeymap = Extension.create({
  name: 'richTextKeymap',

  addKeyboardShortcuts() {
    return {
      'Alt-Shift-5': () => this.editor.commands.toggleStrike(),
      Space: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        // Check if cursor is at the end of a link mark
        const linkMark = state.schema.marks.link;
        if (!linkMark) return false;

        const marks = $from.marks();
        const hasLink = marks.some((m) => m.type === linkMark);
        if (!hasLink) return false;

        // Check if we're at the end of the link (no text after cursor within same parent, or next char has no link mark)
        const nodeAfter = $from.nodeAfter;
        const atLinkEnd = !nodeAfter || !linkMark.isInSet(nodeAfter.marks);

        if (atLinkEnd) {
          // Remove link mark from stored marks and insert a space outside the link
          editor.chain().unsetMark('link').insertContent(' ').run();
          return true;
        }

        return false;
      },
    };
  },
});

export const DropdownYield = Extension.create({
  name: 'dropdownYield',
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const emojiDropdown = $('.EmojiDropdown:visible');
        const mentionsDropdown = $('.MentionsDropdown:visible');
        const formDropdown = $('.FormDropdown:visible');
        if (emojiDropdown[0] || mentionsDropdown[0] || formDropdown[0]) return true;
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
    if (!this.options.enabled) return {};

    return {
      Enter: ({ editor }) => {
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
          handlePaste(view, event) {
            // After paste, check if cursor ended up inside a link and add a space to exit
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
