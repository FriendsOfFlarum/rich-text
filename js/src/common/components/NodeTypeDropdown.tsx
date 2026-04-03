import app from 'flarum/common/app';
import Dropdown, { IDropdownAttrs } from 'flarum/common/components/Dropdown';
import Tooltip from 'flarum/common/components/Tooltip';
import extractText from 'flarum/common/utils/extractText';
import SafariModalHack from './SafariModalHack';
import type Mithril from 'mithril';
import type { Editor } from '@tiptap/core';

export interface INodeTypeOption {
  title: string;
  name: string;
  attrs?: Record<string, unknown>;
  tooltip: Mithril.Children;
}

export interface INodeTypeDropdownAttrs extends IDropdownAttrs {
  tooltip: string;
  editor: Editor;
  options: INodeTypeOption[];
  onclick?: () => void;
  buttonAttrs?: Record<string, string>;
}

export default class NodeTypeDropdown extends Dropdown<INodeTypeDropdownAttrs> {
  activeIndex!: number;

  static initAttrs(attrs: INodeTypeDropdownAttrs) {
    attrs.buttonClassName = 'Button Button--icon Button--link NodeTypeButton Button--menuDropdown';
  }

  oninit(vnode: Mithril.Vnode<INodeTypeDropdownAttrs, this>) {
    super.oninit(vnode);
    this.activeIndex = 0;
  }

  oncreate(vnode: Mithril.VnodeDOM<INodeTypeDropdownAttrs, this>) {
    super.oncreate(vnode);

    this.$().on('click', (e) => {
      if (app.screen() === 'phone') {
        app.modal.show(SafariModalHack, {
          title: this.attrs.tooltip,
          vnodeContent: this.getNodeTypeButtons(),
        });
        e.stopPropagation();
      }
    });

    this.onEditorUpdate();
  }

  onupdate(vnode: Mithril.VnodeDOM<INodeTypeDropdownAttrs, this>) {
    super.onupdate(vnode);
    this.onEditorUpdate();
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
        <span className="NodeTypeButton-label"></span>
      </Tooltip>
    );
  }

  getNodeTypeButtons() {
    return this.attrs.options
      .filter((_, i) => i !== this.activeIndex)
      .map((option) => (
        <Tooltip text={extractText(option.tooltip)} key={option.title}>
          <button
            className="Button Button--icon Button--link NodeTypeButton"
            onclick={this.click.bind(this, option.name, option.attrs)}
            onkeydown={this.keydown.bind(this, option.name, option.attrs)}
          >
            {option.title}
          </button>
        </Tooltip>
      ));
  }

  getMenu(_items: Mithril.Vnode[]) {
    return <ul className={'Dropdown-menu dropdown-menu NodeTypeDropdownMenu'}>{this.getNodeTypeButtons()}</ul>;
  }

  keydown(name: string, attrs: Record<string, unknown> | undefined, e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      this.click(name, attrs, e);
    }
  }

  click(name: string, attrs: Record<string, unknown> | undefined, e: Event) {
    app.modal.close();
    e.preventDefault();

    const editor = this.attrs.editor;
    if (!editor) return;

    if (name === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else if (name === 'heading') {
      editor
        .chain()
        .focus()
        .setHeading(attrs as { level: 1 | 2 | 3 | 4 | 5 | 6 })
        .run();
    }
  }

  onEditorUpdate() {
    if (!this.element) return;

    const label = this.element.querySelector('.NodeTypeButton-label');
    if (!label) return;

    const editor = this.attrs.editor;
    if (!editor) return;

    this.attrs.options.forEach((option, i) => {
      if (editor.isActive(option.name, option.attrs)) {
        label.textContent = option.title;
        this.activeIndex = i;
      }
    });
  }
}
