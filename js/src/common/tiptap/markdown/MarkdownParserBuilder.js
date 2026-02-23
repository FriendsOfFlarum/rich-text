import markdownit from 'markdown-it';
import subPlugin from 'markdown-it-sub';
import supPlugin from 'markdown-it-sup';
import latexPlugin from 'markdown-it-latex2img';
import { defaultMarkdownParser, MarkdownParser } from '@tiptap/pm/markdown';
import altText from './markdown-it/altText';
import blockSpoiler from './markdown-it/blockSpoiler';
import inlineSpoilerBars from './markdown-it/inlineSpoilerBars';
import inlineSpoilerTags from './markdown-it/inlineSpoilerTags';

export default class MarkdownParserBuilder {
  constructor(schema) {
    this.schema = schema;
  }

  tokenizerParams() {
    return { html: false };
  }

  buildTokenizer() {
    return markdownit('commonmark', this.tokenizerParams())
      .enable('strikethrough')
      .use(altText)
      .use(blockSpoiler)
      .use(latexPlugin)
      .use(subPlugin)
      .use(supPlugin)
      .use(inlineSpoilerBars)
      .use(inlineSpoilerTags);
  }

  buildTokens() {
    // The defaultMarkdownParser.tokens uses old prosemirror-markdown names.
    // We need to remap all token names to Tiptap v3 camelCase equivalents.
    const oldTokens = defaultMarkdownParser.tokens;
    const remappedTokens = {};

    // Map from old prosemirror-markdown token names to Tiptap v3 names
    const blockNameMap = {
      blockquote: 'blockquote',
      paragraph: 'paragraph',
      heading: 'heading',
      image: 'image',
    };

    const nodeNameMap = {
      ordered_list: 'orderedList',
      bullet_list: 'bulletList',
      list_item: 'listItem',
      code_block: 'codeBlock',
      hard_break: 'hardBreak',
      horizontal_rule: 'horizontalRule',
    };

    const markNameMap = {
      em: 'italic',
      strong: 'bold',
      code_inline: 'code',
    };

    // Remap old tokens to new Tiptap names
    for (const [tokenName, tokenSpec] of Object.entries(oldTokens)) {
      let newSpec = { ...tokenSpec };

      // Remap block references
      if (newSpec.block && nodeNameMap[newSpec.block]) {
        newSpec = { ...newSpec, block: nodeNameMap[newSpec.block] };
      } else if (newSpec.block && blockNameMap[newSpec.block]) {
        newSpec = { ...newSpec, block: blockNameMap[newSpec.block] };
      }

      // Remap node references
      if (newSpec.node && nodeNameMap[newSpec.node]) {
        newSpec = { ...newSpec, node: nodeNameMap[newSpec.node] };
      }

      // Remap mark references
      if (newSpec.mark && markNameMap[newSpec.mark]) {
        newSpec = { ...newSpec, mark: markNameMap[newSpec.mark] };
      }

      remappedTokens[tokenName] = newSpec;
    }

    return {
      ...remappedTokens,

      // Explicitly override all standard tokens to ensure correct Tiptap v3 names
      ordered_list: { block: 'orderedList' },
      bullet_list: { block: 'bulletList' },
      list_item: { block: 'listItem' },
      code_block: { block: 'codeBlock', noCloseToken: true },
      fence: { block: 'codeBlock', noCloseToken: true },
      hr: { node: 'horizontalRule' },
      hardbreak: { node: 'hardBreak' },
      em: { mark: 'italic' },
      strong: { mark: 'bold' },
      code_inline: { mark: 'code', noCloseToken: true },

      // Litedown treats softbreaks as hard breaks
      softbreak: { node: 'hardBreak' },

      // add support for the strike mark
      s: {
        mark: 'strike',
      },

      spoiler: {
        block: 'spoiler',
      },

      spoiler_inline: {
        mark: 'spoiler_inline',
      },

      sub: {
        mark: 'sub',
      },

      sup: {
        mark: 'sup',
      },

      math_block: {
        block: 'math_block',
        noCloseToken: true,
      },

      math_inline: {
        mark: 'math_inline',
        noCloseToken: true,
      },
    };
  }

  build() {
    return new MarkdownParser(this.schema, this.buildTokenizer(), this.buildTokens());
  }
}
