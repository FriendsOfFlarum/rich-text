import { describe, expect, it } from 'vitest';
import disableBase64PastePlugin from '../src/common/proseMirror/plugins/disableBase64PastePlugin';

function transform(html) {
  const plugin = disableBase64PastePlugin();

  return new DOMParser().parseFromString(plugin.props.transformPastedHTML(html), 'text/html');
}

describe('disableBase64PastePlugin', () => {
  it.each([
    'data:image/png;base64,aGVsbG8=',
    'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
    'DATA:image/png;base64,aGVsbG8=',
    '  data:image/png;base64,aGVsbG8=',
    '\tdata:image/png;base64,aGVsbG8=',
    'da\tta:image/png;base64,aGVsbG8=',
    'd&#97;ta:image/png;base64,aGVsbG8=',
    'data:',
    'data:;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a;a!',
  ])('removes an image with source %s', (src) => {
    expect(transform(`<p>before<img src="${src}">after</p>`).querySelector('img')).toBeNull();
  });

  it.each(['https://example.com/image.png', '//example.com/image.png', '/image.png', 'image.png', '', 'database.png'])(
    'preserves an image with source %s',
    (src) => {
      expect(transform(`<img src="${src}">`).querySelector('img')?.getAttribute('src')).toBe(src);
    }
  );

  it('preserves surrounding content and non-data images', () => {
    const doc = transform('<p>before<img src="data:image/png;base64,aA=="><strong>middle</strong><img src="/keep.png">after</p>');

    expect(doc.body.textContent).toBe('beforemiddleafter');
    expect(doc.querySelector('strong')?.textContent).toBe('middle');
    expect(Array.from(doc.querySelectorAll('img'), (img) => img.getAttribute('src'))).toEqual(['/keep.png']);
  });

  it('preserves images without a source', () => {
    expect(transform('<img alt="placeholder">').querySelector('img')?.getAttribute('alt')).toBe('placeholder');
  });
});
