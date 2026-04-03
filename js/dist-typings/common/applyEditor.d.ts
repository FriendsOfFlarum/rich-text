import type TiptapEditorDriver from './tiptap/TiptapEditorDriver';
import type TiptapMenu from './components/TiptapMenu';
import type { Editor } from '@tiptap/core';
declare module 'flarum/common/components/TextEditor' {
    export default interface TextEditor {
        _TiptapEditorDriver: typeof TiptapEditorDriver | undefined;
        _TiptapMenu: typeof TiptapMenu | undefined;
        tiptapEditor: Editor | null | undefined;
    }
}
export default function applyEditor(): void;
