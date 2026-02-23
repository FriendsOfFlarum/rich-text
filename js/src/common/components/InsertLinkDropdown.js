import Button from 'flarum/common/components/Button';
import extractText from 'flarum/common/utils/extractText';
import Stream from 'flarum/common/utils/Stream';
import FormDropdown from './FormDropdown';

export default class InsertLinkDropdown extends FormDropdown {
  oninit(vnode) {
    super.oninit(vnode);

    this.text = Stream('');
    this.href = Stream('');
    this.title = Stream('');
    this.active = false;
    this.selectionEmpty = true;
  }

  onupdate(vnode) {
    super.onupdate(vnode);

    const editor = this.attrs.editor;
    if (!editor) return;

    this.active = editor.isActive('link');
    this.$('.Dropdown-toggle').toggleClass('active', this.active);

    const attrs = editor.getAttributes('link');
    this.href(attrs.href || '');
    this.title(attrs.title || '');

    this.selectionEmpty = editor.state.selection.empty;
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

  insert(e) {
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
        .run();

      this.text('');
    } else {
      editor.chain().focus().setLink(linkAttrs).run();
    }
  }

  remove(e) {
    $('body').trigger('click');
    this.attrs.editor.chain().focus().unsetLink().run();
    app.composer.editor.focus();
  }
}
