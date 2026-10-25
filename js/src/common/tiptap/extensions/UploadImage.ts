import { Node } from '@tiptap/core';
import { parseUploadImage } from '../markdown/uploadImage';

export const UploadImage = Node.create({
  name: 'fofUploadImage',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return { bbcode: { default: '', rendered: false } };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-fof-upload-bbcode]',
        getAttrs(element) {
          const bbcode = element.getAttribute('data-fof-upload-bbcode') || '';
          const image = parseUploadImage(bbcode);
          return image && image.end === bbcode.length ? { bbcode } : false;
        },
      },
    ];
  },

  renderHTML({ node }) {
    const bbcode: string = node.attrs.bbcode;
    const image = parseUploadImage(bbcode);
    if (!image || image.end !== bbcode.length) return ['span', {}, bbcode];
    return [
      'span',
      { class: 'fof-rich-text-uploadImage', 'data-fof-upload-bbcode': bbcode },
      ['img', { src: image.src, alt: image.alt, title: image.alt, loading: 'lazy', draggable: 'false' }],
    ];
  },

  renderText({ node }) {
    return node.attrs.bbcode;
  },
});
