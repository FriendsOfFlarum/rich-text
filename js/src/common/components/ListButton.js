import CommandButton from './CommandButton';

export default class ListButton extends CommandButton {
  static initAttrs(attrs) {
    attrs.command = (editor) => {
      if (attrs.listType === 'bulletList') {
        editor.chain().focus().toggleBulletList().run();
      } else if (attrs.listType === 'orderedList') {
        editor.chain().focus().toggleOrderedList().run();
      }
    };
  }

  isActive() {
    return !!this.attrs.editor?.isActive(this.attrs.listType);
  }
}
