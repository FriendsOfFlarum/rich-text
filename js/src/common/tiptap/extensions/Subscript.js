import { Mark, markInputRule } from '@tiptap/core';

export const Subscript = Mark.create({
  name: 'sub',

  parseHTML() {
    return [{ tag: 'sub' }];
  },

  renderHTML() {
    return ['sub', 0];
  },

  addInputRules() {
    return [
      markInputRule({
        find: /(?:[^~]~)([^~]+)(?:~)$/,
        type: this.type,
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-,': () => this.editor.commands.toggleMark(this.name),
    };
  },
});
