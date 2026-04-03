import Dropdown, { IDropdownAttrs } from 'flarum/common/components/Dropdown';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';
export interface IHiddenItemsDropdownAttrs extends IDropdownAttrs {
    tooltip: string;
    icon: string;
    state?: Editor;
    buttons: Mithril.Children[];
    onclick?: () => void;
    buttonAttrs?: Record<string, string>;
}
export default class HiddenItemsDropdown extends Dropdown<IHiddenItemsDropdownAttrs> {
    static initAttrs(attrs: IHiddenItemsDropdownAttrs): void;
    oninit(vnode: Mithril.Vnode<IHiddenItemsDropdownAttrs, this>): void;
    oncreate(vnode: Mithril.VnodeDOM<IHiddenItemsDropdownAttrs, this>): void;
    getButton(children: Mithril.ChildArray): JSX.Element;
    getButtonContent(_children: Mithril.ChildArray): JSX.Element;
    getMenu(_items: Mithril.Vnode[]): JSX.Element;
}
