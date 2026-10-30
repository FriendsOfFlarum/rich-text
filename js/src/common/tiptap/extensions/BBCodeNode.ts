import { Node } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';

export interface BBCodeNodeDefinition {
  name: string;
  pattern: RegExp;
  render(match: RegExpExecArray): DOMOutputSpec;
}

export function matchBBCode(definition: BBCodeNodeDefinition, source: string, pos = 0, max = source.length): RegExpExecArray | null {
  const pattern = new RegExp(definition.pattern.source, definition.pattern.flags.replace(/[gy]/g, '') + 'y');
  pattern.lastIndex = pos;
  const match = pattern.exec(source);
  return match && match[0].length > 0 && pos + match[0].length <= max ? match : null;
}

export function createBBCodeNode(definition: BBCodeNodeDefinition) {
  const matchWhole = (bbcode: string) => {
    const match = matchBBCode(definition, bbcode);
    return match?.[0] === bbcode ? match : null;
  };

  return Node.create({
    name: definition.name,
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
          tag: `span[data-bbcode-node="${definition.name}"]`,
          getAttrs: (element) => {
            const bbcode = element.getAttribute('data-bbcode') || '';
            return matchWhole(bbcode) ? { bbcode } : false;
          },
        },
      ];
    },

    renderHTML({ node }) {
      const { bbcode } = node.attrs;
      return [
        'span',
        { class: 'fof-rich-text-bbcode', 'data-bbcode-node': definition.name, 'data-bbcode': bbcode },
        definition.render(matchWhole(bbcode)!),
      ];
    },

    renderText({ node }) {
      return node.attrs.bbcode;
    },
  });
}
