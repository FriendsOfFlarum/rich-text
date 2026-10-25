import app from 'flarum/common/app';
import Button from 'flarum/common/components/Button';
import extractText from 'flarum/common/utils/extractText';
import Stream from 'flarum/common/utils/Stream';
import FormDropdown, { IFormDropdownAttrs } from './FormDropdown';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';

export interface IInsertLinkDropdownAttrs extends IFormDropdownAttrs {
  editor: Editor;
}

export default class InsertLinkDropdown extends FormDropdown<IInsertLinkDropdownAttrs> {
  text!: Stream<string>;
  href!: Stream<string>;
  title!: Stream<string>;
  active!: boolean;
  selectionEmpty!: boolean;

  oninit(vnode: Mithril.Vnode<IInsertLinkDropdownAttrs, this>) {
    super.oninit(vnode);

    this.text = Stream('');
    this.href = Stream('');
    this.title = Stream('');
    this.active = false;
    this.selectionEmpty = true;
  }

  onupdate(vnode: Mithril.VnodeDOM<IInsertLinkDropdownAttrs, this>) {
    super.onupdate(vnode);

    this.$('.Dropdown-toggle').toggleClass('active', !!this.attrs.editor?.isActive('link'));
  }

  /**
   * Fill the form from the link at the cursor. This runs once as the form opens,
   * not on every redraw: the phone form is a modal, so the dropdown never counts
   * as open, and each redraw while typing wiped the URL and title entered so far.
   */
  onopen() {
    const editor = this.attrs.editor;
    if (!editor) return;

    const attrs = editor.getAttributes('link');

    this.active = editor.isActive('link');
    this.selectionEmpty = editor.state.selection.empty;
    this.text('');
    this.href(attrs.href || '');
    this.title(attrs.title || '');
  }

  fields() {
    const items = super.fields();

    if (this.selectionEmpty && !this.active) {
      items.add(
        'text',
        <div className="Form-group">
          <input
            className="FormControl"
            name="text"
            placeholder={extractText(app.translator.trans('fof-rich-text.lib.composer.insert_link.text_placeholder'))}
            bidi={this.text}
            required
          />
        </div>,
        10
      );
    }

    items.add(
      'href',
      <div className="Form-group">
        <input
          className="FormControl"
          name="href"
          type="url"
          placeholder={extractText(app.translator.trans('fof-rich-text.lib.composer.insert_link.href_placeholder'))}
          bidi={this.href}
          required
        />
      </div>,
      10
    );

    items.add(
      'title',
      <div className="Form-group">
        <input
          className="FormControl"
          name="title"
          placeholder={extractText(app.translator.trans('fof-rich-text.lib.composer.insert_link.title_placeholder'))}
          bidi={this.title}
        />
      </div>,
      10
    );

    if (this.active) {
      items.add(
        'remove',
        <Button onclick={this.remove.bind(this)} className="Button Button--danger">
          {app.translator.trans('fof-rich-text.lib.composer.insert_link.remove_button')}
        </Button>,
        -10
      );
    }

    return items;
  }

  insert(_e: SubmitEvent) {
    const editor = this.attrs.editor;
    const linkAttrs = { href: this.href(), title: this.title() };

    if (this.selectionEmpty && !this.active) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: this.text(),
          marks: [{ type: 'link', attrs: linkAttrs }],
        })
        .unsetMark('link')
        .insertContent(' ')
        .run();
    } else {
      // Over the whole link at the cursor: with no selection, setLink alone only
      // marks text typed next, so editing a link changed nothing. The selection
      // is put back after, or the next keystroke would replace the link's text.
      const { from, to } = editor.state.selection;
      editor.chain().focus().extendMarkRange('link').setLink(linkAttrs).setTextSelection({ from, to }).run();
    }

    // Reset streams after insert
    this.text('');
    this.href('');
    this.title('');
  }

  remove(_e: Event) {
    // On a phone the form is a modal.
    app.modal.close();
    $('body').trigger('click');
    this.attrs.editor.chain().focus().unsetLink().run();
    (app as any).composer.editor?.focus();
  }
}
