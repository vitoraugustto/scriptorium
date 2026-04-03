import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/renderer/js/ui/**', 'jsdom'],
      ['src/renderer/js/debug.test.ts', 'jsdom'],
      ['src/renderer/js/main.test.ts', 'jsdom'],
      ['src/renderer/js/i18n/index.test.ts', 'jsdom'],
    ],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/renderer/js/**'],
      exclude: ['src/renderer/js/app.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 75,
      },
    },
  },
});
