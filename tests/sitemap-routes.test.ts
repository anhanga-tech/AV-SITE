import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { NOINDEX_ROUTES, STATIC_SITEMAP_ENTRIES, routeToCanonicalUrl } from '../lib/site-routes.js';
import { todayInSaoPaulo } from '../lib/blog-schedule.js';
import { latestPublishedPostDate, publishedPosts } from '../lib/sitemap.ts';
import { isFuturePost } from '../lib/blog-schedule.js';

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

  for (const post of publishedPosts(BLOG_POST_MANIFEST, todayInSaoPaulo())) {
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
    if (entry.lastmodFromBlog) continue; // /blog: derivado do manifest (#2039)
    const { lastmod } = entry;
    if (!lastmod) {
      assert.fail(`${entry.route} has no lastmod`);
    }
    assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, `${entry.route} lastmod format`);
    assert.ok(!Number.isNaN(Date.parse(lastmod)), `${entry.route} lastmod is not a real date`);
    assert.ok(lastmod <= today, `${entry.route} lastmod ${lastmod} is in the future`);
  }
});

test('regenerated sitemap carries the static lastmod from site-routes', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  for (const entry of STATIC_SITEMAP_ENTRIES) {
    if (entry.noindex) continue;
    const loc = routeToCanonicalUrl(entry.route);
    const block = sitemap.split('<url>').find((chunk) => chunk.includes(`<loc>${loc}</loc>`));
    assert.ok(block, `missing ${loc}`);
    const expected = entry.lastmodFromBlog
      ? latestPublishedPostDate(BLOG_POST_MANIFEST, todayInSaoPaulo())
      : entry.lastmod;
    assert.match(block, new RegExp(`<lastmod>${expected}</lastmod>`), `${entry.route} lastmod out of sync`);
  }
});

// Issue #2039: /blog não tem data à mão; deriva do manifest e nunca fica no futuro.
test('/blog lastmod is derived from the blog manifest, not a literal', async () => {
  const blog = STATIC_SITEMAP_ENTRIES.find((entry) => entry.route === '/blog');
  assert.ok(blog, '/blog missing from STATIC_SITEMAP_ENTRIES');
  assert.equal(blog.lastmodFromBlog, true);
  assert.equal('lastmod' in blog, false, '/blog should not carry a hand-written lastmod');

  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const block = sitemap.split('<url>').find((chunk) => chunk.includes(`<loc>${routeToCanonicalUrl('/blog')}</loc>`));
  const lastmod = block?.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
  assert.ok(lastmod, '/blog has no lastmod in sitemap.xml');
  assert.ok(lastmod <= todayInSaoPaulo(), `/blog lastmod ${lastmod} is in the future`);
});

// Issue #2041 (opção A): o sitemap gerado, em qualquer ambiente, não anuncia post agendado
// nem carrega lastmod depois do dia da geração.
test('sitemap omits scheduled blog posts', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const locs = collectSitemapLocs(sitemap);
  const today = todayInSaoPaulo();
  for (const post of BLOG_POST_MANIFEST) {
    if (!isFuturePost(post.date, today)) continue;
    assert.equal(locs.has(routeToCanonicalUrl(`/blog/${post.slug}`)), false, `scheduled post ${post.slug} is in the sitemap`);
  }
});

test('no sitemap lastmod is after the generation day', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const today = todayInSaoPaulo();
  for (const [, lastmod] of sitemap.matchAll(/<lastmod>(.*?)<\/lastmod>/g)) {
    assert.ok(lastmod <= today, `lastmod ${lastmod} is in the future`);
  }
});
