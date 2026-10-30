import type MarkdownIt from 'markdown-it';
import { matchBBCode, type BBCodeNodeDefinition } from '../../extensions/BBCodeNode';

export default function bbcodeNodes(md: MarkdownIt, definitions: BBCodeNodeDefinition[]): void {
  for (const definition of definitions) {
    md.inline.ruler.before('link', definition.name, (state, silent) => {
      const match = matchBBCode(definition, state.src, state.pos, state.posMax);
      if (!match) return false;
      if (!silent) state.push(definition.name, '', 0).attrSet('bbcode', match[0]);
      state.pos += match[0].length;
      return true;
    });
  }
}
