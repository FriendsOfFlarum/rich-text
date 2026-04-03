import Stream from 'flarum/common/utils/Stream';
import FormDropdown, { IFormDropdownAttrs } from './FormDropdown';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';
export interface IInsertImageDropdownAttrs extends IFormDropdownAttrs {
    editor: Editor;
}
export default class InsertImageDropdown extends FormDropdown<IInsertImageDropdownAttrs> {
    src: Stream<string>;
    title: Stream<string>;
    oninit(vnode: Mithril.Vnode<IInsertImageDropdownAttrs, this>): void;
    fields(): import("flarum/common/utils/ItemList").default<Mithril.Children>;
    insert(_e: SubmitEvent): void;
}
