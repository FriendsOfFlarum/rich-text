import Stream from 'flarum/common/utils/Stream';
import FormDropdown, { IFormDropdownAttrs } from './FormDropdown';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';
export interface IInsertLinkDropdownAttrs extends IFormDropdownAttrs {
    editor: Editor;
}
export default class InsertLinkDropdown extends FormDropdown<IInsertLinkDropdownAttrs> {
    text: Stream<string>;
    href: Stream<string>;
    title: Stream<string>;
    active: boolean;
    selectionEmpty: boolean;
    isOpen: boolean;
    oninit(vnode: Mithril.Vnode<IInsertLinkDropdownAttrs, this>): void;
    oncreate(vnode: Mithril.VnodeDOM<IInsertLinkDropdownAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<IInsertLinkDropdownAttrs, this>): void;
    fields(): import("flarum/common/utils/ItemList").default<Mithril.Children>;
    insert(_e: SubmitEvent): void;
    remove(_e: Event): void;
}
