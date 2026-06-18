import { defaultMarkdownSerializer, MarkdownSerializer, MarkdownSerializerState } from '@tiptap/pm/markdown';
import type { Mark } from '@tiptap/pm/model';

/**
 * COPIED FROM https://github.com/StackExchange/Stacks-Editor/blob/main/src/rich-text/markdown-serializer.ts
 *
 * Generates a config from a base config that is aware of special "markup" added by the markdown tokenizer;
 * typically this will be differences in how markdown can be written (e.g. * vs _ for emphasis),
 * but could also be html tags from our extended html support plugin (e.g. * vs <em> for emphasis)
 * @param config The base config to extend
 */
function genMarkupAwareMarkConfig(config: { open: string; close: string; [key: string]: any }) {
  // we don't support function open/close since these could have fairly complicated logic in them
  if ((config.open as any) instanceof Function || (config.close as any) instanceof Function) {
    // log an error to the console and return the unmodified base config
    console.error('markdown-serializer genMarkupAwareMarkSpec', 'Unable to extend mark config with open/close as functions', config);
    return config;
  }

  return {
    ...config,
    open(_: MarkdownSerializerState, mark: Mark) {
      const markup = mark.attrs.markup;
      return markup || config.open;
    },
    close(_: MarkdownSerializerState, mark: Mark) {
      let markup = mark.attrs.markup;
      // insert the `/` on html closing tags
      markup = /^<[a-z]+>$/i.test(markup) ? markup.replace(/^</, '</') : markup;
      return markup || config.close;
    },
  };
}

(MarkdownSerializerState.prototype as any).esc = function (str: string, startOfLine?: boolean) {
  str = str.replace(/[`*\\~]/g, '\\$&');
  if (startOfLine) str = str.replace(/^[#\-*+]/, '\\$&').replace(/^(\s*\d+)\./, '$1\\.');
  return str;
};

// Remap defaultMarkdownSerializer.nodes from old prosemirror-markdown keys to Tiptap v3 camelCase keys
const oldNodes = defaultMarkdownSerializer.nodes;
const remappedNodes: Record<string, any> = {};
const nodeNameMap: Record<string, string> = {
  bullet_list: 'bulletList',
  ordered_list: 'orderedList',
  list_item: 'listItem',
  code_block: 'codeBlock',
  horizontal_rule: 'horizontalRule',
  hard_break: 'hardBreak',
};
for (const [key, value] of Object.entries(oldNodes)) {
  remappedNodes[nodeNameMap[key] || key] = value;
}

// Remap defaultMarkdownSerializer.marks from old prosemirror-markdown keys to Tiptap v3 camelCase keys
const oldMarks = defaultMarkdownSerializer.marks;
const remappedMarks: Record<string, any> = {};
const markNameMap: Record<string, string> = {
  em: 'italic',
  strong: 'bold',
};
for (const [key, value] of Object.entries(oldMarks)) {
  remappedMarks[markNameMap[key] || key] = value;
}

export default class MarkdownSerializerBuilder {
  schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  buildNodes(): Record<string, any> {
    return {
      ...remappedNodes,

      // Tiptap v3 BulletList has no `tight` attr; force tight serialization so
      // items are not separated by blank lines in the markdown output.
      bulletList(state: MarkdownSerializerState, node: any) {
        const prevTight = (state as any).options.tightLists;
        (state as any).options.tightLists = true;
        remappedNodes.bulletList(state, node);
        (state as any).options.tightLists = prevTight;
      },

      // Fix orderedList: Tiptap v3 uses `start` attr instead of `order`; also force tight.
      orderedList(state: MarkdownSerializerState, node: any) {
        const prevTight = (state as any).options.tightLists;
        (state as any).options.tightLists = true;
        let start = node.attrs.start || 1;
        let maxW = String(start + node.childCount - 1).length;
        let space = state.repeat(' ', maxW + 2);
        state.renderList(node, space, (i: number) => {
          let nStr = String(start + i);
          return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
        });
        (state as any).options.tightLists = prevTight;
      },

      spoiler(state: MarkdownSerializerState, node: any) {
        state.wrapBlock('>! ', null, node, () => state.renderContent(node));
      },

      math_block(state: MarkdownSerializerState, node: any) {
        state.write('$$\n');
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write('$$');
        state.closeBlock(node);
      },

      // We still want to put a new line for empty paragraphs
      paragraph(state: MarkdownSerializerState, node: any) {
        if (node.content.size === 0) {
          state.write('\n');
        } else {
          remappedNodes.paragraph(state, node);
        }
      },

      // Override this to put in just a whiteline, since Litedown doesn't like line-ending slashes.
      hardBreak(state: MarkdownSerializerState, node: any, parent: any, index: number) {
        for (let i = index + 1; i < parent.childCount; i++)
          if (parent.child(i).type != node.type) {
            state.write('\n');
            return;
          }
      },
    };
  }

  buildMarks(): Record<string, any> {
    const defaultLink = remappedMarks.link;

    return {
      ...remappedMarks,

      // The default link serializer emits CommonMark autolink syntax (`<url>`) for
      // "plain URL" links (text == href, scheme present, no title) — which Tiptap's
      // auto-link produces for pasted/typed URLs. Litedown then wraps `<url>` in a
      // URL tag, blocking fof/formatting's MediaEmbed from claiming it (issue #5).
      // Emit the URL bare instead: Litedown still auto-links bare URLs, and MediaEmbed
      // can claim them. Labelled/titled links are untouched.
      link: {
        ...defaultLink,
        open(state: MarkdownSerializerState, mark: Mark, parent: any, index: number) {
          const out = defaultLink.open(state, mark, parent, index);
          return (state as any).inAutolink ? '' : out;
        },
        close(state: MarkdownSerializerState, mark: Mark, parent: any, index: number) {
          const wasAutolink = (state as any).inAutolink;
          const out = defaultLink.close(state, mark, parent, index);
          return wasAutolink ? '' : out;
        },
      },

      spoiler_inline: genMarkupAwareMarkConfig({
        open: '>!',
        close: '!<',
        mixable: true,
        expelEnclosingWhitespace: true,
      }),

      strike: genMarkupAwareMarkConfig({
        open: '~~',
        close: '~~',
        mixable: true,
        expelEnclosingWhitespace: true,
      }),

      sub: genMarkupAwareMarkConfig({
        open: '~',
        close: '~',
        mixable: true,
        expelEnclosingWhitespace: true,
      }),

      sup: genMarkupAwareMarkConfig({
        open: '^',
        close: '^',
        mixable: true,
        expelEnclosingWhitespace: true,
      }),

      math_inline: {
        ...genMarkupAwareMarkConfig({
          open: '$',
          close: '$',
          mixable: false,
          expelEnclosingWhitespace: true,
        }),
        escape: false,
      },
    };
  }

  build(): MarkdownSerializer {
    return new MarkdownSerializer(this.buildNodes(), this.buildMarks());
  }
}
