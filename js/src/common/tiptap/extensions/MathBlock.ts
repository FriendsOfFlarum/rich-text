import { Node, textblockTypeInputRule } from '@tiptap/core';

export const MathBlock = Node.create({
  name: 'math_block',
  group: 'block',
  content: 'text*',
  code: true,

  parseHTML() {
    return [{ tag: 'pre.math' }];
  },

  renderHTML() {
    return ['pre', { class: 'math' }, ['code', 0]];
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^\s*\$\$\s$/,
        type: this.type,
      }),
    ];
  },
});
