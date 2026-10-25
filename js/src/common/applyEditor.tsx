import type EditorDriverInterface from 'flarum/common/utils/EditorDriverInterface';
import type ComposerState from 'flarum/forum/states/ComposerState';
import app from 'flarum/common/app';
import { extend, override } from 'flarum/common/extend';

import Button from 'flarum/common/components/Button';
import TextEditor from 'flarum/common/components/TextEditor';
import Tooltip from 'flarum/common/components/Tooltip';
import classList from 'flarum/common/utils/classList';

import type TiptapEditorDriver from './tiptap/TiptapEditorDriver';
import type TiptapMenu from './components/TiptapMenu';
import type { Editor } from '@tiptap/core';

declare module 'flarum/common/components/TextEditor' {
  export default interface TextEditor {
    _TiptapEditorDriver: typeof TiptapEditorDriver | undefined;
    _TiptapMenu: typeof TiptapMenu | undefined;
    tiptapEditor: Editor | null | undefined;
    _useRichTextEditor: boolean;
    _richTextToggleLoading: boolean;
  }
}

export default function applyEditor() {
  // Lazy load the Tiptap editor bundle when rich text is enabled
  extend(TextEditor.prototype, 'oninit', function () {
    this._useRichTextEditor = Boolean(app.session.user?.preferences()?.useRichTextEditor);
    this._richTextToggleLoading = false;
    if (!this._useRichTextEditor) return;

    this._loaders = this._loaders || [];
    this._loaders.push(() =>
      Promise.all([import('./tiptap/TiptapEditorDriver'), import('./components/TiptapMenu')]).then(([driverModule, menuModule]) => {
        this._TiptapEditorDriver = driverModule.default;
        this._TiptapMenu = menuModule.default;
      })
    );
  });

  extend(TextEditor.prototype, 'controlItems', function (items) {
    if (!app.forum.attribute('toggleRichTextEditorButton')) return;
    if (!app.session.user) return;

    const user = app.session.user;

    const buttonOnClick = async () => {
      if (this._richTextToggleLoading) return;
      const composer = (this.attrs as { composer: ComposerState }).composer;
      const currentEditor = composer.editor as EditorDriverInterface | null;
      const container = this.$('.TextEditor-editorContainer')[0];
      if (!currentEditor || !container?.isConnected) return;

      const newValue = !this._useRichTextEditor;
      this._richTextToggleLoading = true;

      // When switching to rich text, ensure modules are loaded first
      const loadModules =
        newValue && !this._TiptapEditorDriver
          ? Promise.all([import('./tiptap/TiptapEditorDriver'), import('./components/TiptapMenu')]).then(([driverModule, menuModule]) => {
              this._TiptapEditorDriver = driverModule.default;
              this._TiptapMenu = menuModule.default;
            })
          : Promise.resolve();

      try {
        await Promise.all([user.savePreferences({ useRichTextEditor: newValue }), loadModules]);

        // Closing or replacing the composer while the request is pending invalidates this editor.
        if (!container.isConnected || composer.editor !== currentEditor) return;

        this._useRichTextEditor = newValue;
        currentEditor.destroy();
        container.replaceChildren();
        this.tiptapEditor = null;
        // Run core's build lifecycle so mentions, emoji, and upload hooks are reattached.
        this.onbuild();
        m.redraw.sync();
        composer.editor?.focus();
      } catch (error) {
        console.error('[fof/rich-text] Unable to switch editor mode.', error);
        app.alerts.show({ type: 'error' }, app.translator.trans('core.lib.error.generic_message'));
      } finally {
        this._richTextToggleLoading = false;
        m.redraw();
      }
    };

    items.add(
      'rich-text',
      <Tooltip text={app.translator.trans('fof-rich-text.lib.composer.toggle_button')}>
        <Button
          icon="fas fa-pen-fancy"
          className={classList({ Button: true, 'Button--icon': true, active: this._useRichTextEditor })}
          loading={this._richTextToggleLoading}
          onclick={buttonOnClick}
        />
      </Tooltip>,
      -10
    );
  });

  extend(TextEditor.prototype, 'toolbarItems', function (items) {
    if (!this._useRichTextEditor) return;
    if (!this._TiptapMenu || !this.tiptapEditor) return;

    const TiptapMenu = this._TiptapMenu;

    items.remove('markdown');

    items.add('richText', <TiptapMenu editor={this.tiptapEditor} />, 100);
  });

  extend(TextEditor.prototype, 'buildEditorParams', function (items) {
    if (!this._useRichTextEditor) return;

    items.classNames.push('Post-body');
    (items as any).escape = () => (app as any).composer.close();
  });

  override(TextEditor.prototype, 'buildEditor', function (original, dom) {
    // On a slow first load the editor container may not be in the DOM yet when
    // core's `onbuild` fires, leaving `dom` undefined (see flarum/framework#4657,
    // which fixes the upstream race). Constructing Tiptap without a mount target
    // skips its internal mount and later throws when the view is dereferenced,
    // which extend()'s try/catch swallows into a dead toolbar. Fall back to core's
    // BasicEditorDriver so the user still gets a working editor (issue #11).
    if (!dom) {
      console.warn('[fof/rich-text] buildEditor called without a mount target; falling back to the basic editor.');
      this.tiptapEditor = null;
      return original(dom);
    }

    if (this._useRichTextEditor && this._TiptapEditorDriver) {
      const driver = new this._TiptapEditorDriver(dom, this.buildEditorParams() as any);
      this.tiptapEditor = driver.editor;
      return driver;
    }

    this.tiptapEditor = null;
    return original(dom);
  });
}
