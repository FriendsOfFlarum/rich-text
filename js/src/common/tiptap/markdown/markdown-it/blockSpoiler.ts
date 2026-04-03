// COPIED FROM https://github.com/StackExchange/Stacks-Editor/blob/main/src/shared/markdown-it/spoiler.ts

import { isSpace } from 'markdown-it/lib/common/utils.mjs';

interface BlockSpoilerOptions {
  followingCharRegex: RegExp;
  markup: string;
  name: string;
}

function blockquoteExt(options: BlockSpoilerOptions, state: any, startLine: number, endLine: number, silent: boolean): boolean {
  // eslint-disable-next-line no-var
  var adjustTab: boolean = false,
    ch: number,
    i: number,
    initial: number,
    l: number,
    lastLineEmpty: boolean,
    lines: [number, number],
    nextLine: number,
    offset: number,
    oldBMarks: number[],
    oldBSCount: number[],
    oldIndent: number,
    oldParentType: any,
    oldSCount: number[],
    oldTShift: number[],
    spaceAfterMarker: boolean,
    terminate: boolean,
    terminatorRules: any[],
    token: any,
    wasOutdented: boolean,
    oldLineMax = state.lineMax,
    pos = state.bMarks[startLine] + state.tShift[startLine],
    max = state.eMarks[startLine];

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (state.src.charCodeAt(pos) !== 0x3e /* > */ || !options.followingCharRegex.test(state.src[pos + 1])) {
    return false;
  }

  pos += options.markup.length;

  if (silent) {
    return true;
  }

  initial = offset = state.sCount[startLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]);

  if (state.src.charCodeAt(pos) === 0x20 /* space */) {
    pos++;
    initial++;
    offset++;
    adjustTab = false;
    spaceAfterMarker = true;
  } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
    spaceAfterMarker = true;

    if ((state.bsCount[startLine] + offset) % 4 === 3) {
      pos++;
      initial++;
      offset++;
      adjustTab = false;
    } else {
      adjustTab = true;
    }
  } else {
    spaceAfterMarker = false;
  }

  // ! INSERTED
  const spoiler = options.markup === '>!';
  let foundExclamation = false;
  let foundOpen = false;
  let oldPos = pos;
  if (spoiler) {
    while (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (foundExclamation && ch === 0x3c /* < */) {
        return false;
      } else if (ch === 0x3e /* > */) {
        foundOpen = true;
      } else if (foundOpen && ch === 0x21 /* ! */) {
        break;
      } else if (ch === 0x21 /* ! */) {
        foundExclamation = true;
      } else if (ch === 0x0a /* \n */) {
        break;
      } else {
        foundExclamation = false;
        foundOpen = false;
      }

      pos++;
    }
  }
  pos = oldPos;
  // ! END INSERTED

  oldBMarks = [state.bMarks[startLine]];
  state.bMarks[startLine] = pos;

  while (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (isSpace(ch)) {
      if (ch === 0x09) {
        offset += 4 - ((offset + state.bsCount[startLine] + (adjustTab ? 1 : 0)) % 4);
      } else {
        offset++;
      }
    } else {
      break;
    }

    pos++;
  }

  oldBSCount = [state.bsCount[startLine]];
  state.bsCount[startLine] = state.sCount[startLine] + 1 + (spaceAfterMarker ? 1 : 0);

  lastLineEmpty = pos >= max;

  oldSCount = [state.sCount[startLine]];
  state.sCount[startLine] = offset - initial;

  oldTShift = [state.tShift[startLine]];
  state.tShift[startLine] = pos - state.bMarks[startLine];

  terminatorRules = state.md.block.ruler.getRules('spoiler');

  oldParentType = state.parentType;
  // @ts-ignore TODO adding a new parent type here...
  state.parentType = 'spoiler';
  wasOutdented = false;

  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) wasOutdented = true;

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos >= max) {
      break;
    }

    pos += options.markup.length;

    if (
      state.src.charCodeAt(pos - options.markup.length) === 0x3e /* > */ &&
      options.followingCharRegex.test(state.src[pos - options.markup.length + 1]) &&
      !wasOutdented
    ) {
      initial = offset = state.sCount[nextLine] + pos - (state.bMarks[nextLine] + state.tShift[nextLine]);

      if (state.src.charCodeAt(pos) === 0x20 /* space */) {
        pos++;
        initial++;
        offset++;
        adjustTab = false;
        spaceAfterMarker = true;
      } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
        spaceAfterMarker = true;

        if ((state.bsCount[nextLine] + offset) % 4 === 3) {
          pos++;
          initial++;
          offset++;
          adjustTab = false;
        } else {
          adjustTab = true;
        }
      } else {
        spaceAfterMarker = false;
      }

      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (isSpace(ch)) {
          if (ch === 0x09) {
            offset += 4 - ((offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4);
          } else {
            offset++;
          }
        } else {
          break;
        }

        pos++;
      }

      lastLineEmpty = pos >= max;

      oldBSCount.push(state.bsCount[nextLine]);
      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);

      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = offset - initial;

      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    }

    if (lastLineEmpty) {
      break;
    }

    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      state.lineMax = nextLine;

      if (state.blkIndent !== 0) {
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] -= state.blkIndent;
      }

      break;
    }

    oldBMarks.push(state.bMarks[nextLine]);
    oldBSCount.push(state.bsCount[nextLine]);
    oldTShift.push(state.tShift[nextLine]);
    oldSCount.push(state.sCount[nextLine]);

    state.sCount[nextLine] = -1;
  }

  oldIndent = state.blkIndent;
  state.blkIndent = 0;

  token = state.push(options.name + '_open', options.name, 1);
  token.markup = options.markup;
  token.map = lines = [startLine, 0];

  state.md.block.tokenize(state, startLine, nextLine);

  token = state.push(options.name + '_close', options.name, -1);
  token.markup = options.markup;

  state.lineMax = oldLineMax;
  state.parentType = oldParentType;
  lines[1] = state.line;

  for (i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
    state.sCount[i + startLine] = oldSCount[i];
    state.bsCount[i + startLine] = oldBSCount[i];
  }
  state.blkIndent = oldIndent;

  return true;
}

function spoilerFn(state: any, startLine: number, endLine: number, silent: boolean) {
  return blockquoteExt(
    {
      followingCharRegex: /!/,
      markup: '>!',
      name: 'spoiler',
    },
    state,
    startLine,
    endLine,
    silent
  );
}

function blockquoteFn(state: any, startLine: number, endLine: number, silent: boolean) {
  return blockquoteExt(
    {
      followingCharRegex: /[^!]/,
      markup: '>',
      name: 'blockquote',
    },
    state,
    startLine,
    endLine,
    silent
  );
}

export default function blockSpoiler(md: any) {
  // @ts-ignore no public way to iterate over all rules
  md.block.ruler.__rules__.forEach((r: any) => {
    const bqIndex = r.alt.indexOf('blockquote');
    if (bqIndex > -1) {
      r.alt.splice(bqIndex, 0, 'spoiler');
    }
  });
  md.block.ruler.before('blockquote', 'spoiler', spoilerFn, {
    alt: ['paragraph', 'reference', 'spoiler', 'blockquote', 'list'],
  });

  md.block.ruler.at('blockquote', blockquoteFn, {
    alt: ['paragraph', 'reference', 'spoiler', 'blockquote', 'list'],
  });
}
