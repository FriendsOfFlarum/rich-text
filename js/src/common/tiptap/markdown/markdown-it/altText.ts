// COPIED FROM https://github.com/markdown-it/markdown-it/blob/master/lib/rules_inline/text.js
// NEEDED TO ALLOW `|` as terminator character.

'use strict';

function isTerminatorChar(ch: number): boolean {
  switch (ch) {
    case 0x0a /* \n */:
    case 0x21 /* ! */:
    case 0x23 /* # */:
    case 0x24 /* $ */:
    case 0x25 /* % */:
    case 0x26 /* & */:
    case 0x2a /* * */:
    case 0x2b /* + */:
    case 0x2d /* - */:
    case 0x3a /* : */:
    case 0x3c /* < */:
    case 0x3d /* = */:
    case 0x3e /* > */:
    case 0x40 /* @ */:
    case 0x5b /* [ */:
    case 0x5c /* \ */:
    case 0x5d /* ] */:
    case 0x5e /* ^ */:
    case 0x5f /* _ */:
    case 0x60 /* ` */:
    case 0x7b /* { */:
    case 0x7c /* | */:
    case 0x7d /* } */:
    case 0x7e /* ~ */:
      return true;
    default:
      return false;
  }
}

const tokenize = (state: any, silent: boolean): boolean => {
  var pos = state.pos;

  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
    pos++;
  }

  if (pos === state.pos) {
    return false;
  }

  if (!silent) {
    state.pending += state.src.slice(state.pos, pos);
  }

  state.pos = pos;

  return true;
};

export default function (md: any) {
  md.inline.ruler.before('text', 'altText', tokenize);
  md.inline.ruler.disable('text');
}
