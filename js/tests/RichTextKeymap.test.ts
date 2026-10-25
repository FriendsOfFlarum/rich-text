import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CompactParagraphs } from '../src/common/tiptap/extensions/RichTextKeymap';

describe('compact paragraphs', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor({
      extensions: [StarterKit, Image.configure({ inline: true }), CompactParagraphs.configure({ enabled: true })],
    });
  });

  afterEach(() => editor.destroy());

  function paragraph(content: object[]) {
    editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph', content }] });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
  }

  function enter() {
    editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    editor.state.doc.check();
  }

  it.each([false, true])('preserves a final image when Enter is pressed (preceding text: %s)', (withText) => {
    const image = { type: 'image', attrs: { src: 'https://example.com/image.png', alt: 'image' } };
    paragraph(withText ? [{ type: 'text', text: 'before' }, image] : [image]);

    enter();

    expect(editor.view.dom.querySelector('img')?.getAttribute('src')).toBe('https://example.com/image.png');
    expect(editor.state.doc.childCount).toBe(1);
    expect(editor.state.doc.firstChild?.lastChild?.type.name).toBe('hardBreak');
  });

  it('creates a new paragraph on a second Enter without deleting the image', () => {
    paragraph([{ type: 'image', attrs: { src: 'https://example.com/image.png' } }]);

    enter();
    enter();

    expect(editor.view.dom.querySelectorAll('img[src="https://example.com/image.png"]')).toHaveLength(1);
    expect(editor.state.doc.childCount).toBe(2);
    expect(editor.state.doc.firstChild?.lastChild?.type.name).toBe('image');
    expect(editor.state.doc.lastChild?.content.size).toBe(0);
  });

  it('inserts a line break after text', () => {
    paragraph([{ type: 'text', text: 'before' }]);

    enter();

    expect(editor.state.doc.childCount).toBe(1);
    expect(editor.state.doc.firstChild?.textContent).toBe('before');
    expect(editor.state.doc.firstChild?.lastChild?.type.name).toBe('hardBreak');
  });

  it('creates a paragraph after a trailing hard break without deleting text', () => {
    paragraph([{ type: 'text', text: 'before' }, { type: 'hardBreak' }]);

    enter();

    expect(editor.state.doc.childCount).toBe(2);
    expect(editor.state.doc.firstChild?.textContent).toBe('before');
    expect(editor.state.doc.lastChild?.content.size).toBe(0);
  });

  it('replaces selected text with a line break', () => {
    paragraph([{ type: 'text', text: 'beforeREMOVEafter' }]);
    editor.commands.setTextSelection({ from: 7, to: 13 });

    enter();

    expect(editor.state.doc.firstChild?.textContent).toBe('beforeafter');
    expect(editor.state.doc.firstChild?.child(1).type.name).toBe('hardBreak');
  });

  it('keeps the default Enter behavior in a heading', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'heading' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'after' }] },
      ],
    });
    editor.commands.setTextSelection(8);

    enter();

    expect(editor.state.doc.firstChild?.type.name).toBe('heading');
    expect(editor.state.doc.lastChild?.type.name).toBe('paragraph');
    expect(editor.state.doc.childCount).toBe(3);
    expect(editor.state.doc.lastChild?.textContent).toBe('after');
  });
});
