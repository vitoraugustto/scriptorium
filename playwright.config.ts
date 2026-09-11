import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 30_000,
  workers: 1,
  reporter: isCI ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list',
  use: {
    headless: false,
    screenshot: 'on',
    video: 'off',
  },
  outputDir: 'test-results',
});
