import { MarkdownSerializer } from '@tiptap/pm/markdown';
import type { BBCodeNodeDefinition } from '../extensions/BBCodeNode';
export default class MarkdownSerializerBuilder {
    schema: any;
    bbcodeNodes: BBCodeNodeDefinition[];
    constructor(schema: any, bbcodeNodes?: BBCodeNodeDefinition[]);
    buildNodes(): Record<string, any>;
    buildMarks(): Record<string, any>;
    build(): MarkdownSerializer;
}
