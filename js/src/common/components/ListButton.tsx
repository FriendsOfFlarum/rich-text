import CommandButton, { ICommandButtonAttrs } from './CommandButton';

export interface IListButtonAttrs extends ICommandButtonAttrs {
  listType: 'bulletList' | 'orderedList';
}

export default class ListButton extends CommandButton<IListButtonAttrs> {
  static initAttrs(attrs: IListButtonAttrs) {
    attrs.command = (editor) => {
      if (attrs.listType === 'bulletList') {
        editor.chain().focus().toggleBulletList().run();
      } else if (attrs.listType === 'orderedList') {
        editor.chain().focus().toggleOrderedList().run();
      }
    };
  }

  isActive(): boolean {
    return !!this.attrs.editor?.isActive(this.attrs.listType);
  }
}
