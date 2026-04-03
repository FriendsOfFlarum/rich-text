import CommandButton, { ICommandButtonAttrs } from './CommandButton';

export interface IMarkButtonAttrs extends ICommandButtonAttrs {
  mark: string;
}

export default class MarkButton extends CommandButton<IMarkButtonAttrs> {
  static initAttrs(attrs: IMarkButtonAttrs) {
    attrs.command = (editor) => editor.chain().focus().toggleMark(attrs.mark).run();
  }

  isActive(): boolean {
    return !!this.attrs.editor?.isActive(this.attrs.mark);
  }
}
