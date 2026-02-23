import { extend, override } from 'flarum/common/extend';

import Button from 'flarum/common/components/Button';
import TextEditor from 'flarum/common/components/TextEditor';
import Tooltip from 'flarum/common/components/Tooltip';
import classList from 'flarum/common/utils/classList';

export default function applyEditor() {
  // Lazy load the Tiptap editor bundle when rich text is enabled
  extend(TextEditor.prototype, 'oninit', function () {
    if (!app.session.user || !app.session.user.preferences().useRichTextEditor) return;

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

    const buttonOnClick = () => {
      const newValue = !app.session.user.preferences().useRichTextEditor;

      // When switching to rich text, ensure modules are loaded first
      const loadModules =
        newValue && !this._TiptapEditorDriver
          ? Promise.all([import('./tiptap/TiptapEditorDriver'), import('./components/TiptapMenu')]).then(([driverModule, menuModule]) => {
              this._TiptapEditorDriver = driverModule.default;
              this._TiptapMenu = menuModule.default;
            })
          : Promise.resolve();

      Promise.all([app.session.user.savePreferences({ useRichTextEditor: newValue }), loadModules]).then(() => {
        app.composer.editor.destroy();
        this.attrs.composer.editor = this.buildEditor(this.$('.TextEditor-editorContainer')[0]);
        m.redraw.sync();
        app.composer.editor.focus();
      });
    };

    items.add(
      'rich-text',
      <Tooltip text={app.translator.trans('fof-rich-text.lib.composer.toggle_button')}>
        <Button
          icon="fas fa-pen-fancy"
          className={classList({ Button: true, 'Button--icon': true, active: app.session.user.preferences().useRichTextEditor })}
          onclick={buttonOnClick}
        />
      </Tooltip>,
      -10
    );
  });

  extend(TextEditor.prototype, 'toolbarItems', function (items) {
    if (!app.session.user.preferences().useRichTextEditor) return;
    if (!this._TiptapMenu || !this.tiptapEditor) return;

    const TiptapMenu = this._TiptapMenu;

    items.remove('markdown');

    items.add('richText', <TiptapMenu editor={this.tiptapEditor} />, 100);
  });

  extend(TextEditor.prototype, 'buildEditorParams', function (items) {
    if (!app.session.user.preferences().useRichTextEditor) return;

    items.classNames.push('Post-body');
    items.escape = () => app.composer.close();
  });

  override(TextEditor.prototype, 'buildEditor', function (original, dom) {
    if (app.session.user.preferences().useRichTextEditor && this._TiptapEditorDriver) {
      const driver = new this._TiptapEditorDriver(dom, this.buildEditorParams());
      this.tiptapEditor = driver.editor;
      return driver;
    }

    this.tiptapEditor = null;
    return original(dom);
  });
}
