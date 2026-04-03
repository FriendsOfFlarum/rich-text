import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import type Mithril from 'mithril';
export interface ISafariModalHackAttrs extends IInternalModalAttrs {
    title: Mithril.Children;
    vnodeContent: Mithril.Children;
    onsubmit?: (e: SubmitEvent) => void;
}
export default class SafariModalHack extends Modal<ISafariModalHackAttrs> {
    className(): string;
    title(): Mithril.Children;
    oncreate(vnode: Mithril.VnodeDOM<ISafariModalHackAttrs, this>): void;
    content(): JSX.Element;
}
