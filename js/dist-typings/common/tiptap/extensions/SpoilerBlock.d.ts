import { Node } from '@tiptap/core';
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        spoilerBlock: {
            toggleSpoilerBlock: () => ReturnType;
        };
    }
}
export declare const SpoilerBlock: Node<any, any>;
