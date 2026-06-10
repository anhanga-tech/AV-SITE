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
