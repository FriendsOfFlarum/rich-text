import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpoilerBlock } from '../src/common/tiptap/extensions/SpoilerBlock';

describe('spoiler block selection', () => {
  let editor: Editor;
  beforeEach(() => {
    editor = new Editor({ extensions: [StarterKit, SpoilerBlock], content: '<p>first</p><p>second</p><p>third</p>' });
  });
  afterEach(() => editor.destroy());

  it('places a collapsed cursor outside a newly wrapped multi-paragraph spoiler', () => {
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });
    editor.commands.toggleSpoilerBlock();

    expect(editor.state.selection.empty).toBe(true);
    expect(editor.state.selection.$from.depth).toBe(1);
    expect(editor.state.doc.firstChild?.type.name).toBe('spoiler');
    expect(editor.state.doc.lastChild?.type.name).toBe('paragraph');

    editor.commands.insertContent('after');
    expect(editor.state.doc.firstChild?.textContent).toBe('firstsecondthird');
    expect(editor.state.doc.lastChild?.textContent).toBe('after');
    editor.state.doc.check();
  });

  it('unwraps a spoiler without retaining a destructive text selection', () => {
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.toggleSpoilerBlock();
    editor.commands.setTextSelection(3);
    editor.commands.toggleSpoilerBlock();

    expect(editor.state.selection.empty).toBe(true);
    expect(editor.state.doc.firstChild?.type.name).toBe('paragraph');
    expect(editor.state.doc.textContent).toBe('firstsecondthird');
    editor.state.doc.check();
  });

  it('collapses a selection whose endpoint is the following empty paragraph', () => {
    editor.commands.setContent('<p>first</p><p>second</p><p>third</p><p></p>');
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });
    editor.commands.toggleSpoilerBlock();
    expect(editor.state.selection.empty).toBe(true);
    editor.commands.insertContent('after');
    expect(editor.state.doc.firstChild?.textContent).toBe('firstsecondthird');
    expect(editor.state.doc.lastChild?.textContent).toBe('after');
    editor.state.doc.check();
  });

  it.each(['<p>first</p><p>second</p><p>third</p>', '<p>first<br>second</p><p>third</p><p></p>'])(
    'preserves the document when typing after applying a spoiler to Select All: %j',
    (content) => {
      editor.commands.setContent(content);
      editor.commands.selectAll();
      expect(editor.state.selection.toJSON().type).toBe('all');

      expect(editor.commands.toggleSpoilerBlock()).toBe(true);
      expect(editor.state.selection.empty).toBe(true);
      editor.commands.insertContent('after');

      expect(editor.state.doc.firstChild?.textContent).toBe('firstsecondthird');
      expect(editor.state.doc.lastChild?.textContent).toBe('after');
      editor.state.doc.check();
    }
  );
});
