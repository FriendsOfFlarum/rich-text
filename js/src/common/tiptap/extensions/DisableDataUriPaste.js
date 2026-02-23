import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

export const DisableDataUriPaste = Extension.create({
  name: 'disableBase64Paste',

  addProseMirrorPlugins() {
    const dataImageRegex = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/;
    const htmlParser = new DOMParser();

    return [
      new Plugin({
        props: {
          transformPastedHTML(html) {
            const doc = htmlParser.parseFromString(html, 'text/html');
            doc.querySelectorAll('img').forEach((node) => {
              if (dataImageRegex.test(node.src)) {
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
