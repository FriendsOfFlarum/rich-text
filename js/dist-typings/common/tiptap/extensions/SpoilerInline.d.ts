import { Mark } from '@tiptap/core';
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        spoilerInline: {
            toggleSpoilerInline: () => ReturnType;
        };
    }
}
export declare const SpoilerInline: Mark<any, any>;
