import CommandButton, { ICommandButtonAttrs } from './CommandButton';
export interface IMarkButtonAttrs extends ICommandButtonAttrs {
    mark: string;
}
export default class MarkButton extends CommandButton<IMarkButtonAttrs> {
    static initAttrs(attrs: IMarkButtonAttrs): void;
    isActive(): boolean;
}
