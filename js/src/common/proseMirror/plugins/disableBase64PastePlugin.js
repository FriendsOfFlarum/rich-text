import { Plugin } from 'prosemirror-state';

let parser = new DOMParser();

export default function disableBase64PastePlugin() {
  return new Plugin({
    props: {
      transformPastedHTML(html) {
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('img').forEach((node) => {
          if (node.src.toLowerCase().startsWith('data:')) {
            node.remove();
          }
        });

        return doc.documentElement.outerHTML;
      },
    },
  });
}
