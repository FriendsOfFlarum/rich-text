import { Plugin } from 'prosemirror-state';

export default function disableImagePastePlugin() {
  return new Plugin({
    props: {
      transformPastedHTML(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        doc.querySelectorAll('img').forEach((img) => {
          try {
            img.remove();
          } catch (e) {
            console.log('Failed removing img: ' + String(e));
          }
        });

        return doc.body.innerHTML;
      },
    },
  });
}