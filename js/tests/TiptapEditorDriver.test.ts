import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Selection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import AutocompleteReader from 'flarum/common/utils/AutocompleteReader';
import TiptapEditorDriver from '../src/common/tiptap/TiptapEditorDriver';

describe('TiptapEditorDriver insertion', () => {
  let driver: TiptapEditorDriver;
  let target: HTMLDivElement;
  let oninput: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('app', { forum: { attribute: () => false }, session: { user: null } });
    vi.stubGlobal('m', { redraw: vi.fn() });
    vi.stubGlobal('$', () => ({ trigger: vi.fn() }));
    target = document.createElement('div');
    document.body.append(target);
    oninput = vi.fn();
    driver = new TiptapEditorDriver(target, {
      value: '',
      classNames: [],
      disabled: false,
      placeholder: '',
      oninput,
      inputListeners: [],
      onsubmit: vi.fn(),
    });
    // Selection is asserted below; jsdom does not implement browser layout for scrolling on focus.
    vi.spyOn(driver, 'focus').mockImplementation(() => {});
  });

  afterEach(() => {
    driver.destroy();
    target.remove();
  });

  function setContent(markdown: string) {
    driver.editor.commands.setContent(driver.parser.parse(markdown).toJSON(), { emitUpdate: false });
    driver.moveCursorTo(Selection.atEnd(driver.editor.state.doc).from);
    driver.editor.view.dispatch(closeHistory(driver.editor.state.tr));
    oninput.mockClear();
  }

  function markdown() {
    return driver.serializeContent(driver.editor.state.doc);
  }

  it('preserves the character immediately before an unescaped insertion', () => {
    setContent('first]');

    driver.insertAtCursor('[second]\n', false);

    expect(markdown()).toContain('first]');
    expect(markdown()).toContain('[second]');
  });

  it('preserves every closing bracket when inserting multiple upload BBCodes', () => {
    const uploads = ['first', 'second', 'third'].map(
      (id) => `[upl-image-preview uuid=${id} url=https://example.com/${id}.png alt=${id}.png thumbnail_url=https://example.com/${id}.png]`
    );

    uploads.forEach((bbcode) => driver.insertAtCursor(bbcode + '\n', false));

    uploads.forEach((bbcode) => expect(markdown()).toContain(bbcode));
    expect(markdown().match(/\]/g)).toHaveLength(3);
    expect(oninput).toHaveBeenLastCalledWith(markdown());
  });

  it('inserts at the beginning without removing existing content', () => {
    setContent('existing');

    driver.insertAt(1, 'new', false);

    expect(driver.editor.state.doc.textContent).toBe('newexisting');
  });

  it('inserts in the middle without removing either adjacent character', () => {
    setContent('beforeafter');

    driver.insertAt(7, 'inserted', false);

    expect(driver.editor.state.doc.textContent).toBe('beforeinsertedafter');
  });

  it('replaces only the requested selection', () => {
    setContent('beforeREMOVEafter');

    driver.insertBetween(7, 13, 'replacement', false);

    expect(driver.editor.state.doc.textContent).toBe('beforereplacementafter');
  });

  it('keeps escaped input as literal text', () => {
    setContent('before');

    driver.insertAtCursor('**literal**', true);

    expect(driver.editor.state.doc.textContent).toBe('before**literal**');
    expect(driver.editor.state.doc.firstChild?.lastChild?.marks).toHaveLength(0);
  });

  it('keeps programmatically inserted Markdown literal inside a code block', () => {
    setContent('```\nbefore\n```');
    driver.insertAt(7, '**literal** ', false);
    expect(driver.editor.state.doc.firstChild?.type.name).toBe('codeBlock');
    expect(driver.editor.state.doc.firstChild?.textContent).toBe('before**literal** ');
  });

  it('places the cursor after parsed inline content rather than its Markdown source length', () => {
    setContent('beforeafter');

    driver.insertAt(7, '**bold**', false);
    driver.insertAtCursor('X', true);

    expect(driver.editor.state.doc.textContent).toBe('beforeboldXafter');
  });

  it('does not add blank paragraphs after an inserted quote', () => {
    driver.insertAtCursor('> quoted\n\n', false);

    expect(markdown().trimEnd()).toBe('> quoted');
    expect(driver.editor.state.doc.content.childCount).toBe(2);
    expect(driver.editor.state.doc.lastChild?.type.name).toBe('paragraph');
    expect(driver.editor.state.doc.lastChild?.content.size).toBe(0);
  });

  it.each(['', 'before', 'before\nafter', '**bold**', '`code`', '- first\n- second'])(
    'preserves existing content when appending to %j',
    (initial) => {
      setContent(initial);
      const before = driver.editor.state.doc.textContent;

      driver.insertAtCursor('[upload]\n', false);

      expect(driver.editor.state.doc.textContent).toBe(before + '[upload]');
      driver.editor.state.doc.check();
    }
  );

  it('keeps the cursor after escaped insertion at an explicit position', () => {
    setContent('beforeafter');

    driver.insertAt(7, 'first', true);
    driver.insertAtCursor('second', true);

    expect(driver.editor.state.doc.textContent).toBe('beforefirstsecondafter');
  });

  it('replaces text before the cursor without deleting its prefix', () => {
    setContent('before@name');

    driver.replaceBeforeCursor(7, '@replacement ', false);
    driver.insertAtCursor('after', true);

    expect(driver.editor.state.doc.textContent).toBe('before@replacement after');
  });

  it('preserves a trailing space after parsed inline content', () => {
    setContent('beforeafter');

    driver.insertAt(7, '**bold** ', false);
    driver.insertAtCursor('next', true);

    expect(driver.editor.state.doc.textContent).toBe('beforebold nextafter');
  });

  it('preserves Unicode characters around an insertion', () => {
    setContent('önce😀sonra');

    driver.insertAt(7, '**yeni**', false);
    driver.insertAtCursor('!', true);

    expect(driver.editor.state.doc.textContent).toBe('önce😀yeni!sonra');
  });

  it('keeps inserted images and places subsequent text after them', () => {
    setContent('beforeafter');

    driver.insertAt(7, '![image](https://example.com/image.png)', false);
    driver.insertAtCursor('next', true);

    expect(markdown()).toBe('before![image](https://example.com/image.png)nextafter');
  });

  it('preserves surrounding text when inserting a quote in the middle of a paragraph', () => {
    setContent('beforeafter');

    driver.insertAt(7, '> quoted\n\n', false);

    expect(driver.editor.state.doc.toJSON().content.map((node: { type: string }) => node.type)).toEqual(['paragraph', 'blockquote', 'paragraph']);
    expect(driver.editor.state.doc.textContent).toBe('beforequotedafter');
    driver.editor.state.doc.check();
  });

  it('keeps multiple quote insertions free of accumulated empty paragraphs', () => {
    driver.insertAtCursor('> first\n\n', false);
    driver.insertAtCursor('> second\n\n', false);

    expect(driver.editor.state.doc.toJSON().content.map((node: { type: string }) => node.type)).toEqual(['blockquote', 'blockquote', 'paragraph']);
    expect(markdown().trimEnd()).toBe('> first\n\n> second');
  });

  it('supports undo and redo of an insertion', () => {
    setContent('before');

    driver.insertAtCursor('[upload]\n', false);
    expect(markdown()).toBe('before[upload]');

    driver.editor.commands.undo();
    expect(markdown()).toBe('before');

    driver.editor.commands.redo();
    expect(markdown()).toBe('before[upload]');
  });

  it.each([
    ['- first\n- second', 'bulletList'],
    ['1. first\n2. second', 'orderedList'],
    ['# heading', 'heading'],
    ['```\ncode\n```', 'codeBlock'],
    ['>! hidden', 'spoiler'],
  ])('preserves the structure of inserted Markdown %j', (input, nodeType) => {
    setContent('beforeafter');

    driver.insertAt(7, input, false);

    expect(driver.editor.state.doc.firstChild?.textContent).toBe('before');
    expect(driver.editor.state.doc.child(1).type.name).toBe(nodeType);
    expect(driver.editor.state.doc.lastChild?.textContent).toBe('after');
    driver.editor.state.doc.check();
  });

  it('deletes only the requested range when replacing it with empty Markdown', () => {
    setContent('beforeREMOVEafter');

    driver.insertBetween(7, 13, '', false);

    expect(driver.editor.state.doc.textContent).toBe('beforeafter');
  });

  it('removes its input listeners when the driver is destroyed', () => {
    const listener = vi.fn();
    driver.attrs.inputListeners.push(listener);
    target.dispatchEvent(new Event('input'));
    expect(listener).toHaveBeenCalledOnce();

    driver.destroy();
    target.dispatchEvent(new Event('input'));
    target.dispatchEvent(new Event('click'));
    target.dispatchEvent(new Event('keyup'));
    expect(listener).toHaveBeenCalledOnce();
  });

  describe('text before the cursor', () => {
    it.each([
      ['hello **world**', 11, 'hello world'],
      ['hello **world**', 7, 'o world'],
      ['**hello** *world*', 30, 'hello world'],
      ['first\nsecond', 30, 'first\nsecond'],
      ['previous\n\ncurrent', 30, 'current'],
      ['before![image](https://example.com/image.png)after', 30, 'before\nafter'],
      ['önce **😀sonra**', 30, 'önce 😀sonra'],
      ['', 30, ''],
      ['hello', 0, ''],
    ])('reads text before the cursor from %j (limit %i)', (input, count, expected) => {
      setContent(input);

      expect(driver.getLastNChars(count)).toBe(expected);
    });

    it('excludes text after the cursor', () => {
      setContent('hello **world** after');
      driver.moveCursorTo(9);

      expect(driver.getLastNChars(30)).toBe('hello wo');
    });

    it.each<[string, string, number, RegExp, string, string]>([
      ['@**user**', '@', 30, /\S+/, 'user', '@replacement '],
      [':**smi**', ':', 15, /[a-z0-9]|\+|\-|_|\:/, 'smi', '😀 '],
    ])('completes %j across a formatting boundary using the core autocomplete reader', (input, symbol, count, validBit, typed, replacement) => {
      setContent(input);
      const cursor = driver.getSelectionRange()[0];
      const match = new AutocompleteReader(symbol).check(driver.getLastNChars(count), cursor, validBit);

      expect(match?.typed).toBe(typed);
      expect(match?.absoluteStart).toBe(2);
      driver.replaceBeforeCursor(match!.absoluteStart - 1, replacement, true);

      expect(driver.editor.state.doc.textContent).toBe(replacement);
      driver.editor.state.doc.check();
    });

    it.each([
      ['word**@user**', '@'],
      ['word**:smi**', ':'],
    ])('does not treat a formatting boundary in %j as whitespace', (input, symbol) => {
      setContent(input);
      const cursor = driver.getSelectionRange()[0];

      expect(new AutocompleteReader(symbol).check(driver.getLastNChars(30), cursor, /\S+/)).toBeNull();
    });

    it.each(['prefix\n@**user**', 'prefix![image](https://example.com/image.png)@**user**'])(
      'keeps completion offsets aligned after an inline leaf in %j',
      (input) => {
        setContent(input);
        const cursor = driver.getSelectionRange()[0];
        const match = new AutocompleteReader('@').check(driver.getLastNChars(30), cursor, /\S+/);

        expect(match?.typed).toBe('user');
        expect(match?.absoluteStart).toBe(9);
        driver.replaceBeforeCursor(match!.absoluteStart - 1, '@replacement ', true);

        expect(driver.editor.state.doc.textContent).toBe('prefix@replacement ');
        expect(driver.editor.state.doc.firstChild?.child(1).type.name).toBe(input.includes('![') ? 'image' : 'hardBreak');
      }
    );
  });
});
