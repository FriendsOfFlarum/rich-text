import { Extension } from '@tiptap/core';

export const RichTextKeymap = Extension.create({
  name: 'richTextKeymap',

  addKeyboardShortcuts() {
    return {
      'Alt-Shift-5': () => this.editor.commands.toggleStrike(),
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
