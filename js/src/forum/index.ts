import app from 'flarum/forum/app';
import applyEditor from '../common/applyEditor';
import addPreferences from './addPreferences';

app.initializers.add('fof-rich-text', () => {
  addPreferences();
  applyEditor();
});
