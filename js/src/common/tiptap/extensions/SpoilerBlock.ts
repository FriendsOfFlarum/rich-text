import { Node, wrappingInputRule } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';

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
        return false;
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
