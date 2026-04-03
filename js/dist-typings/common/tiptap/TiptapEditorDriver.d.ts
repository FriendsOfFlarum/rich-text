import { Editor } from '@tiptap/core';
import './tiptap';
import ItemList from 'flarum/common/utils/ItemList';
import { MarkdownParserBuilder, MarkdownSerializerBuilder } from './markdown';
import type EditorDriverInterface from 'flarum/common/utils/EditorDriverInterface';
import type { EditorDriverParams } from 'flarum/common/utils/EditorDriverInterface';
export default class TiptapEditorDriver implements EditorDriverInterface {
    editor: Editor;
    attrs: EditorDriverParams & {
        escape?: () => void;
    };
    parser: MarkdownParserBuilder['build'] extends () => infer R ? R : never;
    serializer: MarkdownSerializerBuilder['build'] extends () => infer R ? R : never;
    constructor(target: HTMLElement, attrs: EditorDriverParams & {
        escape?: () => void;
    });
    build(target: HTMLElement, attrs: EditorDriverParams & {
        escape?: () => void;
    }): void;
    serializeContent(doc: any): string;
    buildExtensions(): ItemList<any>;
    moveCursorTo(position: number): void;
    getSelectionRange(): [number, number];
    getLastNChars(n: number): string;
    insertAtCursor(text: string, escape: boolean): void;
    insertAt(pos: number, text: string, escape: boolean): void;
    insertBetween(start: number, end: number, text: string, escape?: boolean): void;
    replaceBeforeCursor(start: number, text: string, escape: boolean): void;
    setSelectionRange(start: number, end: number): void;
    getCaretCoordinates(position: number): {
        left: number;
        top: number;
    };
    focus(): void;
    destroy(): void;
    disabled(disabled: boolean): void;
}
