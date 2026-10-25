import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { transformWithEsbuild } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'flarum-core-jsx',
      enforce: 'pre',
      transform(code, id) {
        if (id.includes('/vendor/flarum/core/js/src/') && id.endsWith('.js')) {
          return transformWithEsbuild(code, id, { loader: 'jsx', jsxFactory: 'm', jsxFragment: 'm.Fragment', tsconfigRaw: '{}' });
        }
      },
    },
  ],
  esbuild: {
    jsxFactory: 'm',
    jsxFragment: 'm.Fragment',
    // Core's source lives outside js/ and cannot resolve this extension's tsconfig dependencies.
    tsconfigRaw: '{}',
  },
  resolve: {
    dedupe: ['mithril', 'jquery', 'clsx', 'textarea-caret'],
    alias: {
      flarum: fileURLToPath(new URL('../vendor/flarum/core/js/src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
