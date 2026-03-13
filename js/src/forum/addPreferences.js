import { extend } from 'flarum/common/extend';
import FieldSet from 'flarum/common/components/FieldSet';
import Switch from 'flarum/common/components/Switch';
import ItemList from 'flarum/common/utils/ItemList';

export default function addPreferences() {
  extend('flarum/forum/components/SettingsPage', 'settingsItems', function (items) {
    const composerItems = new ItemList();

    composerItems.add(
      'useRichTextEditor',
      Switch.component(
        {
          state: this.user.preferences().useRichTextEditor,
          onchange: (value) => {
            this.useRichTextEditorLoading = true;

            this.user.savePreferences({ useRichTextEditor: value }).then(() => {
              this.useRichTextEditorLoading = false;
              m.redraw();
            });
          },
          loading: this.useRichTextEditorLoading,
        },
        app.translator.trans('fof-rich-text.forum.settings.use_rich_text_editor_label')
      )
    );

    if (!app.forum.attribute('richTextForceCompactParagraphs')) {
      composerItems.add(
        'richTextCompactParagraphs',
        Switch.component(
          {
            state: this.user.preferences().richTextCompactParagraphs,
            onchange: (value) => {
              this.richTextCompactParagraphsLoading = true;

              this.user.savePreferences({ richTextCompactParagraphs: value }).then(() => {
                this.richTextCompactParagraphsLoading = false;
                m.redraw();
              });
            },
            loading: this.richTextCompactParagraphsLoading,
          },
          app.translator.trans('fof-rich-text.forum.settings.rich_text_compact_paragraphs_label')
        )
      );
    }

    items.add(
      'composer',
      FieldSet.component(
        {
          label: app.translator.trans('fof-rich-text.forum.settings.composer_heading'),
          className: 'Settings-composer',
        },
        composerItems.toArray()
      )
    );
  });
}
