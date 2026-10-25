import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpoilerInline } from '../src/common/tiptap/extensions/SpoilerInline';

describe('inline spoiler selection', () => {
  let editor: Editor;
  beforeEach(() => {
    editor = new Editor({ extensions: [StarterKit, SpoilerInline], content: '<p>first<br>second</p><p>third</p>' });
  });
  afterEach(() => editor.destroy());

  it('keeps the selected text and inserts subsequent typing after the spoiler', () => {
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });
    editor.commands.toggleSpoilerInline();
    expect(editor.state.selection.empty).toBe(true);
    editor.commands.insertContent('after');

    expect(editor.state.doc.textContent).toBe('firstsecondthirdafter');
    expect(editor.state.doc.firstChild?.firstChild?.marks.some((mark) => mark.type.name === 'spoiler_inline')).toBe(true);
    expect(editor.state.doc.lastChild?.lastChild?.marks.some((mark) => mark.type.name === 'spoiler_inline')).toBe(false);
    editor.state.doc.check();
  });

  it('still toggles spoiler typing on and off when no text is selected', () => {
    editor.commands.setTextSelection(1);
    editor.commands.toggleSpoilerInline();
    editor.commands.insertContent('hidden');
    editor.commands.toggleSpoilerInline();
    editor.commands.insertContent('visible');

    expect(editor.state.doc.firstChild?.firstChild?.text).toBe('hidden');
    expect(editor.state.doc.firstChild?.firstChild?.marks[0].type.name).toBe('spoiler_inline');
    expect(editor.state.doc.firstChild?.child(1).marks).toHaveLength(0);
  });
});
