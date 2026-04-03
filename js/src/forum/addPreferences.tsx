import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import FieldSet from 'flarum/common/components/FieldSet';
import Switch from 'flarum/common/components/Switch';
import ItemList from 'flarum/common/utils/ItemList';
import type SettingsPage from 'flarum/forum/components/SettingsPage';
import type Mithril from 'mithril';

declare module 'flarum/forum/components/SettingsPage' {
  export default interface SettingsPage {
    useRichTextEditorLoading?: boolean;
    richTextCompactParagraphsLoading?: boolean;
  }
}

export default function addPreferences() {
  extend<SettingsPage, 'settingsItems'>('flarum/forum/components/SettingsPage', 'settingsItems', function (items) {
    const composerItems = new ItemList<Mithril.Children>();

    composerItems.add(
      'useRichTextEditor',
      <Switch
        state={this.user?.preferences()?.useRichTextEditor}
        onchange={(value: boolean) => {
          this.useRichTextEditorLoading = true;

          this.user!.savePreferences({ useRichTextEditor: value }).then(() => {
            this.useRichTextEditorLoading = false;
            m.redraw();
          });
        }}
        loading={this.useRichTextEditorLoading}
      >
        {app.translator.trans('fof-rich-text.forum.settings.use_rich_text_editor_label')}
      </Switch>
    );

    if (!app.forum.attribute('richTextForceCompactParagraphs')) {
      composerItems.add(
        'richTextCompactParagraphs',
        <Switch
          state={this.user?.preferences()?.richTextCompactParagraphs}
          onchange={(value: boolean) => {
            this.richTextCompactParagraphsLoading = true;

            this.user!.savePreferences({ richTextCompactParagraphs: value }).then(() => {
              this.richTextCompactParagraphsLoading = false;
              m.redraw();
            });
          }}
          loading={this.richTextCompactParagraphsLoading}
        >
          {app.translator.trans('fof-rich-text.forum.settings.rich_text_compact_paragraphs_label')}
        </Switch>
      );
    }

    items.add(
      'composer',
      <FieldSet label={app.translator.trans('fof-rich-text.forum.settings.composer_heading')} className="Settings-composer">
        {composerItems.toArray()}
      </FieldSet>
    );
  });
}
