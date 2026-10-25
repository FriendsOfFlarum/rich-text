import type MarkdownIt from 'markdown-it';
import { parseUploadImage } from '../uploadImage';

export default function uploadImages(md: MarkdownIt): void {
  md.inline.ruler.before('link', 'fof_upload_image', (state, silent) => {
    if (state.src[state.pos] !== '[') return false;
    const image = parseUploadImage(state.src, state.pos, state.posMax);
    if (!image) return false;
    if (!silent) {
      const token = state.push('fof_upload_image', '', 0);
      token.attrSet('bbcode', image.bbcode);
    }
    state.pos = image.end;
    return true;
  });
}
