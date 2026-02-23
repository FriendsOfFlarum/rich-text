import CommandButton from './CommandButton';

export default class MarkButton extends CommandButton {
  static initAttrs(attrs) {
    attrs.command = (editor) => editor.chain().focus().toggleMark(attrs.mark).run();
  }

  isActive() {
    return !!this.attrs.editor?.isActive(this.attrs.mark);
  }
}
