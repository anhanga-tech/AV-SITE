import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const requiredFallbackPatterns = [
  { label: 'title', pattern: /<title\b[^>]*data-av-head="title"[^>]*>[^<]+<\/title>/i },
  { label: 'meta description', pattern: /<meta\b[^>]*data-av-head="meta:description"[^>]*name="description"[^>]*content="[^"]+"/i },
  { label: 'canonical', pattern: /<link\b[^>]*data-av-head="link:canonical"[^>]*rel="canonical"[^>]*href="https:\/\/www\.anhanga\.tur\.br\/"/i },
  { label: 'og:title', pattern: /<meta\b[^>]*data-av-head="meta:og:title"[^>]*property="og:title"[^>]*content="[^"]+"/i },
  { label: 'og:description', pattern: /<meta\b[^>]*data-av-head="meta:og:description"[^>]*property="og:description"[^>]*content="[^"]+"/i },
  { label: 'og:image', pattern: /<meta\b[^>]*data-av-head="meta:og:image"[^>]*property="og:image"[^>]*content="https:\/\/www\.anhanga\.tur\.br\/og-image-1200x630\.jpg"/i },
  { label: 'og:type', pattern: /<meta\b[^>]*data-av-head="meta:og:type"[^>]*property="og:type"[^>]*content="website"/i },
  { label: 'og:url', pattern: /<meta\b[^>]*data-av-head="meta:og:url"[^>]*property="og:url"[^>]*content="https:\/\/www\.anhanga\.tur\.br\/"/i },
  { label: 'twitter:card', pattern: /<meta\b[^>]*data-av-head="meta:twitter:card"[^>]*name="twitter:card"[^>]*content="summary_large_image"/i },
  { label: 'twitter:title', pattern: /<meta\b[^>]*data-av-head="meta:twitter:title"[^>]*name="twitter:title"[^>]*content="[^"]+"/i },
  { label: 'twitter:description', pattern: /<meta\b[^>]*data-av-head="meta:twitter:description"[^>]*name="twitter:description"[^>]*content="[^"]+"/i },
  { label: 'twitter:image', pattern: /<meta\b[^>]*data-av-head="meta:twitter:image"[^>]*name="twitter:image"[^>]*content="https:\/\/www\.anhanga\.tur\.br\/og-image-1200x630\.jpg"/i }
];

for (const fallbackTag of requiredFallbackPatterns) {
  test(`index.html includes ${fallbackTag.label} fallback metadata`, () => {
    assert.match(indexHtml, fallbackTag.pattern);
  });
}
