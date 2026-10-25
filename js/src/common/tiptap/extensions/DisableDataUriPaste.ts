import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

export const DisableDataUriPaste = Extension.create<{ deferImageFiles: boolean }>({
  name: 'disableBase64Paste',

  addOptions() {
    return { deferImageFiles: false };
  },

  addProseMirrorPlugins() {
    const htmlParser = new DOMParser();
    const deferImageFiles = this.options.deferImageFiles;

    return [
      new Plugin({
        props: {
          handlePaste(_view, event) {
            if (!deferImageFiles) return false;
            // fof/upload's listener handles image files on the same element after
            // ProseMirror. Suppress only the editor insertion, not the upload event.
            return Array.from(event.clipboardData?.items || []).some(
              (item) => item.kind === 'file' && item.type.startsWith('image/') && item.getAsFile() !== null
            );
          },
          transformPastedHTML(html) {
            const doc = htmlParser.parseFromString(html, 'text/html');
            doc.querySelectorAll('img').forEach((node) => {
              if (node.src.toLowerCase().startsWith('data:')) {
                node.remove();
              }
            });
            return doc.documentElement.outerHTML;
          },
        },
      }),
    ];
  },
});
