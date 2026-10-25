import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeHistory } from '@tiptap/pm/history';
import TiptapEditorDriver from '../src/common/tiptap/TiptapEditorDriver';
import { parseUploadImage } from '../src/common/tiptap/markdown/uploadImage';

const preview =
  '[upl-image-preview uuid=original-uuid url=https://example.com/full.png alt=My sample image.png thumbnail_url=https://example.com/thumb.png]';
const card = '[upl-image uuid=card-uuid size=10 KB url=https://example.com/card.png]My image card.png[/upl-image]';

describe('FoF Upload image previews', () => {
  let driver: TiptapEditorDriver;
  let target: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal('app', { forum: { attribute: () => false }, session: { user: null } });
    vi.stubGlobal('m', { redraw: vi.fn() });
    vi.stubGlobal('$', () => ({ trigger: vi.fn() }));
    target = document.createElement('div');
    document.body.append(target);
    driver = new TiptapEditorDriver(target, {
      value: '',
      classNames: [],
      disabled: false,
      placeholder: '',
      oninput: vi.fn(),
      inputListeners: [],
      onsubmit: vi.fn(),
    });
    vi.spyOn(driver, 'focus').mockImplementation(() => {});
  });

  afterEach(() => {
    driver.destroy();
    target.remove();
  });

  function load(source: string) {
    driver.editor.commands.setContent(driver.parser.parse(source).toJSON(), { emitUpdate: false });
  }

  function serialize() {
    return driver.serializeContent(driver.editor.state.doc);
  }

  function uploads() {
    const result: string[] = [];
    driver.editor.state.doc.descendants((node) => {
      if (node.type.name === 'fofUploadImage') result.push(node.attrs.bbcode);
    });
    return result;
  }

  it.each([
    [preview, 'https://example.com/thumb.png', 'My sample image.png'],
    [card, 'https://example.com/card.png', 'My image card.png'],
    ['[upl-image uuid=card-uuid size=10 KB url=/image.png]My image [2026].png[/upl-image]', '/image.png', 'My image [2026].png'],
    [
      '[UPL-IMAGE-PREVIEW alt="My [image] & photo.png" url="https://example.com/full image.png" uuid="quoted-uuid"]',
      'https://example.com/full image.png',
      'My [image] & photo.png',
    ],
    ["[upl-image-preview thumbnail_url='/assets/thumb.png' uuid='thumb-uuid' alt='Türkçe resim.png']", '/assets/thumb.png', 'Türkçe resim.png'],
    ['[upl-image-preview uuid=x url=/assets/full.png future="a b [c]" alt=photo.png]', '/assets/full.png', 'photo.png'],
    [
      '[upl-image-preview uuid=x url=https://example.com/full.png?one=1&two=2 alt=photo.png]',
      'https://example.com/full.png?one=1&two=2',
      'photo.png',
    ],
  ])('renders %j and preserves its complete original BBCode', (source, src, alt) => {
    load(source);
    expect(uploads()).toEqual([source]);
    expect(driver.editor.view.dom.querySelector('img')?.getAttribute('src')).toBe(src);
    expect(driver.editor.view.dom.querySelector('img')?.getAttribute('alt')).toBe(alt);
    expect(serialize()).toBe(source);

    for (let i = 0; i < 5; i++) {
      load(serialize());
      expect(serialize()).toBe(source);
    }
    driver.editor.state.doc.check();
  });

  it('keeps multiple previews and surrounding text intact during upload insertion', () => {
    load('prefix]suffix');
    driver.insertAt(8, preview + '\n', false);
    driver.insertAtCursor(card + '\n', false);
    driver.insertAtCursor('AFTER', true);

    expect(uploads()).toEqual([preview, card]);
    expect(serialize()).toBe('prefix]' + preview + card + 'AFTERsuffix');
  });

  it('retains upload metadata when copying HTML between rich-text editors', () => {
    load(preview);
    const html = driver.editor.getHTML();
    driver.editor.commands.setContent(html, { emitUpdate: false });
    expect(uploads()).toEqual([preview]);
    expect(serialize()).toBe(preview);
  });

  it.each(['> ' + preview, '>! ' + preview, '* ' + preview, '**' + preview + '**'])(
    'preserves upload source inside surrounding Markdown: %j',
    (source) => {
      load(source);
      expect(uploads()).toEqual([preview]);
      expect(serialize().trimEnd()).toBe(source);
    }
  );

  it('preserves the upload atom when Enter is pressed in compact mode', () => {
    const params = driver.attrs;
    driver.destroy();
    vi.spyOn(app.forum, 'attribute').mockImplementation((key) => key === 'richTextForceCompactParagraphs');
    driver = new TiptapEditorDriver(target, params);
    vi.spyOn(driver, 'focus').mockImplementation(() => {});
    load(preview);
    driver.moveCursorTo(driver.editor.state.doc.content.size - 1);

    driver.editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));

    expect(uploads()).toEqual([preview]);
    expect(driver.editor.state.doc.firstChild?.lastChild?.type.name).toBe('hardBreak');
    driver.editor.state.doc.check();
  });

  it('keeps standard Markdown images working as normal image nodes', () => {
    const source = '![plain image](https://example.com/plain.png)';
    load(source);
    expect(uploads()).toEqual([]);
    expect(driver.editor.state.doc.firstChild?.firstChild?.type.name).toBe('image');
    expect(serialize()).toBe(source);
  });

  it('exposes the original BBCode as the atom text representation', () => {
    load(preview);
    expect(driver.editor.getText()).toBe(preview);
  });

  it('supports deletion and undo without losing upload metadata', () => {
    load(preview);
    driver.editor.view.dispatch(closeHistory(driver.editor.state.tr));
    driver.editor.commands.setNodeSelection(1);
    driver.editor.commands.deleteSelection();
    expect(uploads()).toEqual([]);
    expect(serialize().trim()).toBe('');
    driver.editor.commands.undo();
    expect(uploads()).toEqual([preview]);
    expect(serialize()).toBe(preview);
  });

  it.each(['`' + preview + '`', '```\n' + preview + '\n```', '\\' + preview])(
    'does not render an example written as code or escaped text: %j',
    (source) => {
      load(source);
      expect(uploads()).toEqual([]);
      expect(driver.editor.view.dom.querySelector('img')).toBeNull();
    }
  );

  it.each([
    '[upl-image-preview uuid=x]',
    '[upl-image-preview url=https://example.com/image.png]',
    '[upl-image-preview uuid=x url="https://example.com/unclosed.png]',
    '[upl-image-preview uuid=x url=javascript:alert(1)]',
    '[upl-image-preview uuid=x url=data:image/png;base64,aA==]',
    '[upl-image-preview uuid=x url=file:///etc/passwd]',
    '[upl-image-preview uuid=x url=https://example.com/image.png thumbnail_url=javascript:alert(1)]',
    '[upl-image uuid=x url=https://example.com/image.png]missing close',
    '[upl-file uuid=x size=1 KB]document.pdf[/upl-file]',
    '[img]https://example.com/image.png[/img]',
  ])('leaves unsupported or invalid content as text: %j', (source) => {
    load(source);
    expect(uploads()).toEqual([]);
    expect(driver.editor.view.dom.querySelector('img')).toBeNull();
    expect(driver.editor.state.doc.textContent).toContain(source);
    expect(serialize()).toBe(source);
  });

  it('does not trust source attributes in pasted upload preview HTML', () => {
    const element = document.createElement('span');
    element.setAttribute('data-fof-upload-bbcode', '[upl-image-preview uuid=x url=javascript:alert(1)]');
    element.innerHTML = '<img src="https://example.com/other.png">';
    driver.editor.commands.setContent(element.outerHTML, { emitUpdate: false });
    expect(uploads()).toEqual([]);
  });

  it('renders attribute text safely without treating it as HTML', () => {
    const source = '[upl-image-preview uuid=x url=/image.png alt="<svg onload=alert(1)> & photo"]';
    load(source);
    expect(driver.editor.view.dom.querySelector('svg')).toBeNull();
    expect(driver.editor.view.dom.querySelector('img')?.getAttribute('alt')).toBe('<svg onload=alert(1)> & photo');
    expect(serialize()).toBe(source);
  });

  it('handles a long unquoted attribute without recursive regular-expression matching', () => {
    const source = '[upl-image-preview uuid=x url=/image.png alt=' + ';a'.repeat(10000) + ']';
    expect(parseUploadImage(source)?.bbcode).toBe(source);
  });
});
