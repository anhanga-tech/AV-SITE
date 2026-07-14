import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { STATIC_SITEMAP_ENTRIES } from './site-routes.js';
import { isFuturePost, shouldHideFuturePosts, todayInSaoPaulo } from './blog-schedule.js';

export const BASE_PRERENDER_ROUTES = STATIC_SITEMAP_ENTRIES.map((entry) => entry.route);

// O frontmatter dos posts usa sempre `date: "YYYY-MM-DD"` (formato garantido
// por tests/mdx-frontmatter.test.ts). O `^date:` ancorado não casa com
// `dateModified:`. Extração por regex evita depender de gray-matter neste
// módulo, que roda em JavaScript puro via `node scripts/prerender.mjs`.
const FRONTMATTER_DATE_PATTERN = /^date:\s*["']?(\d{4}-\d{2}-\d{2})/m;

async function getBlogPrerenderRoutes(blogDir) {
  const filenames = await readdir(blogDir);
  const hideFuture = shouldHideFuturePosts();
  const today = todayInSaoPaulo();

  const postRoutes = [];
  for (const filename of filenames.sort()) {
    if (!filename.endsWith('.mdx') || filename.startsWith('_')) continue;

    // Sem o mesmo filtro do manifest (lib/blog-manifest.ts), o prerender
    // renderizaria uma página NotFound na rota do post futuro.
    if (hideFuture) {
      const rawContent = await readFile(path.join(blogDir, filename), 'utf8');
      const date = rawContent.match(FRONTMATTER_DATE_PATTERN)?.[1];
      if (isFuturePost(date, today)) continue;
    }

    postRoutes.push(`/blog/${filename.replace(/\.mdx$/, '')}`);
  }

  return ['/blog', ...postRoutes];
}

export async function buildPrerenderRoutes(blogDir) {
  return Array.from(new Set([...BASE_PRERENDER_ROUTES, ...(await getBlogPrerenderRoutes(blogDir))]));
}
