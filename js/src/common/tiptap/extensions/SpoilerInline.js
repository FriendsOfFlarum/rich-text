import { Mark, markInputRule } from '@tiptap/core';

export const SpoilerInline = Mark.create({
  name: 'spoiler_inline',

  addAttributes() {
    return {
      open: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'spoiler' }];
  },

  renderHTML() {
    return ['spoiler', 0];
  },

  addInputRules() {
    return [
      markInputRule({
        find: /(?:\|\|)([^\|]+)(?:\|\|)$/,
        type: this.type,
      }),
      markInputRule({
        find: /(?:>!)(.+)(?:!<)$/,
        type: this.type,
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-;': () => this.editor.commands.toggleMark(this.name),
    };
  },
});
