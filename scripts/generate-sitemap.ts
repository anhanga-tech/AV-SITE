import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { STATIC_SITEMAP_ENTRIES, routeToCanonicalUrl } from '../lib/site-routes.js';

interface SitemapImage {
  loc: string;
  caption: string;
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  images?: SitemapImage[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, '../public/sitemap.xml');

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function renderEntry(entry: SitemapEntry): string {
  const images = entry.images ?? [];
  const imageXml = images
    .map((image) => [
      '    <image:image>',
      `      <image:loc>${escapeXml(image.loc)}</image:loc>`,
      `      <image:caption>${escapeXml(image.caption)}</image:caption>`,
      '    </image:image>'
    ].join('\n'))
    .join('\n');

  return [
    '  <url>',
    `    <loc>${escapeXml(entry.loc)}</loc>`,
    `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
    `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
    `    <priority>${escapeXml(entry.priority)}</priority>`,
    imageXml,
    '  </url>'
  ].filter(Boolean).join('\n');
}

const staticEntries: SitemapEntry[] = STATIC_SITEMAP_ENTRIES.map((entry) => ({
  loc: routeToCanonicalUrl(entry.route),
  lastmod: entry.lastmod,
  changefreq: entry.changefreq,
  priority: entry.priority,
  images: entry.images
}));

const blogEntries: SitemapEntry[] = BLOG_POST_MANIFEST.map((post) => ({
  loc: routeToCanonicalUrl(`/blog/${post.slug}`),
  lastmod: post.dateModified ?? post.date,
  changefreq: 'monthly',
  priority: post.featured ? '0.8' : '0.7',
  images: post.image
    ? [
        {
          loc: post.image,
          caption: post.title
        }
      ]
    : undefined
}));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...[...staticEntries, ...blogEntries].map(renderEntry),
  '</urlset>',
  ''
].join('\n');

await writeFile(OUTPUT_PATH, sitemap, 'utf8');
console.log(`Generated sitemap with ${staticEntries.length + blogEntries.length} URLs at ${OUTPUT_PATH}`);
