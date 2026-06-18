export { Node, Mark, Extension } from '@tiptap/core';
export { ListItem } from '@tiptap/extension-list';

// ProseMirror primitives re-exported so third-party extensions can build state
// plugins and decorations against the SAME ProseMirror instance the editor
// uses. Importing these from a separately-bundled copy of @tiptap/pm would
// create a second ProseMirror instance, and plugins/decorations from a
// different instance are silently ignored by the editor.
export { Plugin, PluginKey } from '@tiptap/pm/state';
export { Decoration, DecorationSet } from '@tiptap/pm/view';
