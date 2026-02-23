import Component from 'flarum/common/Component';
import Tooltip from 'flarum/common/components/Tooltip';
import Icon from 'flarum/common/components/Icon';
import extractText from 'flarum/common/utils/extractText';
import classList from 'flarum/common/utils/classList';

export default class CommandButton extends Component {
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

  isActive() {
    return false;
  }

  keydown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      this.click(e);
    }
  }

  click(e) {
    e.preventDefault();
    if (this.attrs.command) {
      this.attrs.command(this.attrs.editor);
    }
  }
}
