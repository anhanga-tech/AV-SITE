import test from 'node:test';
import assert from 'node:assert/strict';

import { BUILD_DATE_ENV, resolveBuildDate } from '../lib/build-date.js';

// Regressão (chatgpt-codex-connector[bot] review, PR #1832): o build SSR do prerender roda em
// outro processo e precisa herdar a data do build do cliente, mesmo que já tenha virado o dia.
test('a data herdada do build do cliente prevalece sobre o relógio', () => {
  const aposMeiaNoite = new Date('2026-10-30T03:30:00Z'); // 00:30 em São Paulo
  assert.equal(resolveBuildDate({ [BUILD_DATE_ENV]: '2026-10-29' }, aposMeiaNoite), '2026-10-29');
});

test('sem data herdada, usa hoje no fuso de São Paulo', () => {
  assert.equal(resolveBuildDate({}, new Date('2026-10-30T02:30:00Z')), '2026-10-29');
  assert.equal(resolveBuildDate({}, new Date('2026-10-30T03:30:00Z')), '2026-10-30');
});

test('data herdada malformada é ignorada', () => {
  const now = new Date('2026-10-12T15:00:00Z');
  assert.equal(resolveBuildDate({ [BUILD_DATE_ENV]: '29/10/2026' }, now), '2026-10-12');
  assert.equal(resolveBuildDate({ [BUILD_DATE_ENV]: '  ' }, now), '2026-10-12');
});
