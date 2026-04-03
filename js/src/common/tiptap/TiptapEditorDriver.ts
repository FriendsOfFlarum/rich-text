import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Selection, TextSelection } from '@tiptap/pm/state';
import { baseKeymap } from '@tiptap/pm/commands';
import ItemList from 'flarum/common/utils/ItemList';

import { MarkdownParserBuilder, MarkdownSerializerBuilder } from './markdown';
import { SpoilerBlock } from './extensions/SpoilerBlock';
import { SpoilerInline } from './extensions/SpoilerInline';
import { MathBlock } from './extensions/MathBlock';
import { MathInline } from './extensions/MathInline';
import { Subscript } from './extensions/Subscript';
import { Superscript } from './extensions/Superscript';
import { DisableDataUriPaste } from './extensions/DisableDataUriPaste';
import { RichTextKeymap, CompactParagraphs, LinkExitOnPaste } from './extensions/RichTextKeymap';
import type EditorDriverInterface from 'flarum/common/utils/EditorDriverInterface';
import type { EditorDriverParams } from 'flarum/common/utils/EditorDriverInterface';

/**
 * Custom extension that wires Flarum's Mod-Enter (submit) and Escape (close) shortcuts.
 */
const FlarumShortcuts = Extension.create<{ onsubmit: (() => void) | null; escape: (() => void) | null }>({
  name: 'flarumShortcuts',

  addOptions() {
    return {
      onsubmit: null,
      escape: null,
    };
  },

  addKeyboardShortcuts() {
    const shortcuts: Record<string, () => boolean> = {};

    if (this.options.onsubmit) {
      shortcuts['Mod-Enter'] = () => {
        this.options.onsubmit!();
        return true;
      };
    }

    if (this.options.escape) {
      shortcuts['Escape'] = () => {
        this.options.escape!();
        return true;
      };
    }

    return shortcuts;
  },
});

export default class TiptapEditorDriver implements EditorDriverInterface {
  editor!: Editor;
  attrs!: EditorDriverParams & { escape?: () => void };
  parser!: MarkdownParserBuilder['build'] extends () => infer R ? R : never;
  serializer!: MarkdownSerializerBuilder['build'] extends () => infer R ? R : never;

  constructor(target: HTMLElement, attrs: EditorDriverParams & { escape?: () => void }) {
    this.build(target, attrs);
  }

  build(target: HTMLElement, attrs: EditorDriverParams & { escape?: () => void }) {
    this.attrs = attrs;

    // Create the editor first (without initial content) to get the schema
    this.editor = new Editor({
      element: target,
      extensions: this.buildExtensions().toArray(),
      content: '',
      editable: !attrs.disabled,
      onUpdate: ({ editor }) => {
        const markdown = this.serializeContent(editor.state.doc);
        attrs.oninput(markdown);
      },
      onTransaction: () => {
        m.redraw();
      },
    });

    // Build parser and serializer using the editor's schema
    const schema = this.editor.schema;
    this.parser = new MarkdownParserBuilder(schema).build();
    this.serializer = new MarkdownSerializerBuilder(schema).build();

    // Parse and set initial content (emitUpdate=false to avoid marking composer dirty)
    if (attrs.value) {
      const doc = this.parser.parse(attrs.value);
      this.editor.commands.setContent(doc.toJSON(), { emitUpdate: false } as any);
    }

    // Apply CSS classes to the editor DOM
    const cssClasses = attrs.classNames || [];
    cssClasses.forEach((className) => this.editor.view.dom.classList.add(className));

    // Wire up Flarum's input listeners
    const callInputListeners = (e?: Event & { redraw?: boolean }) => {
      attrs.inputListeners.forEach((listener) => {
        listener.call(target);
      });
      if (e) e.redraw = false;
    };

    (target as any).oninput = callInputListeners;
    (target as any).onclick = callInputListeners;
    (target as any).onkeyup = callInputListeners;
  }

  serializeContent(doc: any): string {
    return this.serializer.serialize(doc);
  }

  buildExtensions(): ItemList<any> {
    const items = new ItemList<any>();

    items.add(
      'starterKit',
      StarterKit.configure({
        underline: false,
        link: {
          openOnClick: false,
        },
      })
    );

    items.add(
      'image',
      Image.configure({
        inline: true,
        allowBase64: false,
      })
    );

    items.add(
      'placeholder',
      Placeholder.configure({
        placeholder: this.attrs.placeholder,
      })
    );

    // Custom extensions
    items.add('spoilerBlock', SpoilerBlock);
    items.add('spoilerInline', SpoilerInline);
    items.add('mathBlock', MathBlock);
    items.add('mathInline', MathInline);
    items.add('subscript', Subscript);
    items.add('superscript', Superscript);
    items.add('disableDataUriPaste', DisableDataUriPaste);
    items.add('richTextKeymap', RichTextKeymap);
    items.add('linkExitOnPaste', LinkExitOnPaste);

    items.add(
      'compactParagraphs',
      CompactParagraphs.configure({
        enabled:
          app.forum.attribute('richTextForceCompactParagraphs') || (app.session.user && app.session.user.preferences()?.richTextCompactParagraphs),
      })
    );

    items.add(
      'flarumShortcuts',
      FlarumShortcuts.configure({
        onsubmit: this.attrs.onsubmit as (() => void) | null,
        escape: this.attrs.escape ?? null,
      })
    );

    return items;
  }

  // ── EditorDriverInterface ──────────────────────────────────────────

  moveCursorTo(position: number) {
    this.setSelectionRange(position, position);
  }

  getSelectionRange(): [number, number] {
    const { from, to } = this.editor.state.selection;
    return [from, to];
  }

  getLastNChars(n: number): string {
    const lastNode = this.editor.state.selection.$from.nodeBefore;
    if (!lastNode || !lastNode.text) return '';
    return lastNode.text.slice(Math.max(0, lastNode.text.length - n));
  }

  insertAtCursor(text: string, escape: boolean) {
    this.insertAt(this.getSelectionRange()[0], text, escape);
    $(this.editor.view.dom).trigger('click');
  }

  insertAt(pos: number, text: string, escape: boolean) {
    this.insertBetween(pos, pos, text, escape);
  }

  insertBetween(start: number, end: number, text: string, escape = true) {
    const { view } = this.editor;
    let trailingNewLines = 0;
    const OFFSET_TO_REMOVE_PREFIX_NEWLINE = 1;

    if (escape) {
      view.dispatch(view.state.tr.insertText(text, start, end));
    } else {
      // Without this, a newline would be added before the inserted text.
      start -= OFFSET_TO_REMOVE_PREFIX_NEWLINE;

      // Parse markdown using our custom parser
      const parsed = this.parser.parse(text);
      view.dispatch(view.state.tr.replaceRangeWith(start, end, parsed));

      const trailingMatch = text.match(/\s+$/);
      trailingNewLines = trailingMatch ? trailingMatch[0].split('\n').length - 1 : 0;
    }

    // Move the cursor to the end of the inserted content.
    this.moveCursorTo(Math.min(start + text.length + OFFSET_TO_REMOVE_PREFIX_NEWLINE, Selection.atEnd(view.state.doc).to));
    m.redraw();

    if (text.endsWith(' ') && !escape) {
      this.insertAtCursor(' ', true);
    }

    Array(trailingNewLines)
      .fill(0)
      .forEach(() => {
        baseKeymap['Enter'](view.state, view.dispatch);
      });
  }

  replaceBeforeCursor(start: number, text: string, escape: boolean) {
    this.insertBetween(start, this.getSelectionRange()[0], text, escape);
  }

  setSelectionRange(start: number, end: number) {
    const { state } = this.editor.view;
    const $start = state.tr.doc.resolve(start);
    const $end = state.tr.doc.resolve(end);
    this.editor.view.dispatch(state.tr.setSelection(new TextSelection($start, $end)));
    this.focus();
  }

  getCaretCoordinates(position: number): { left: number; top: number } {
    const viewportCoords = this.editor.view.coordsAtPos(position);
    const editorViewportOffset = this.editor.view.dom.getBoundingClientRect();
    return {
      left: viewportCoords.left - editorViewportOffset.left,
      top: viewportCoords.top - editorViewportOffset.top,
    };
  }

  focus() {
    this.editor.commands.focus();
  }

  destroy() {
    this.editor.destroy();
  }

  disabled(disabled: boolean) {
    this.editor.setEditable(!disabled);
  }
}
