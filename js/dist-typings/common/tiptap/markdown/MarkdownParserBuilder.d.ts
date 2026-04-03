import markdownit from 'markdown-it';
import { MarkdownParser } from '@tiptap/pm/markdown';
import type { Schema } from '@tiptap/pm/model';
export default class MarkdownParserBuilder {
    schema: Schema;
    constructor(schema: Schema);
    tokenizerParams(): markdownit.Options;
    buildTokenizer(): markdownit;
    buildTokens(): Record<string, any>;
    build(): MarkdownParser;
}
