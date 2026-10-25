import { Editor, Extension } from '@tiptap/core';
import './tiptap'; // ensure Node/Mark/Extension are registered in flarum.reg for third-party extensions
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextSelection } from '@tiptap/pm/state';
import { Slice } from '@tiptap/pm/model';
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
  private cleanupInputListeners?: () => void;

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
    this.cleanupInputListeners = () => {
      if (target.oninput === callInputListeners) target.oninput = null;
      if (target.onclick === callInputListeners) target.onclick = null;
      if (target.onkeyup === callInputListeners) target.onkeyup = null;
    };
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
    items.add('disableDataUriPaste', DisableDataUriPaste.configure({ deferImageFiles: Boolean(app.forum.attribute('fof-upload.canUpload')) }));
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
    const { parent, parentOffset } = this.editor.state.selection.$from;
    // Formatting does not change positions. Represent inline leaves as one-character
    // boundaries so autocomplete offsets stay aligned without crossing images or breaks.
    return parent.textBetween(Math.max(0, parentOffset - n), parentOffset, undefined, '\n');
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
    const transaction = view.state.tr.setSelection(TextSelection.create(view.state.doc, start, end));
    const literal = escape || Boolean(transaction.selection.$from.parent.type.spec.code);

    if (literal) {
      transaction.insertText(text);
    } else {
      const parsed = this.parser.parse(text);
      let content = parsed.content;

      // Leave a text position after a quote, list, or other non-text block.
      if (parsed.lastChild && !parsed.lastChild.isTextblock) {
        content = content.addToEnd(view.state.schema.nodes.paragraph.create());
      }

      // Open only paragraph boundaries, preserving quote and list wrappers.
      // ProseMirror positions the selection after the inserted content, whose size may
      // differ from the Markdown source. Never offset the caller's replacement range.
      transaction.replaceSelection(
        new Slice(content, content.firstChild?.type.name === 'paragraph' ? 1 : 0, content.lastChild?.type.name === 'paragraph' ? 1 : 0)
      );
    }

    view.dispatch(transaction);
    this.focus();
    m.redraw();

    if (text.endsWith(' ') && !literal) {
      this.insertAtCursor(' ', true);
    }
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
    this.cleanupInputListeners?.();
    this.editor.destroy();
  }

  disabled(disabled: boolean) {
    this.editor.setEditable(!disabled);
  }
}
