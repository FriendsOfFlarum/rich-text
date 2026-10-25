import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DisableDataUriPaste } from '../src/common/tiptap/extensions/DisableDataUriPaste';

describe('DisableDataUriPaste', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor({ extensions: [StarterKit, Image.configure({ inline: true }), DisableDataUriPaste] });
  });

  afterEach(() => editor.destroy());

  function transform(html: string): Document {
    let transformed = html;

    editor.view.someProp('transformPastedHTML', (transform) => {
      transformed = transform(transformed, editor.view);
    });

    return new DOMParser().parseFromString(transformed, 'text/html');
  }

  it.each([
    'data:image/png;base64,aGVsbG8=',
    'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
    'DATA:image/png;base64,aGVsbG8=',
    '  data:image/png;base64,aGVsbG8=',
    '\tdata:image/png;base64,aGVsbG8=',
    'da\tta:image/png;base64,aGVsbG8=',
    'd&#97;ta:image/png;base64,aGVsbG8=',
    'data:',
    'data:;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a!',
  ])('removes an image with source %s', (src) => {
    expect(transform(`<p>before<img src="${src}">after</p>`).querySelector('img')).toBeNull();
  });

  it.each(['https://example.com/image.png', '//example.com/image.png', '/image.png', 'image.png', '', 'database.png'])(
    'preserves an image with source %s',
    (src) => {
      expect(transform(`<img src="${src}">`).querySelector('img')?.getAttribute('src')).toBe(src);
    }
  );

  it('preserves surrounding content and non-data images', () => {
    const doc = transform('<p>before<img src="data:image/png;base64,aA=="><strong>middle</strong><img src="/keep.png">after</p>');

    expect(doc.body.textContent).toBe('beforemiddleafter');
    expect(doc.querySelector('strong')?.textContent).toBe('middle');
    expect(Array.from(doc.querySelectorAll('img'), (img) => img.getAttribute('src'))).toEqual(['/keep.png']);
  });

  it('preserves images without a source', () => {
    expect(transform('<img alt="placeholder">').querySelector('img')?.getAttribute('alt')).toBe('placeholder');
  });

  it('filters data images through the editor paste pipeline while preserving other content', () => {
    editor.view.pasteHTML(
      '<p>before<img src="data:image/png;base64,aA=="><strong>middle</strong><img src="https://example.com/keep.png">after</p>',
      new Event('paste') as ClipboardEvent
    );

    expect(editor.getText()).toBe('beforemiddleafter');
    expect(editor.getHTML()).toContain('<strong>middle</strong>');
    expect(editor.view.dom.querySelectorAll('img')).toHaveLength(1);
    expect(editor.view.dom.querySelector('img')?.getAttribute('src')).toBe('https://example.com/keep.png');
  });

  it.each([false, true])('handles image HTML and an image file only once (upload enabled: %s)', (uploadEnabled) => {
    editor.destroy();
    editor = new Editor({
      extensions: [StarterKit, Image.configure({ inline: true }), DisableDataUriPaste.configure({ deferImageFiles: uploadEnabled })],
    });
    const upload = vi.fn();
    if (uploadEnabled) {
      // Match fof/upload's listener registration order and preventDefault contract.
      editor.view.dom.addEventListener('paste', (event) => {
        event.preventDefault();
        upload();
      });
    }
    const event = new Event('paste', { bubbles: true, cancelable: true });
    const file = new File(['image'], 'image.png', { type: 'image/png' });
    Object.defineProperty(event, 'clipboardData', {
      value: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
        getData: (type: string) => (type === 'text/html' ? '<img src="https://example.com/copied.png">' : ''),
        files: [file],
      },
    });
    editor.view.dom.dispatchEvent(event);

    expect(editor.view.dom.querySelectorAll('img[src="https://example.com/copied.png"]')).toHaveLength(uploadEnabled ? 0 : 1);
    expect(upload).toHaveBeenCalledTimes(uploadEnabled ? 1 : 0);
  });

  it('keeps URL-only image paste when upload is available but no image file is present', () => {
    editor.destroy();
    editor = new Editor({ extensions: [StarterKit, Image.configure({ inline: true }), DisableDataUriPaste.configure({ deferImageFiles: true })] });
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: { items: [], files: [], getData: (type: string) => (type === 'text/html' ? '<img src="https://example.com/keep.png">' : '') },
    });
    editor.view.dom.dispatchEvent(event);
    expect(editor.view.dom.querySelector('img')?.getAttribute('src')).toBe('https://example.com/keep.png');
  });
});
