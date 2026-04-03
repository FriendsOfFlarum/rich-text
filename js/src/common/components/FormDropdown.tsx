import app from 'flarum/common/app';
import Button from 'flarum/common/components/Button';
import Dropdown, { IDropdownAttrs } from 'flarum/common/components/Dropdown';
import Icon from 'flarum/common/components/Icon';
import Tooltip from 'flarum/common/components/Tooltip';
import ItemList from 'flarum/common/utils/ItemList';
import SafariModalHack from './SafariModalHack';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';

export interface IFormDropdownAttrs extends IDropdownAttrs {
  tooltip: string;
  icon: string;
  state?: Editor;
  onclick?: () => void;
  buttonAttrs?: Record<string, string>;
}

export default class FormDropdown<CustomAttrs extends IFormDropdownAttrs = IFormDropdownAttrs> extends Dropdown<CustomAttrs> {
  static initAttrs(attrs: IFormDropdownAttrs) {
    attrs.buttonClassName = 'Button Button--icon Button--link Button--menuDropdown';
  }

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);
  }

  oncreate(vnode: Mithril.VnodeDOM<CustomAttrs, this>) {
    super.oncreate(vnode);

    this.$().on('click', (e) => {
      if (app.screen() === 'phone') {
        // Mobile Safari doesn't support fixed items
        // So, we wrap them in a modal.
        app.modal.show(SafariModalHack, {
          title: this.attrs.tooltip,
          vnodeContent: this.fields().toArray(),
          onsubmit: this.onsubmit.bind(this),
        });
        e.stopPropagation();
      }
    });

    this.$().on('shown.bs.dropdown', () => {
      this.$('.Dropdown-menu').find('input, select, textarea').first().focus().select();
    });
  }

  getButton(children: Mithril.ChildArray) {
    return (
      <button
        type="button"
        className={'Dropdown-toggle ' + this.attrs.buttonClassName}
        aria-haspopup="menu"
        data-toggle="dropdown"
        onclick={this.attrs.onclick}
        {...this.attrs.buttonAttrs}
      >
        {this.getButtonContent(children)}
      </button>
    );
  }

  getButtonContent(_children: Mithril.ChildArray) {
    return (
      <Tooltip text={this.attrs.tooltip}>
        <span>
          <Icon name={this.attrs.icon} className="Button-icon" />
        </span>
      </Tooltip>
    );
  }

  getMenu(_items: Mithril.Vnode[]) {
    return (
      <ul className={'Dropdown-menu dropdown-menu FormDropdown'}>
        <form className="Form" onsubmit={this.onsubmit.bind(this)}>
          {this.fields().toArray()}
        </form>
      </ul>
    );
  }

  fields(): ItemList<Mithril.Children> {
    const items = new ItemList<Mithril.Children>();

    items.add(
      'insert',
      <Button type="submit" className="Button Button--primary">
        {app.translator.trans('fof-rich-text.lib.composer.insert_button')}
      </Button>
    );

    return items;
  }

  onsubmit(e: SubmitEvent) {
    // Here for the safari workaround
    app.modal.close();
    e.preventDefault();
    $('body').trigger('click');
    this.insert(e);
    (app as any).composer.editor?.focus();
  }

  insert(_e: SubmitEvent) {}
}
