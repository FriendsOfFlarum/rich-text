import m from 'mithril';
import $ from 'jquery';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import patchMithril from 'flarum/common/utils/patchMithril';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InsertLinkDropdown from '../src/common/components/InsertLinkDropdown';
import SafariModalHack from '../src/common/components/SafariModalHack';

const { app } = vi.hoisted(() => ({
  app: {
    screen: () => 'phone',
    translator: { trans: (key: string) => key },
    modal: {} as any,
    composer: { editor: { focus: vi.fn() } },
    forum: { attribute: () => null },
  },
}));
vi.mock('flarum/common/app', () => ({ default: app }));
vi.mock('flarum/common/components/Tooltip', () => ({ default: { view: (vnode: { children: unknown }) => vnode.children } }));

describe('mobile link form', () => {
  let editor: Editor;
  let dropdown: InsertLinkDropdown;
  let root: HTMLDivElement;
  let modalRoot: HTMLDivElement;
  let modal: { component: typeof SafariModalHack; attrs: Record<string, unknown> } | null;

  beforeEach(() => {
    vi.stubGlobal('m', m);
    Object.assign(m, { Fragment: '[' });
    vi.stubGlobal('$', $);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 0)
    );
    patchMithril(globalThis);
    editor = new Editor({ extensions: [StarterKit] });
    root = document.createElement('div');
    modalRoot = document.createElement('div');
    document.body.append(root, modalRoot);
    modal = null;
    app.modal = {
      show: (component: typeof SafariModalHack, attrs: Record<string, unknown>) => {
        modal = { component, attrs };
        m.redraw.sync();
      },
      close: () => {
        modal = null;
        m.redraw.sync();
      },
    };
    m.mount(modalRoot, {
      view: () =>
        modal
          ? m(modal.component, {
              ...modal.attrs,
              state: { modal: {} },
              animateShow: (callback: () => void) => callback(),
              animateHide: () => {},
            } as any)
          : null,
    });
    m.mount(root, {
      view: () =>
        m(InsertLinkDropdown, {
          editor,
          tooltip: 'Link',
          icon: 'fas fa-link',
          label: '',
          helperText: '',
          oninit: (vnode: any) => {
            dropdown = vnode.state;
          },
        }),
    });
  });

  afterEach(() => {
    m.mount(root, null);
    m.mount(modalRoot, null);
    root.remove();
    modalRoot.remove();
    editor.destroy();
  });

  function input(name: string, value: string) {
    const field = modalRoot.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    field.focus();
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    m.redraw.sync();
  }

  it('keeps URL and title values across redraws and submits them into the editor', () => {
    root.querySelector<HTMLButtonElement>('.Dropdown-toggle')!.focus();
    $(root).find('.Dropdown-toggle').trigger('click');
    input('text', 'Label');
    input('href', 'https://example.com/mobile');
    input('title', 'Mobile title');
    expect(dropdown.href()).toBe('https://example.com/mobile');
    expect(dropdown.title()).toBe('Mobile title');

    modalRoot.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(editor.state.doc.textContent).toBe('Label ');
    expect(editor.state.doc.firstChild?.firstChild?.marks[0].attrs).toMatchObject({ href: 'https://example.com/mobile', title: 'Mobile title' });
  });

  it('updates an existing link through the modal without resetting its fields', () => {
    editor.commands.setContent('<p><a href="https://example.com/old" title="Old title">Label</a></p>');
    editor.commands.setTextSelection(3);
    m.redraw.sync();
    $(root).find('.Dropdown-toggle').trigger('click');
    expect(modalRoot.querySelector('input[name="text"]')).toBeNull();
    input('href', 'https://example.com/new');
    input('title', 'New title');
    modalRoot.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(editor.state.doc.textContent).toBe('Label');
    expect(editor.state.doc.firstChild?.firstChild?.marks[0].attrs).toMatchObject({ href: 'https://example.com/new', title: 'New title' });
  });

  it('does not modify the document when the modal is dismissed', () => {
    $(root).find('.Dropdown-toggle').trigger('click');
    input('href', 'https://example.com/cancelled');
    app.modal.close();
    expect(dropdown.isOpen).toBe(false);
    expect(editor.state.doc.textContent).toBe('');
    expect(editor.state.doc.firstChild?.marks).toHaveLength(0);
  });

  it('closes the mobile modal when removing an existing link', () => {
    editor.commands.setContent('<p><a href="https://example.com/old">Label</a></p>');
    editor.commands.setTextSelection(3);
    m.redraw.sync();
    $(root).find('.Dropdown-toggle').trigger('click');
    modalRoot.querySelector<HTMLButtonElement>('.Button--danger')!.click();

    expect(modalRoot.querySelector('form')).toBeNull();
    expect(editor.state.doc.textContent).toBe('Label');
    expect(editor.state.doc.firstChild?.firstChild?.marks).toHaveLength(0);
  });
});
