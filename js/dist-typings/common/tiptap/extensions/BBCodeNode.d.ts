import { Node } from '@tiptap/core';
import type { DOMOutputSpec } from '@tiptap/pm/model';
export interface BBCodeNodeDefinition {
    name: string;
    pattern: RegExp;
    render(match: RegExpExecArray): DOMOutputSpec;
}
export declare function matchBBCode(definition: BBCodeNodeDefinition, source: string, pos?: number, max?: number): RegExpExecArray | null;
export declare function createBBCodeNode(definition: BBCodeNodeDefinition): Node<any, any>;
