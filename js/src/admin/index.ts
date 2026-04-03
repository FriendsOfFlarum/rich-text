import app from 'flarum/admin/app';
import applyEditor from '../common/applyEditor';

export { default as extend } from './extend';

app.initializers.add('fof/rich-text', () => {
  applyEditor();
});
