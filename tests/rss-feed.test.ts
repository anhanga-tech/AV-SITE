import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { renderRssFeed } from '../lib/rss.ts';

test('RSS feed renders a valid channel with one item per post', () => {
  const feed = renderRssFeed(BLOG_POST_MANIFEST);

  assert.ok(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(feed.includes('<rss version="2.0"'));
  assert.equal((feed.match(/<item>/g) ?? []).length, BLOG_POST_MANIFEST.length);

  for (const post of BLOG_POST_MANIFEST) {
    assert.ok(
      feed.includes(`<link>https://www.anhanga.tur.br/blog/${post.slug}/</link>`),
      `missing item link for ${post.slug}`
    );
  }
});

test('RSS feed escapes XML special characters in titles and excerpts', () => {
  const feed = renderRssFeed([
    {
      ...BLOG_POST_MANIFEST[0],
      title: 'Disney & Universal: <guia> "completo"',
      excerpt: "O'que saber & evitar",
    },
  ]);

  assert.ok(feed.includes('Disney &amp; Universal: &lt;guia&gt; &quot;completo&quot;'));
  assert.ok(!feed.includes('<guia>'));
});

test('generated public/feed.xml is in sync with the blog manifest', async () => {
  const feed = await readFile(new URL('../public/feed.xml', import.meta.url), 'utf8');
  assert.equal((feed.match(/<item>/g) ?? []).length, BLOG_POST_MANIFEST.length);
});
