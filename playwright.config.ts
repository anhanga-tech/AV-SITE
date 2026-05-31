import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const PLAYWRIGHT_PORT = Number(process.env.PLAYWRIGHT_PORT ?? '3100');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${PLAYWRIGHT_HOST}:${PLAYWRIGHT_PORT}`;
const WEB_SERVER_COMMAND = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
  ?? `VITE_DEV_HOST=${PLAYWRIGHT_HOST} VITE_DEV_PORT=${PLAYWRIGHT_PORT} VITE_DEV_STRICT_PORT=true pnpm dev`;

export default defineConfig({
  testDir: './tests/e2e',
  // Disable fullyParallel as it seems to cause resource contention and timeouts in some environments
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Block third-party tracking during tests — prevents test data from polluting production CRMs
    launchOptions: {
      args: [
        '--host-resolver-rules='
        + 'MAP mkt.anhanga.tur.br ~NOTFOUND, '
        + 'MAP *.hubspot.com ~NOTFOUND, '
        + 'MAP *.hsforms.com ~NOTFOUND, '
        + 'MAP *.hsforms.net ~NOTFOUND, '
        + 'MAP *.hscollectedforms.net ~NOTFOUND, '
        + 'MAP *.hs-scripts.com ~NOTFOUND, '
        + 'MAP *.hs-analytics.net ~NOTFOUND, '
        + 'MAP *.hs-banner.com ~NOTFOUND, '
        + 'MAP *.usemessages.com ~NOTFOUND',
      ],
    },
  },

  // In CI run only Chromium + Mobile Chrome to keep the pipeline fast.
  // Full cross-browser coverage runs locally or on-demand.
  projects: process.env.CI
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
        { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
      ],

  webServer: {
    command: WEB_SERVER_COMMAND,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
