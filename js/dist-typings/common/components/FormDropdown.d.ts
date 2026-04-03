import Dropdown, { IDropdownAttrs } from 'flarum/common/components/Dropdown';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';
export interface IFormDropdownAttrs extends IDropdownAttrs {
    tooltip: string;
    icon: string;
    state?: Editor;
    onclick?: () => void;
    buttonAttrs?: Record<string, string>;
}
export default class FormDropdown<CustomAttrs extends IFormDropdownAttrs = IFormDropdownAttrs> extends Dropdown<CustomAttrs> {
    static initAttrs(attrs: IFormDropdownAttrs): void;
    oninit(vnode: Mithril.Vnode<CustomAttrs, this>): void;
    oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void;
    getButton(children: Mithril.ChildArray): JSX.Element;
    getButtonContent(_children: Mithril.ChildArray): JSX.Element;
    getMenu(_items: Mithril.Vnode[]): JSX.Element;
    fields(): ItemList<Mithril.Children>;
    onsubmit(e: SubmitEvent): void;
    insert(_e: SubmitEvent): void;
}
