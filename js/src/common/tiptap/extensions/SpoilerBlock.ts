import { Node, wrappingInputRule } from '@tiptap/core';
import { Plugin, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spoilerBlock: { toggleSpoilerBlock: () => ReturnType };
  }
}

export const SpoilerBlock = Node.create({
  name: 'spoiler',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      open: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ node }) {
    const attrs: Record<string, any> = { class: 'spoiler' };
    if (node.attrs.open) attrs.open = true;
    return ['details', attrs, 0];
  },

  addCommands() {
    return {
      toggleSpoilerBlock:
        () =>
        ({ editor, chain }) => {
          const wrapping = !editor.isActive(this.name);
          const command = wrapping ? chain().wrapIn(this.name) : chain().lift(this.name);

          return command
            .command(({ tr }) => {
              if (!wrapping) {
                tr.setSelection(TextSelection.near(tr.selection.$to));
                return true;
              }

              const { $from } = tr.selection;
              let after: number | null = null;
              for (let depth = $from.depth; depth > 0; depth--) {
                if ($from.node(depth).type === this.type) {
                  after = $from.after(depth);
                  break;
                }
              }

              // Select All is anchored at the document boundary, outside the wrapper.
              if (after === null && $from.nodeAfter?.type === this.type) {
                after = $from.pos + $from.nodeAfter.nodeSize;
              }
              if (after === null) return false;

              if (tr.doc.nodeAt(after)?.type !== editor.schema.nodes.paragraph) {
                tr.insert(after, editor.schema.nodes.paragraph.create());
              }
              tr.setSelection(TextSelection.create(tr.doc, after + 1)).scrollIntoView();
              return true;
            })
            .run();
        },
    };
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*>!\s$/,
        type: this.type,
      }),
    ];
  },

  addProseMirrorPlugins() {
    const spoilerType = this.type;

    const onClick = (view: EditorView, pos: number, node: ProsemirrorNode, nodePos: number, event: MouseEvent, direct: boolean) => {
      if (direct && node.type === spoilerType && (event.target as Element).tagName !== 'P') {
        const newAttrs = { ...node.attrs, open: !node.attrs.open };
        view.dispatch(view.state.tr.setNodeMarkup(nodePos, undefined, newAttrs));
        view.focus();
        event.stopPropagation();
        event.preventDefault();
        return true;
      }
      return false;
    };

    return [
      new Plugin({
        props: {
          handleClickOn: onClick,
          handleDoubleClickOn: onClick,
        },
      }),
    ];
  },
});
