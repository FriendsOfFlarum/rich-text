import app from 'flarum/common/app';
import extractText from 'flarum/common/utils/extractText';
import Stream from 'flarum/common/utils/Stream';
import FormDropdown, { IFormDropdownAttrs } from './FormDropdown';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';

export interface IInsertImageDropdownAttrs extends IFormDropdownAttrs {
  editor: Editor;
}

export default class InsertImageDropdown extends FormDropdown<IInsertImageDropdownAttrs> {
  src!: Stream<string>;
  title!: Stream<string>;

  oninit(vnode: Mithril.Vnode<IInsertImageDropdownAttrs, this>) {
    super.oninit(vnode);

    this.src = Stream('');
    this.title = Stream('');
  }

  fields() {
    const items = super.fields();

    items.add(
      'src',
      <div className="Form-group">
        <input
          className="FormControl"
          name="src"
          type="url"
          placeholder={extractText(app.translator.trans('fof-rich-text.lib.composer.insert_image.src_placeholder'))}
          bidi={this.src}
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
          placeholder={extractText(app.translator.trans('fof-rich-text.lib.composer.insert_image.title_placeholder'))}
          bidi={this.title}
        />
      </div>,
      10
    );

    return items;
  }

  insert(_e: SubmitEvent) {
    this.attrs.editor
      .chain()
      .focus()
      .setImage({
        src: this.src(),
        title: this.title(),
      })
      .run();

    this.src('');
    this.title('');
  }
}
