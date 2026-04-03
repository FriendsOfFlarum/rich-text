import Component, { ComponentAttrs } from 'flarum/common/Component';
import type { Editor } from '@tiptap/core';
import type Mithril from 'mithril';
export interface ICommandButtonAttrs extends ComponentAttrs {
    tooltip: Mithril.Children;
    icon: string;
    editor: Editor;
    command?: (editor: Editor) => void;
}
export default class CommandButton<CustomAttrs extends ICommandButtonAttrs = ICommandButtonAttrs> extends Component<CustomAttrs> {
    view(): JSX.Element;
    isActive(): boolean;
    keydown(e: KeyboardEvent): void;
    click(e: Event): void;
}
