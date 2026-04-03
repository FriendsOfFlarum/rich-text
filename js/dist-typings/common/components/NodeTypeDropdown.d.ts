import Dropdown, { IDropdownAttrs } from 'flarum/common/components/Dropdown';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';
export interface INodeTypeOption {
    title: string;
    name: string;
    attrs?: Record<string, unknown>;
    tooltip: Mithril.Children;
}
export interface INodeTypeDropdownAttrs extends IDropdownAttrs {
    tooltip: string;
    editor: Editor;
    options: INodeTypeOption[];
    onclick?: () => void;
    buttonAttrs?: Record<string, string>;
}
export default class NodeTypeDropdown extends Dropdown<INodeTypeDropdownAttrs> {
    activeIndex: number;
    static initAttrs(attrs: INodeTypeDropdownAttrs): void;
    oninit(vnode: Mithril.Vnode<INodeTypeDropdownAttrs, this>): void;
    oncreate(vnode: Mithril.VnodeDOM<INodeTypeDropdownAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<INodeTypeDropdownAttrs, this>): void;
    getButton(children: Mithril.ChildArray): JSX.Element;
    getButtonContent(_children: Mithril.ChildArray): JSX.Element;
    getNodeTypeButtons(): JSX.Element[];
    getMenu(_items: Mithril.Vnode[]): JSX.Element;
    keydown(name: string, attrs: Record<string, unknown> | undefined, e: KeyboardEvent): void;
    click(name: string, attrs: Record<string, unknown> | undefined, e: Event): void;
    onEditorUpdate(): void;
}
