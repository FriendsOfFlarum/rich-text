import app from 'flarum/common/app';
import Dropdown, { IDropdownAttrs } from 'flarum/common/components/Dropdown';
import Icon from 'flarum/common/components/Icon';
import Tooltip from 'flarum/common/components/Tooltip';
import SafariModalHack from './SafariModalHack';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';

export interface IHiddenItemsDropdownAttrs extends IDropdownAttrs {
  tooltip: string;
  icon: string;
  state?: Editor;
  buttons: Mithril.Children[];
  onclick?: () => void;
  buttonAttrs?: Record<string, string>;
}

export default class HiddenItemsDropdown extends Dropdown<IHiddenItemsDropdownAttrs> {
  static initAttrs(attrs: IHiddenItemsDropdownAttrs) {
    attrs.buttonClassName = 'Button Button--icon Button--link Button--menuDropdown';
  }

  oninit(vnode: Mithril.Vnode<IHiddenItemsDropdownAttrs, this>) {
    super.oninit(vnode);
  }

  oncreate(vnode: Mithril.VnodeDOM<IHiddenItemsDropdownAttrs, this>) {
    super.oncreate(vnode);

    this.$().on('click', (e) => {
      if (app.screen() === 'phone') {
        // Mobile Safari doesn't support fixed items
        // So, we wrap them in a modal.
        app.modal.show(SafariModalHack, {
          title: this.attrs.tooltip,
          vnodeContent: this.attrs.buttons.map((button) => {
            return button;
          }),
        });
        e.stopPropagation();
      }
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
    return <ul className={'Dropdown-menu dropdown-menu HiddenItemsDropdownMenu'}>{this.attrs.buttons}</ul>;
  }
}
