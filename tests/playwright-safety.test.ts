import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertSafePlaywrightBaseUrl,
  isProductionPlaywrightBaseUrl,
  PLAYWRIGHT_TRACKING_RESOLVER_RULES,
} from '../playwright.config.ts';

test('identifies both production site hostnames regardless of protocol or port', () => {
  assert.equal(isProductionPlaywrightBaseUrl('https://www.anhanga.tur.br/'), true);
  assert.equal(isProductionPlaywrightBaseUrl('http://anhanga.tur.br:4173/'), true);
  assert.equal(isProductionPlaywrightBaseUrl('https://preview.anhanga.tur.br/'), false);
  assert.equal(isProductionPlaywrightBaseUrl('http://127.0.0.1:3100/'), false);
  assert.equal(isProductionPlaywrightBaseUrl('https://www.anhanga.tur.br.example/'), false);
});

test('refuses an E2E base URL that targets production', () => {
  assert.throws(
    () => assertSafePlaywrightBaseUrl('https://www.anhanga.tur.br/'),
    /Refusing to run Playwright tests against production/,
  );
  assert.doesNotThrow(() => assertSafePlaywrightBaseUrl('http://127.0.0.1:3100/'));
});

test('resolver rules block Traks and the configured third-party tracking hosts', () => {
  for (const host of [
    'analytics-collect.anhanga.tur.br',
    'load.sst.anhanga.tur.br',
    'sst.anhanga.tur.br',
    'mkt.anhanga.tur.br',
  ]) {
    assert.match(
      PLAYWRIGHT_TRACKING_RESOLVER_RULES,
      new RegExp(`MAP ${host.replaceAll('.', '\\.')}`),
      `tracking host ${host} must be blocked in E2E`,
    );
  }
});

test('invalid custom base URLs fail with an actionable error', () => {
  assert.throws(
    () => assertSafePlaywrightBaseUrl('not-a-url'),
    /PLAYWRIGHT_BASE_URL must be an absolute URL/,
  );
});