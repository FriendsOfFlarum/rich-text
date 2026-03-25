import Dropdown from 'flarum/common/components/Dropdown';
import Icon from 'flarum/common/components/Icon';
import Tooltip from 'flarum/common/components/Tooltip';
import SafariModalHack from './SafariModalHack';

export default class HiddenItemsDropdown extends Dropdown {
  static initAttrs(attrs) {
    attrs.buttonClassName = 'Button Button--icon Button--link Button--menuDropdown';
  }

  oninit(vnode) {
    super.oninit(vnode);

    this.state = this.attrs.state;
  }

  oncreate(vnode) {
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

  getButton(children) {
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

  getButtonContent(children) {
    return (
      <Tooltip text={this.attrs.tooltip}>
        <span>
          <Icon name={this.attrs.icon} className="Button-icon" />
        </span>
      </Tooltip>
    );
  }

  getMenu(items) {
    return <ul className={'Dropdown-menu dropdown-menu HiddenItemsDropdownMenu'}>{this.attrs.buttons}</ul>;
  }
}
