import { defineConfig } from '@playwright/test';
import baseConfig, { BASE_URL, PLAYWRIGHT_HOST, PLAYWRIGHT_PORT } from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testMatch: ['**/blog-mdx-loading.spec.ts', '**/hero-media.spec.ts'],
  testIgnore: [],
  outputDir: 'test-results/prerender',
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report/prerender' }]]
    : 'list',
  webServer: {
    command: `pnpm preview --host ${PLAYWRIGHT_HOST} --port ${PLAYWRIGHT_PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
