import applyEditor from '../common/applyEditor';
import addPreferences from './addPreferences';

app.initializers.add('fof/rich-text', () => {
  addPreferences();
  applyEditor();
});

export * from '../common/index';
