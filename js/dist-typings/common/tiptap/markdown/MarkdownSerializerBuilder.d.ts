import { MarkdownSerializer } from '@tiptap/pm/markdown';
export default class MarkdownSerializerBuilder {
    schema: any;
    constructor(schema: any);
    buildNodes(): Record<string, any>;
    buildMarks(): Record<string, any>;
    build(): MarkdownSerializer;
}
