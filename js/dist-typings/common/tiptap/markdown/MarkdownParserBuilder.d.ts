import markdownit from 'markdown-it';
import { MarkdownParser } from '@tiptap/pm/markdown';
import type { Schema } from '@tiptap/pm/model';
import type { BBCodeNodeDefinition } from '../extensions/BBCodeNode';
export default class MarkdownParserBuilder {
    schema: Schema;
    bbcodeNodes: BBCodeNodeDefinition[];
    constructor(schema: Schema, bbcodeNodes?: BBCodeNodeDefinition[]);
    tokenizerParams(): markdownit.Options;
    buildTokenizer(): markdownit;
    buildTokens(): Record<string, any>;
    build(): MarkdownParser;
}
