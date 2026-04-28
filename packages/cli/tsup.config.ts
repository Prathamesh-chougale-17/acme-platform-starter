import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: false,
  clean: true,
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  bundle: true,
  external: ['@clack/prompts'],
  banner: { js: '#!/usr/bin/env node' },
  outExtension: () => ({ js: '.mjs' }),
});
