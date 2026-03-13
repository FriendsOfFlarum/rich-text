import applyEditor from '../common/applyEditor';

app.initializers.add('fof/rich-text', () => {
  applyEditor();
  app.registry.for('fof-rich-text').registerSetting({
    setting: 'fof-rich-text.toggle_on_editor',
    type: 'boolean',
    label: app.translator.trans('fof-rich-text.admin.settings.toggle_on_editor'),
  });
  app.registry.for('fof-rich-text').registerSetting({
    setting: 'fof-rich-text.force_compact_paragraphs',
    type: 'boolean',
    label: app.translator.trans('fof-rich-text.admin.settings.force_compact_paragraphs'),
  });
});

export * from '../common/index';
