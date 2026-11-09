import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeXml, latestPublishedPostDate, renderSitemapEntry } from '../lib/sitemap.ts';

test('escapeXml tolerates optional metadata values', () => {
  assert.equal(escapeXml(undefined), '');
  assert.equal(escapeXml(null), '');
  assert.equal(escapeXml('Roteiros & viagens "premium"'), 'Roteiros &amp; viagens &quot;premium&quot;');
});

test('renderSitemapEntry omits optional lastmod and image caption when absent', () => {
  const xml = renderSitemapEntry({
    loc: 'https://www.anhanga.tur.br/sem-data/',
    changefreq: 'monthly',
    priority: '0.5',
    images: [{ loc: 'https://media.anhanga.tur.br/images/sem-caption.jpg' }]
  });

  assert.match(xml, /<loc>https:\/\/www\.anhanga\.tur\.br\/sem-data\/<\/loc>/);
  assert.doesNotMatch(xml, /<lastmod>/);
  assert.match(xml, /<image:loc>https:\/\/media\.anhanga\.tur\.br\/images\/sem-caption\.jpg<\/image:loc>/);
  assert.doesNotMatch(xml, /<image:caption>/);
});

test('renderSitemapEntry fails fast when required loc values are missing', () => {
  assert.throws(
    () => renderSitemapEntry({ loc: '', changefreq: 'monthly', priority: '0.5' }),
    /Missing required sitemap field: loc/,
  );

  assert.throws(
    () => renderSitemapEntry({ loc: 'https://www.anhanga.tur.br/', images: [{ loc: '' }] }),
    /Missing required sitemap field: image\.loc/,
  );
});

// Issue #2039: o lastmod do /blog acompanha o post publicado mais recente.
test('latestPublishedPostDate picks the newest dateModified ?? date', () => {
  const posts = [
    { date: '2026-08-01' },
    { date: '2026-09-01', dateModified: '2026-10-15' },
    { date: '2026-10-01' }
  ];
  assert.equal(latestPublishedPostDate(posts, '2026-11-09'), '2026-10-15');
});

test('latestPublishedPostDate ignores scheduled posts with a future date', () => {
  const posts = [
    { date: '2026-11-01' },
    { date: '2026-11-11', dateModified: '2026-11-11' }
  ];
  assert.equal(latestPublishedPostDate(posts, '2026-11-09'), '2026-11-01');
});

test('latestPublishedPostDate never returns a date after today', () => {
  const posts = [{ date: '2026-11-01', dateModified: '2026-12-01' }];
  assert.equal(latestPublishedPostDate(posts, '2026-11-09'), '2026-11-09');
});

test('latestPublishedPostDate returns undefined when nothing is published', () => {
  assert.equal(latestPublishedPostDate([], '2026-11-09'), undefined);
  assert.equal(latestPublishedPostDate([{ date: '2026-12-01' }], '2026-11-09'), undefined);
});
