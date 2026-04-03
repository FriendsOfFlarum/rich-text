// BASED ON https://github.com/markdown-it/markdown-it-sub/blob/master/index.js

const tokenize =
  (frontPriorMode: boolean) =>
  (state: any, silent: boolean): boolean => {
    if (silent) return false;

    var max = state.posMax,
      start = state.pos;

    if (state.src.charCodeAt(start) === 0x3e /* > */ && start + 3 <= max && state.src.charCodeAt(start + 1) === 0x21 /* ! */) {
      state.scanDelims(state.pos, true);
      state.push('text', '', 0);
      state.delimiters.push({
        marker: '>!<',
        length: 2,
        jump: 0,
        token: state.tokens.length - 1,
        end: -1,
        open: true,
        close: false,
      });
      state.pos += 2;
      return true;
    }

    if (state.src.charCodeAt(start) === 0x21 /* ! */ && start + 2 <= max && state.src.charCodeAt(start + 1) === 0x3c /* < */) {
      state.push('text', '', 0);
      state.delimiters.push({
        marker: '>!<',
        length: 2,
        jump: 0,
        token: state.tokens.length - 1,
        end: -1,
        open: false,
        close: true,
      });
      state.pos += 2;
      return true;
    }

    return false;
  };

function postProcess(state: any, delimiters: any[]) {
  var i,
    startDelim,
    endDelim,
    token,
    max = delimiters.length;

  for (i = max - 1; i >= 0; i--) {
    startDelim = delimiters[i];

    if (startDelim.marker !== '>!<') {
      continue;
    }

    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];

    token = state.tokens[startDelim.token];
    token.type = 'spoiler_inline_open';
    token.nesting = 1;
    token.markup = '>!';
    token.content = '';

    token = state.tokens[endDelim.token];
    token.type = 'spoiler_inline_close';
    token.nesting = -1;
    token.markup = '!<';
    token.content = '';
  }
}

export default function (md: any, frontPriorMode = false) {
  md.inline.ruler.before('emphasis', 'spoiler_inline_tags', tokenize(frontPriorMode));
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
