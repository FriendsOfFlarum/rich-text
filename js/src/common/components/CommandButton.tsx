import Component, { ComponentAttrs } from 'flarum/common/Component';
import Tooltip from 'flarum/common/components/Tooltip';
import Icon from 'flarum/common/components/Icon';
import extractText from 'flarum/common/utils/extractText';
import classList from 'flarum/common/utils/classList';
import type { Editor } from '@tiptap/core';
import type Mithril from 'mithril';

export interface ICommandButtonAttrs extends ComponentAttrs {
  tooltip: Mithril.Children;
  icon: string;
  editor: Editor;
  command?: (editor: Editor) => void;
}

export default class CommandButton<CustomAttrs extends ICommandButtonAttrs = ICommandButtonAttrs> extends Component<CustomAttrs> {
  view() {
    return (
      <Tooltip text={extractText(this.attrs.tooltip)}>
        <button
          className={classList('Button Button--icon Button--link CommandButton', { active: this.isActive() })}
          onclick={this.click.bind(this)}
          onkeydown={this.keydown.bind(this)}
        >
          <Icon name={this.attrs.icon} />
        </button>
      </Tooltip>
    );
  }

  isActive(): boolean {
    return false;
  }

  keydown(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      this.click(e);
    }
  }

  click(e: Event) {
    e.preventDefault();
    if (this.attrs.command) {
      this.attrs.command(this.attrs.editor);
    }
  }
}
