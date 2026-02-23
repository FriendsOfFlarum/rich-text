import { Mark, markInputRule } from '@tiptap/core';

export const Superscript = Mark.create({
  name: 'sup',

  parseHTML() {
    return [{ tag: 'sup' }];
  },

  renderHTML() {
    return ['sup', 0];
  },

  addInputRules() {
    return [
      markInputRule({
        find: /(?:\^)([^^]+)(?:\^)$/,
        type: this.type,
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-.': () => this.editor.commands.toggleMark(this.name),
    };
  },
});
