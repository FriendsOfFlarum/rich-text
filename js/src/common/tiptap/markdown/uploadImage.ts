export interface UploadImage {
  bbcode: string;
  src: string;
  alt: string;
  end: number;
}

function whitespace(char: string): boolean {
  return char === ' ' || char === '\t';
}

function attributeName(char: string): boolean {
  return /[a-z0-9_-]/i.test(char);
}

function attributes(input: string): Record<string, string> | null {
  const result: Record<string, string> = Object.create(null);
  let pos = 0;

  while (pos < input.length) {
    while (whitespace(input[pos])) pos++;
    if (pos === input.length) break;
    const keyStart = pos;
    while (pos < input.length && attributeName(input[pos])) pos++;
    if (pos === keyStart) return null;
    const key = input.slice(keyStart, pos).toLowerCase();
    while (whitespace(input[pos])) pos++;
    if (input[pos++] !== '=') return null;
    while (whitespace(input[pos])) pos++;

    const quote = input[pos];
    if (quote === '"' || quote === "'") {
      const end = input.indexOf(quote, pos + 1);
      if (end === -1) return null;
      result[key] = input.slice(pos + 1, end);
      pos = end + 1;
      if (pos < input.length && !whitespace(input[pos])) return null;
    } else {
      const valueStart = pos;
      while (pos < input.length) {
        if (!whitespace(input[pos])) {
          pos++;
          continue;
        }
        let next = pos;
        while (whitespace(input[next])) next++;
        let keyEnd = next;
        while (keyEnd < input.length && attributeName(input[keyEnd])) keyEnd++;
        let separator = keyEnd;
        while (whitespace(input[separator])) separator++;
        if (keyEnd > next && input[separator] === '=') break;
        pos = Math.max(next, keyEnd);
      }
      result[key] = input.slice(valueStart, pos).trimEnd();
    }
  }

  return result;
}

function safeImageUrl(value: string): string | null {
  const url = value.trim();
  if (!url) return null;
  try {
    const protocol = new URL(url, 'https://flarum.invalid').protocol;
    return protocol === 'http:' || protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** Read supported FoF Upload image tags without rewriting their original source. */
export function parseUploadImage(source: string, start = 0, max = source.length): UploadImage | null {
  const opening = /^\[(upl-image-preview|upl-image)(?=[ \t\]])/i.exec(source.slice(start, start + 20));
  if (!opening) return null;

  const attributesStart = start + opening[0].length;
  let pos = attributesStart;
  let quote: string | null = null;
  let expectingValue = false;
  for (; pos < max; pos++) {
    const char = source[pos];
    if (char === '\n' || char === '\r') return null;
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === ']') break;
    if (expectingValue && whitespace(char)) continue;
    if (expectingValue && (char === '"' || char === "'")) quote = char;
    expectingValue = char === '=';
  }
  if (pos >= max) return null;

  const attrs = attributes(source.slice(attributesStart, pos));
  if (!attrs?.uuid) return null;
  const url = attrs.url ? safeImageUrl(attrs.url) : null;
  const thumbnail = attrs.thumbnail_url ? safeImageUrl(attrs.thumbnail_url) : null;
  if ((attrs.url && !url) || (attrs.thumbnail_url && !thumbnail) || (!url && !thumbnail)) return null;

  let end = pos + 1;
  let alt = attrs.alt || '';
  if (opening[1].toLowerCase() === 'upl-image') {
    // Labels may contain brackets. A new upload tag is not part of the label,
    // so malformed openers cannot repeatedly scan the remaining document.
    let closing = source.indexOf('[', end);
    while (closing !== -1 && closing < max && source.slice(closing, closing + 12).toLowerCase() !== '[/upl-image]') {
      if (/^\[upl-image(?:-preview)?(?=[ \t\]])/i.test(source.slice(closing, closing + 20))) return null;
      closing = source.indexOf('[', closing + 1);
    }
    if (closing === -1 || source.slice(closing, closing + 12).toLowerCase() !== '[/upl-image]' || closing + 12 > max) return null;
    alt = source.slice(end, closing);
    if (/[\r\n]/.test(alt)) return null;
    end = closing + 12;
  }

  return { bbcode: source.slice(start, end), src: thumbnail || url!, alt, end };
}
