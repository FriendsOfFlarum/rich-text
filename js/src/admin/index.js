import applyEditor from '../common/applyEditor';

app.initializers.add('fof/rich-text', () => {
  applyEditor();
  app.extensionData.for('fof-rich-text').registerSetting({
    setting: 'fof-rich-text.toggle_on_editor',
    type: 'boolean',
    label: app.translator.trans('fof-rich-text.admin.settings.toggle_on_editor'),
  });
});

export * from '../common/index';
