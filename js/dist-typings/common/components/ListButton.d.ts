import CommandButton, { ICommandButtonAttrs } from './CommandButton';
export interface IListButtonAttrs extends ICommandButtonAttrs {
    listType: 'bulletList' | 'orderedList';
}
export default class ListButton extends CommandButton<IListButtonAttrs> {
    static initAttrs(attrs: IListButtonAttrs): void;
    isActive(): boolean;
}
