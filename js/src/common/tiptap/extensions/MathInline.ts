import { Mark, markInputRule } from '@tiptap/core';

export const MathInline = Mark.create({
  name: 'math_inline',
  excludes: '_',

  parseHTML() {
    return [{ tag: 'math' }];
  },

  renderHTML() {
    return ['math', 0];
  },

  addInputRules() {
    return [
      markInputRule({
        find: /(?:\$)([^$]+)(?:\$)$/,
        type: this.type,
      }),
    ];
  },
});
