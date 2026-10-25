import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Stream from 'flarum/common/utils/Stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InsertLinkDropdown from '../src/common/components/InsertLinkDropdown';

vi.mock('flarum/common/app', () => ({ default: {} }));
// Isolate the form action while keeping Tiptap transactions and streams real.
vi.mock('flarum/common/components/Button', () => ({ default: class {} }));
vi.mock('../src/common/components/FormDropdown', () => ({ default: class {} }));

describe('link insertion and editing', () => {
  let editor: Editor;
  let dropdown: InsertLinkDropdown;

  beforeEach(() => {
    // Browser focus and scrolling are not needed to verify document changes.
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 0)
    );
    editor = new Editor({ extensions: [StarterKit.configure({ link: { openOnClick: false } })] });
    dropdown = new InsertLinkDropdown();
    dropdown.attrs = { editor, tooltip: 'Link', icon: 'fas fa-link', label: '', helperText: '' };
    dropdown.text = Stream('New label');
    dropdown.href = Stream('https://new.example');
    dropdown.title = Stream('New title');
  });

  afterEach(() => editor.destroy());

  function content() {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'before ' },
            { type: 'text', text: 'Label', marks: [{ type: 'link', attrs: { href: 'https://old.example', title: 'Old title' } }] },
            { type: 'text', text: ' after' },
          ],
        },
      ],
    });
  }

  function insert() {
    dropdown.selectionEmpty = editor.state.selection.empty;
    dropdown.active = editor.isActive('link');
    dropdown.insert(new Event('submit') as SubmitEvent);
    editor.state.doc.check();
  }

  function links() {
    const result: { text: string; href: string; title: string | null }[] = [];
    editor.state.doc.descendants((node) => {
      const link = node.marks.find((mark) => mark.type.name === 'link');
      if (node.isText && link) result.push({ text: node.text!, href: link.attrs.href, title: link.attrs.title });
    });
    return result;
  }

  it.each([9, 10, 13])('updates the existing link with a collapsed cursor at position %i', (position) => {
    content();
    editor.commands.setTextSelection(position);

    insert();

    expect(links()).toEqual([{ text: 'Label', href: 'https://new.example', title: 'New title' }]);
    expect(editor.state.doc.textContent).toBe('before Label after');
    expect(editor.state.selection.empty).toBe(true);
    expect(editor.state.selection.from).toBe(position);
  });

  it('changes only the selected part of a link', () => {
    content();
    editor.commands.setTextSelection({ from: 9, to: 12 });

    insert();

    expect(links()).toEqual([
      { text: 'L', href: 'https://old.example', title: 'Old title' },
      { text: 'abe', href: 'https://new.example', title: 'New title' },
      { text: 'l', href: 'https://old.example', title: 'Old title' },
    ]);
  });

  it('applies a link to selected plain text', () => {
    content();
    editor.commands.setTextSelection({ from: 1, to: 7 });

    insert();

    expect(links()).toContainEqual({ text: 'before', href: 'https://new.example', title: 'New title' });
    expect(links()).toContainEqual({ text: 'Label', href: 'https://old.example', title: 'Old title' });
  });

  it('inserts a new labelled link at a plain cursor position', () => {
    editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'before ' }] }] });
    editor.commands.setTextSelection(8);

    insert();

    expect(links()).toEqual([{ text: 'New label', href: 'https://new.example', title: 'New title' }]);
    expect(editor.state.doc.textContent).toBe('before New label ');
    expect(dropdown.href()).toBe('');
    expect(dropdown.title()).toBe('');
  });

  it('allows removing the title while updating the whole link', () => {
    content();
    editor.commands.setTextSelection(10);
    dropdown.title('');

    insert();

    expect(links()).toEqual([{ text: 'Label', href: 'https://new.example', title: '' }]);
  });

  it('updates a link across formatting boundaries without removing the formatting', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'plain', marks: [{ type: 'link', attrs: { href: 'https://old.example' } }] },
            { type: 'text', text: 'bold', marks: [{ type: 'link', attrs: { href: 'https://old.example' } }, { type: 'bold' }] },
          ],
        },
      ],
    });
    editor.commands.setTextSelection(7);

    insert();

    expect(links()).toEqual([
      { text: 'plain', href: 'https://new.example', title: 'New title' },
      { text: 'bold', href: 'https://new.example', title: 'New title' },
    ]);
    expect(editor.state.doc.firstChild?.lastChild?.marks.some((mark) => mark.type.name === 'bold')).toBe(true);
  });
});
