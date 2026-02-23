import { Node, wrappingInputRule } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

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
    const attrs = { class: 'spoiler' };
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

    const onClick = (view, pos, node, nodePos, event, direct) => {
      if (direct && node.type === spoilerType && event.target.tagName !== 'P') {
        node.attrs.open = !node.attrs.open;
        view.focus();
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
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
