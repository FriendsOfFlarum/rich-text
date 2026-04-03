import Component, { ComponentAttrs } from 'flarum/common/Component';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';
export interface ITiptapMenuAttrs extends ComponentAttrs {
    editor: Editor;
}
export default class TiptapMenu extends Component<ITiptapMenuAttrs> {
    modifierKey: string;
    oninit(vnode: Mithril.Vnode<ITiptapMenuAttrs, this>): void;
    view(_vnode: Mithril.Vnode<ITiptapMenuAttrs, this>): "" | JSX.Element;
    items(): ItemList<Mithril.Children>;
    hiddenItems(): ItemList<Mithril.Children>;
}
