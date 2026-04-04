import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    exclude: ['**/node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/renderer/js/**'],
      exclude: [
        'src/renderer/js/app.ts',
        'src/renderer/js/ui/index.ts',
        'src/renderer/js/config/index.ts',
        'src/renderer/js/i18n/en.ts',
        'src/renderer/js/i18n/pt-BR.ts',
        'src/renderer/js/types/**',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 75,
      },
    },
  },
});
