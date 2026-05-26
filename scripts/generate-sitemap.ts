import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { STATIC_SITEMAP_ENTRIES, routeToCanonicalUrl } from '../lib/site-routes.js';
import { renderSitemap, type SitemapEntry } from '../lib/sitemap.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, '../public/sitemap.xml');

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

const sitemap = renderSitemap([...staticEntries, ...blogEntries]);

await writeFile(OUTPUT_PATH, sitemap, 'utf8');
console.log(`Generated sitemap with ${staticEntries.length + blogEntries.length} URLs at ${OUTPUT_PATH}`);
