import { Editor, Extension } from '@tiptap/core';
import './tiptap'; // ensure Node/Mark/Extension are registered in flarum.reg for third-party extensions
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Selection, TextSelection, type Transaction } from '@tiptap/pm/state';
import { canSplit, insertPoint } from '@tiptap/pm/transform';
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

    if (escape) {
      view.dispatch(view.state.tr.insertText(text, start, end));
      this.moveCursorTo(Math.min(start + text.length + 1, Selection.atEnd(view.state.doc).to));
    } else {
      view.dispatch(this.insertMarkdown(start, end, text).scrollIntoView());
      this.focus();
    }

    m.redraw();
  }

  /**
   * Replace start..end with parsed markdown, leaving the cursor where a textarea
   * would: after the inserted text, or on a new line of its own when the text
   * ends with one (fof/upload's BBCode, a mentions quote).
   *
   * The range comes from where the cursor is. Text with no line breaks that
   * parses to one paragraph (a mention) goes inline. Blocks replace an empty
   * paragraph, go before or after the paragraph when the cursor is at its edge,
   * and otherwise split it. In a code block the text goes in as typed.
   */
  protected insertMarkdown(start: number, end: number, text: string): Transaction {
    const { state } = this.editor.view;
    const { schema } = state;
    const tr = state.tr;
    const newline = /\n\s*$/.test(text);

    if (state.doc.resolve(start).parent.type.spec.code) {
      return tr.insertText(text, start, end);
    }

    const parsed = this.parser.parse(text);
    const first = parsed.firstChild;

    if (!text.includes('\n') && parsed.childCount === 1 && first?.type === schema.nodes.paragraph) {
      tr.replaceWith(start, end, first.content);
      tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(end)), -1));
    } else {
      // A selection is replaced like a textarea replaces it: removed, then the
      // blocks go in at the cursor that is left.
      tr.delete(start, end);

      const $pos = tr.doc.resolve(start);
      let from = start;
      let to = start;
      // Whether the block after the inserted ones is the rest of the line the
      // cursor was on, which is where a trailing newline would leave it.
      let restOfLine = false;

      if ($pos.parent.isTextblock) {
        const { parentOffset } = $pos;
        // After this paragraph, or after its container where that only holds one.
        const below = insertPoint(tr.doc, $pos.after(), schema.nodes.paragraph) ?? $pos.after();

        if ($pos.parent.content.size === 0) [from, to] = [$pos.before(), $pos.after()];
        else if (parentOffset === $pos.parent.content.size) from = to = below;
        else if (parentOffset === 0) [from, to, restOfLine] = [$pos.before(), $pos.before(), true];
        else if (canSplit(tr.doc, start)) {
          // Mid-paragraph: split it, and the blocks go in between the halves.
          tr.split(start);
          [from, to, restOfLine] = [start + 1, start + 1, true];
        } else from = to = below;
      }

      const steps = tr.steps.length;
      tr.replaceWith(from, to, parsed.content);

      // The end of the inserted blocks.
      const after = tr.mapping.slice(steps).map(to);

      if (!newline) {
        tr.setSelection(Selection.near(tr.doc.resolve(after), -1));
      } else {
        if (!restOfLine || !tr.doc.resolve(after).nodeAfter?.isTextblock) {
          tr.insert(after, schema.nodes.paragraph.create());
        }

        tr.setSelection(TextSelection.create(tr.doc, after + 1));
      }
    }

    // Markdown parsing drops a trailing space, such as the one after a mention.
    if (!newline && text.endsWith(' ') && tr.selection instanceof TextSelection) tr.insertText(' ');

    return tr;
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
