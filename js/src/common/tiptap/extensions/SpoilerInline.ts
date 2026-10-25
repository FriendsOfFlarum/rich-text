import { Mark, markInputRule } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spoilerInline: { toggleSpoilerInline: () => ReturnType };
  }
}

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

  addCommands() {
    return {
      toggleSpoilerInline:
        () =>
        ({ editor, chain }) => {
          const hasSelection = !editor.state.selection.empty;
          return chain()
            .toggleMark(this.name)
            .command(({ tr }) => {
              if (hasSelection) {
                tr.setSelection(TextSelection.near(tr.selection.$to));
                tr.removeStoredMark(this.type);
              }
              return true;
            })
            .run();
        },
    };
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
      'Mod-;': () => this.editor.commands.toggleSpoilerInline(),
    };
  },
});
