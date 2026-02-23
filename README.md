# FoF Rich Text

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/fof/rich-text.svg)](https://packagist.org/packages/fof/rich-text) [![Total Downloads](https://img.shields.io/packagist/dt/fof/rich-text.svg)](https://packagist.org/packages/fof/rich-text) [![OpenCollective](https://img.shields.io/badge/opencollective-fof-blue.svg)](https://opencollective.com/fof/donate)

A [Flarum](http://flarum.org) extension. Fully integrated WYSIWYG Rich Text Editor for Flarum, powered by [Tiptap](https://tiptap.dev/) (built on [ProseMirror](https://prosemirror.net/)).

![Screenshot](https://i.ibb.co/tMSj6Dmh/image.png)

## Installation

```sh
composer require fof/rich-text:*
```

## Updating

```sh
composer update fof/rich-text
```

## FAQ

### What does it support?

By default, everything from the [s9e/TextFormatter Litedown syntax](https://s9etextformatter.readthedocs.io/Plugins/Litedown/Syntax/) except indented code blocks and underlined headers. The tables and checklists extensions add support for [PipeTables](https://s9etextformatter.readthedocs.io/Plugins/PipeTables/Syntax/) and [TaskLists](https://s9etextformatter.readthedocs.io/Plugins/TaskLists/Synopsis/).

BBCodes are not WYSIWYG'd, but their syntax characters won't be escaped so you can still use them.

Custom syntax supported out of the box:

- **Spoiler blocks** — `>! text`
- **Inline spoilers** — `||text||`
- **Math blocks** — `$$ ... $$`
- **Inline math** — `$text$`
- **Subscript** — `~text~`
- **Superscript** — `^text^`

### Does it work with mentions, emoji, and fof/upload?

Yes. The extension implements Flarum's `EditorDriverInterface` and is fully compatible with `flarum/mentions`, `flarum/emoji`, and `fof/upload`.

### Can users opt out?

Yes. Users can disable the rich text editor from their settings page. You can also enable the **Toggle Button** setting in the admin dashboard to show a toggle button directly inside the composer.

### What about bundle size?

Version 2.x ships the editor as a **lazy-loaded async chunk**. The Tiptap editor code (~520 KB minified, ~150 KB gzipped) is only downloaded when a user opens the composer. The main forum bundle contributed by this extension is under 13 KB.

This is a significant improvement over 1.x, where ~350 KB was added to every page load.

### Is it extensible?

Yes. The extension exposes two main extension points for third-party developers:

**Add toolbar buttons:**
```js
import { extend } from 'flarum/common/extend';

extend(fof.richText.components.TiptapMenu.prototype, 'items', function (items) {
  items.add('myButton', MyButton.component({ editor: this.attrs.editor }), 10);
});
```

**Add Tiptap extensions to the editor:**
```js
import { extend } from 'flarum/common/extend';

extend(fof.richText.tiptap.TiptapEditorDriver.prototype, 'buildExtensions', function (items) {
  items.add('myExtension', MyTiptapExtension);
});
```

### What's it built on?

Version 2.x is built on [Tiptap 3](https://tiptap.dev/) (which runs [ProseMirror](https://prosemirror.net/) underneath). The markdown serialization layer uses a custom `prosemirror-markdown`-based parser and serializer, ensuring faithful roundtrip compatibility with s9e/TextFormatter's output.

### Is it a bundled extension?

No. This extension is published and maintained by the [Friends of Flarum](https://friendsofflarum.org) community.

## Links

- [Packagist](https://packagist.org/packages/fof/rich-text)
- [GitHub](https://github.com/FriendsOfFlarum/rich-text)
- [OpenCollective](https://opencollective.com/fof/donate)
- [Discuss](https://discuss.flarum.org/d/21335-friendsofflarum-rich-text)
