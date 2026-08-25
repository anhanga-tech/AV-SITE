import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { STATIC_SITEMAP_ENTRIES } from './site-routes.js';
import { isFuturePost, shouldHideFuturePosts, todayInSaoPaulo } from './blog-schedule.js';

// Rotas que ganham HTML prerenderizado mas ficam fora do sitemap. `/links` é a página de
// bio: `noindex, follow` por natureza, então não deve ser anunciada à busca — mas é o
// destino do link do Instagram, onde pintar de imediato vale mais que em qualquer outra
// rota. Sem isso ela caía no fallback SPA e só aparecia depois do React montar.
export const NOINDEX_PRERENDER_ROUTES = ['/links'];

export const BASE_PRERENDER_ROUTES = [
  ...STATIC_SITEMAP_ENTRIES.map((entry) => entry.route),
  ...NOINDEX_PRERENDER_ROUTES
];

// O frontmatter dos posts usa sempre `date: "YYYY-MM-DD"` (formato garantido
// por tests/mdx-frontmatter.test.ts). O `^date:` ancorado não casa com
// `dateModified:`. Extração por regex evita depender de gray-matter neste
// módulo, que roda em JavaScript puro via `node scripts/prerender.mjs`.
const FRONTMATTER_DATE_PATTERN = /^date:\s*["']?(\d{4}-\d{2}-\d{2})/m;

async function getBlogPrerenderRoutes(
  blogDir,
  { hideFuture = shouldHideFuturePosts(), today = todayInSaoPaulo() } = {}
) {
  const filenames = (await readdir(blogDir))
    .filter((filename) => filename.endsWith('.mdx') && !filename.startsWith('_'))
    .sort();

  // Sem o mesmo filtro do manifest (lib/blog-manifest.ts), o prerender
  // renderizaria uma página NotFound na rota do post futuro.
  const postRoutes = await Promise.all(
    filenames.map(async (filename) => {
      if (hideFuture) {
        const rawContent = await readFile(path.join(blogDir, filename), 'utf8');
        const date = rawContent.match(FRONTMATTER_DATE_PATTERN)?.[1];
        if (isFuturePost(date, today)) return null;
      }
      return `/blog/${filename.replace(/\.mdx$/, '')}`;
    })
  );

  return ['/blog', ...postRoutes.flatMap((route) => (route === null ? [] : [route]))];
}

export async function buildPrerenderRoutes(blogDir, options = {}) {
  return Array.from(
    new Set([...BASE_PRERENDER_ROUTES, ...(await getBlogPrerenderRoutes(blogDir, options))])
  );
}
