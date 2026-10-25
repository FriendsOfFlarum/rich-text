import m from 'mithril';
import $ from 'jquery';
import TextEditor from 'flarum/common/components/TextEditor';
import applyEditor from '../src/common/applyEditor';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { app, RichDriver } = vi.hoisted(() => {
  class Driver {
    el: HTMLElement;
    editor = {};
    destroy = vi.fn(() => this.el.remove());
    focus = vi.fn();
    constructor(target: HTMLElement, params: { classNames: string[]; value: string }) {
      this.el = document.createElement('textarea');
      this.el.className = params.classNames.join(' ');
      target.append(this.el);
    }
  }
  return {
    RichDriver: Driver,
    app: {
      currentInitializerExtension: 'fof-rich-text',
      data: { resources: [] },
      forum: { attribute: () => true },
      session: { user: { preferences: () => ({ useRichTextEditor: false }), savePreferences: vi.fn() } },
      composer: { editor: null as Driver | null },
      alerts: { show: vi.fn() },
      translator: { trans: (key: string) => key },
      handleErrorOnce: (...args: unknown[]) => {
        throw args[args.length - 1];
      },
    },
  };
});

vi.mock('flarum/common/app', () => ({ default: app }));
vi.mock('../src/common/tiptap/TiptapEditorDriver', () => ({ default: RichDriver }));
vi.mock('../src/common/components/TiptapMenu', () => ({ default: { view: () => null } }));
vi.mock('flarum/common/components/Tooltip', () => ({ default: { view: (vnode: { children: unknown }) => vnode.children } }));

describe('editor mode switching lifecycle', () => {
  let root: HTMLDivElement;
  let component: TextEditor;
  let composer: typeof app.composer;
  let preferences: { useRichTextEditor: boolean };
  let onBuilt: ReturnType<typeof vi.fn>;

  beforeAll(() => applyEditor());
  beforeEach(async () => {
    Object.assign(m, { Fragment: '[' });
    vi.stubGlobal('m', m);
    vi.stubGlobal('app', app);
    vi.stubGlobal('$', $);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 0)
    );
    preferences = { useRichTextEditor: false };
    app.session.user.preferences = () => preferences;
    app.session.user.savePreferences.mockReset().mockImplementation((value) => {
      Object.assign(preferences, value);
      return Promise.resolve();
    });
    app.alerts.show.mockClear();
    composer = { editor: null };
    app.composer = composer;
    onBuilt = vi.fn();
    root = document.createElement('div');
    document.body.append(root);
    m.mount(root, {
      view: () =>
        m(TextEditor, {
          composer,
          value: 'keep this content',
          onchange: vi.fn(),
          onsubmit: vi.fn(),
          onTextEditorBuilt: onBuilt,
          oninit: (vnode: any) => {
            component = vnode.state;
          },
        }),
    });
    await vi.waitFor(() => expect(composer.editor).not.toBeNull());
    vi.spyOn(composer.editor!, 'destroy');
  });

  afterEach(() => {
    composer.editor?.destroy();
    m.mount(root, null);
    root.remove();
  });

  function toggle(): Promise<void> {
    const tooltip = component.controlItems().get('rich-text') as m.Vnode;
    const button = (tooltip.children as m.Vnode<{ onclick: () => Promise<void> }>[])[0];
    return button.attrs.onclick();
  }

  function pendingSave() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    app.session.user.savePreferences.mockImplementationOnce((value) => {
      Object.assign(preferences, value);
      return promise;
    });
    return resolve;
  }

  it('runs core onbuild hooks after switching and preserves the editor container', async () => {
    const original = composer.editor!;
    await toggle();
    expect(original.destroy).toHaveBeenCalledOnce();
    expect(onBuilt).toHaveBeenCalledTimes(2);
    expect(composer.editor).not.toBe(original);
    expect(root.querySelectorAll('.TextEditor-editor')).toHaveLength(1);
  });

  it('ignores repeated clicks while a switch is pending', async () => {
    const resolve = pendingSave();
    const first = toggle();
    await toggle();
    expect(app.session.user.savePreferences).toHaveBeenCalledOnce();
    resolve();
    await first;
    expect(onBuilt).toHaveBeenCalledTimes(2);
  });

  it('does not destroy or rebuild a closed composer after a delayed response', async () => {
    const resolve = pendingSave();
    const switching = toggle();
    composer.editor!.destroy();
    composer.editor = null;
    root.remove();
    resolve();
    await expect(switching).resolves.toBeUndefined();
    expect(onBuilt).toHaveBeenCalledOnce();
    expect(app.alerts.show).not.toHaveBeenCalled();
  });

  it('does not touch a different global composer', async () => {
    const other = new RichDriver(document.createElement('div'), { classNames: [], value: '' });
    app.composer = { editor: other };
    await toggle();
    expect(other.destroy).not.toHaveBeenCalled();
    expect(other.focus).not.toHaveBeenCalled();
    expect(onBuilt).toHaveBeenCalledTimes(2);
  });

  it('keeps the rich toolbar while a switch to Markdown is still pending', async () => {
    await toggle();
    const resolve = pendingSave();
    const switching = toggle();
    expect(preferences.useRichTextEditor).toBe(false);
    expect(component.toolbarItems().has('richText')).toBe(true);
    resolve();
    await switching;
    expect(component.toolbarItems().has('richText')).toBe(false);
  });

  it('keeps a working editor and allows retrying after a failed preference request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const original = composer.editor!;
    app.session.user.savePreferences.mockRejectedValueOnce(new Error('request failed'));
    await toggle();
    expect(composer.editor).toBe(original);
    expect(original.destroy).not.toHaveBeenCalled();
    expect(component._richTextToggleLoading).toBe(false);
    expect(app.alerts.show).toHaveBeenCalledOnce();

    await toggle();
    expect(vi.mocked(console.error).mock.calls.map((call) => String(call[1]))).toEqual(['Error: request failed']);
    expect(onBuilt).toHaveBeenCalledTimes(2);
  });
});
