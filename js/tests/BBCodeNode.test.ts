import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeHistory } from '@tiptap/pm/history';
import ItemList from 'flarum/common/utils/ItemList';
import TiptapEditorDriver from '../src/common/tiptap/TiptapEditorDriver';
import type { BBCodeNodeDefinition } from '../src/common/tiptap/extensions/BBCodeNode';

const foo: BBCodeNodeDefinition = {
  name: 'testFoo',
  pattern: /\[foo\]([a-z0-9]+\.png)\[\/foo\]/i,
  render: (match) => ['img', { src: '/foo/' + match[1] }],
};

const bar: BBCodeNodeDefinition = {
  name: 'testBar',
  pattern: /\[bar\]([a-z]+)\[\/bar\]/i,
  render: (match) => ['strong', {}, match[1]],
};

const source = '[foo]abc123.png[/foo]';

describe('BBCode nodes registered by other extensions', () => {
  let driver: TiptapEditorDriver;
  let target: HTMLDivElement;

  function create(definitions: BBCodeNodeDefinition[]) {
    vi.spyOn(TiptapEditorDriver.prototype, 'bbcodeNodes').mockImplementation(() => {
      const items = new ItemList<BBCodeNodeDefinition>();
      definitions.forEach((definition) => items.add(definition.name, definition));
      return items;
    });
    driver?.destroy();
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
  }

  beforeEach(() => {
    vi.stubGlobal('app', { forum: { attribute: () => false }, session: { user: null } });
    vi.stubGlobal('m', { redraw: vi.fn() });
    vi.stubGlobal('$', () => ({ trigger: vi.fn() }));
    target = document.createElement('div');
    document.body.append(target);
    create([foo, bar]);
  });

  afterEach(() => {
    driver.destroy();
    target.remove();
  });

  function load(markdown: string) {
    driver.editor.commands.setContent(driver.parser.parse(markdown).toJSON(), { emitUpdate: false });
  }

  function serialize() {
    return driver.serializeContent(driver.editor.state.doc);
  }

  function nodes(name = foo.name) {
    const result: string[] = [];
    driver.editor.state.doc.descendants((node) => {
      if (node.type.name === name) result.push(node.attrs.bbcode);
    });
    return result;
  }

  it('renders the registered DOM and saves the exact original source', () => {
    load(source);
    expect(nodes()).toEqual([source]);
    expect(driver.editor.view.dom.querySelector('img')?.getAttribute('src')).toBe('/foo/abc123.png');
    expect(serialize()).toBe(source);

    for (let i = 0; i < 5; i++) {
      load(serialize());
      expect(serialize()).toBe(source);
    }
    driver.editor.state.doc.check();
  });

  it('keeps the original casing and surrounding Markdown', () => {
    const markdown = 'Hello **there**\n\n[FOO]abc123.png[/Foo] and [bar]new[/bar]';
    load(markdown);
    expect(nodes()).toEqual(['[FOO]abc123.png[/Foo]']);
    expect(nodes(bar.name)).toEqual(['[bar]new[/bar]']);
    expect(driver.editor.view.dom.querySelector('[data-bbcode-node="testBar"] strong')?.textContent).toBe('new');
    expect(serialize()).toBe(markdown);
  });

  it('turns BBCode inserted by an extension into the node', () => {
    driver.insertAtCursor('before ', true);
    driver.insertAtCursor(source + '\n\n', false);
    driver.insertAtCursor('after', true);
    expect(nodes()).toEqual([source]);
    expect(serialize()).toContain(source);
    expect(serialize()).toMatch(/^before /);
    expect(serialize()).toMatch(/after$/);
  });

  it('round-trips through HTML copied between rich-text editors', () => {
    load(source);
    driver.editor.commands.setContent(driver.editor.getHTML(), { emitUpdate: false });
    expect(nodes()).toEqual([source]);
    expect(serialize()).toBe(source);
  });

  it('does not trust pasted HTML whose stored source no longer matches', () => {
    const element = document.createElement('span');
    element.setAttribute('data-bbcode-node', foo.name);
    element.setAttribute('data-bbcode', '[foo]../../etc/passwd[/foo]');
    driver.editor.commands.setContent(element.outerHTML, { emitUpdate: false });
    expect(nodes()).toEqual([]);
    expect(driver.editor.view.dom.querySelector('img')).toBeNull();
  });

  it('exposes the source as the text representation and supports delete and undo', () => {
    load(source);
    expect(driver.editor.getText()).toBe(source);
    driver.editor.view.dispatch(closeHistory(driver.editor.state.tr));
    driver.editor.commands.setNodeSelection(1);
    driver.editor.commands.deleteSelection();
    expect(nodes()).toEqual([]);
    driver.editor.commands.undo();
    expect(nodes()).toEqual([source]);
    expect(serialize()).toBe(source);
  });

  it.each(['`' + source + '`', '```\n' + source + '\n```', '\\' + source, '[foo]bad name.png[/foo]', '[foo]abc.gif[/foo]', '[foo]abc.png'])(
    'leaves code, escaped and non-matching text alone: %j',
    (markdown) => {
      load(markdown);
      expect(nodes()).toEqual([]);
      expect(driver.editor.view.dom.querySelector('img')).toBeNull();
    }
  );

  it('leaves the BBCode as text when nothing is registered for it', () => {
    create([]);
    load(source);
    expect(nodes()).toEqual([]);
    expect(driver.editor.state.doc.textContent).toBe(source);
    expect(serialize()).toBe(source);
  });
});
