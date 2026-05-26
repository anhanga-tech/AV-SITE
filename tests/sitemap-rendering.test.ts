import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeXml, renderSitemapEntry } from '../lib/sitemap.ts';

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
