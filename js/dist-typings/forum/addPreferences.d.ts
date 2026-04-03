declare module 'flarum/forum/components/SettingsPage' {
    export default interface SettingsPage {
        useRichTextEditorLoading?: boolean;
        richTextCompactParagraphsLoading?: boolean;
    }
}
export default function addPreferences(): void;
