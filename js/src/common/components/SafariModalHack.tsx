import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import type Mithril from 'mithril';

export interface ISafariModalHackAttrs extends IInternalModalAttrs {
  title: Mithril.Children;
  vnodeContent: Mithril.Children;
  onsubmit?: (e: SubmitEvent) => void;
}

export default class SafariModalHack extends Modal<ISafariModalHackAttrs> {
  className() {
    return 'LoadingModal Modal--small';
  }

  title() {
    return this.attrs.title;
  }

  oncreate(vnode: Mithril.VnodeDOM<ISafariModalHackAttrs, this>) {
    super.oncreate(vnode);

    this.$('.CommandButton').on('click', () => {
      app.modal.close();
    });
  }

  content() {
    const onsubmit = this.attrs.onsubmit ? this.attrs.onsubmit.bind(this) : () => {};
    return (
      <div className="Modal-body">
        <form className="Form" onsubmit={onsubmit}>
          {this.attrs.vnodeContent}
        </form>
      </div>
    );
  }
}
