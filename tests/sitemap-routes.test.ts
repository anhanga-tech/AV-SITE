import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { NOINDEX_ROUTES, STATIC_SITEMAP_ENTRIES, routeToCanonicalUrl } from '../lib/site-routes.js';

function collectSitemapLocs(source: string): Set<string> {
  return new Set(Array.from(source.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1]));
}

test('sitemap includes every indexable static route and blog post', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const locs = collectSitemapLocs(sitemap);

  for (const entry of STATIC_SITEMAP_ENTRIES) {
    if (entry.noindex) continue;
    assert.ok(locs.has(routeToCanonicalUrl(entry.route)), `missing static route ${entry.route}`);
  }

  for (const post of BLOG_POST_MANIFEST) {
    const canonical = routeToCanonicalUrl(`/blog/${post.slug}`);
    assert.ok(locs.has(canonical), `missing blog post ${post.slug}`);
  }
});

test('sitemap excludes operational noindex routes', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const locs = collectSitemapLocs(sitemap);

  for (const route of NOINDEX_ROUTES) {
    assert.equal(locs.has(routeToCanonicalUrl(route)), false);
  }
});

// Issue #1981: lastmod estático é mantido à mão (ver política em lib/site-routes.js).
// Garante formato ISO e que nenhuma data fica no futuro, o que sinalizaria freshness falsa.
test('static sitemap lastmod values are ISO dates not in the future', () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const entry of STATIC_SITEMAP_ENTRIES) {
    assert.match(entry.lastmod, /^\d{4}-\d{2}-\d{2}$/, `${entry.route} lastmod format`);
    assert.ok(!Number.isNaN(Date.parse(entry.lastmod)), `${entry.route} lastmod is not a real date`);
    assert.ok(entry.lastmod <= today, `${entry.route} lastmod ${entry.lastmod} is in the future`);
  }
});

test('regenerated sitemap carries the static lastmod from site-routes', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  for (const entry of STATIC_SITEMAP_ENTRIES) {
    if (entry.noindex) continue;
    const loc = routeToCanonicalUrl(entry.route);
    const block = sitemap.split('<url>').find((chunk) => chunk.includes(`<loc>${loc}</loc>`));
    assert.ok(block, `missing ${loc}`);
    assert.match(block, new RegExp(`<lastmod>${entry.lastmod}</lastmod>`), `${entry.route} lastmod out of sync`);
  }
});
