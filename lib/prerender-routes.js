import { readdir } from 'node:fs/promises';
import { STATIC_SITEMAP_ENTRIES } from './site-routes.js';

export const BASE_PRERENDER_ROUTES = STATIC_SITEMAP_ENTRIES.map((entry) => entry.route);

async function getBlogPrerenderRoutes(blogDir) {
  const filenames = await readdir(blogDir);

  const postRoutes = filenames
    .filter((filename) => filename.endsWith('.mdx') && !filename.startsWith('_'))
    .sort()
    .map((filename) => `/blog/${filename.replace(/\.mdx$/, '')}`);

  return ['/blog', ...postRoutes];
}

export async function buildPrerenderRoutes(blogDir) {
  return Array.from(new Set([...BASE_PRERENDER_ROUTES, ...(await getBlogPrerenderRoutes(blogDir))]));
}
