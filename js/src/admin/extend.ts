import app from 'flarum/admin/app';
import Extend from 'flarum/common/extenders';

export default [
  new Extend.Admin() //
    .setting(() => ({
      setting: 'fof-rich-text.toggle_on_editor',
      type: 'boolean',
      label: app.translator.trans('fof-rich-text.admin.settings.toggle_on_editor'),
    }))
    .setting(() => ({
      setting: 'fof-rich-text.force_compact_paragraphs',
      type: 'boolean',
      label: app.translator.trans('fof-rich-text.admin.settings.force_compact_paragraphs'),
    })),
];
