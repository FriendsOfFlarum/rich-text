/**!
 * markdown-it-mark
 *
 * Copyright (c) 2014-2015 Vitaly Puzrin, Alex Kocharin.
 * MIT License
 */
'use strict';
const exMark = 0x7c; /* | */

const tokenize =
  (frontPriorMode: boolean) =>
  (state: any, silent: boolean): boolean => {
    if (silent) return false;

    const start = state.pos;
    const marker = state.src.charCodeAt(start);

    if (marker !== exMark) return false;

    const scanned = state.scanDelims(state.pos, true);
    let len = scanned.length;
    const ch = String.fromCharCode(marker);

    if (len < 2) return false;

    let isOdd = false;
    if (len % 2) {
      isOdd = true;
      if (!frontPriorMode) {
        const token = state.push('text', '', 0);
        token.content = ch;
      }
      len--;
    }

    for (let i = 0; i < len; i += 2) {
      const token = state.push('text', '', 0);
      token.content = ch + ch;

      state.delimiters.push({
        marker,
        length: 0,
        jump: i / 2,
        token: state.tokens.length - 1,
        end: -1,
        open: scanned.can_open,
        close: scanned.can_close,
      });
    }

    state.pos += scanned.length;
    if (isOdd && frontPriorMode) {
      state.pos--;
    }

    return true;
  };

const postProcess = (state: any, delimiters: any[]) => {
  const loneMarkers: number[] = [];

  for (const startDelim of delimiters) {
    if (startDelim.marker !== exMark) continue;
    if (startDelim.end === -1) continue;

    const endDelim = delimiters[startDelim.end];

    const tokenO = state.tokens[startDelim.token];
    tokenO.type = 'spoiler_inline_open';
    tokenO.tag = 'span';
    tokenO.attrs = [['class', 'spoiler_inline']];
    tokenO.nesting = 1;
    tokenO.markup = '||';
    tokenO.content = '';

    const tokenC = state.tokens[endDelim.token];
    tokenC.type = 'spoiler_inline_close';
    tokenC.tag = 'span';
    tokenC.nesting = -1;
    tokenC.markup = '||';
    tokenC.content = '';

    if (state.tokens[endDelim.token - 1].type === 'text' && state.tokens[endDelim.token - 1].content === '|') {
      loneMarkers.push(endDelim.token - 1);
    }
  }

  while (loneMarkers.length) {
    const i = loneMarkers.pop()!;
    let j = i + 1;

    while (j < state.tokens.length && state.tokens[j].type === 'spoiler_inline_close') {
      j++;
    }

    j--;

    if (i !== j) {
      const token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
};

export default function (md: any, frontPriorMode = false) {
  md.inline.ruler.before('emphasis', 'spoiler_inline_bars', tokenize(frontPriorMode));
  md.inline.ruler2.before('emphasis', 'spoiler_inline_bars', (state: any) => {
    postProcess(state, state.delimiters);

    if (!state.tokens_meta) return;
    for (const meta of state.tokens_meta) {
      if (meta && meta.delimiters) {
        postProcess(state, meta.delimiters);
      }
    }
  });
}
