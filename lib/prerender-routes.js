import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { STATIC_SITEMAP_ENTRIES } from './site-routes.js';
import { isFuturePost, shouldHideFuturePosts, todayInSaoPaulo } from './blog-schedule.js';

// Rota do 404 custom. Sai em `dist/404.html` (arquivo solto, não `dist/404/index.html`) —
// é esse nome que o Cloudflare Pages procura quando nenhum asset casa com a URL, e a
// presença dele é o que faz o Pages responder 404 de verdade em vez de cair no fallback
// de SPA (servir `index.html` com 200). Ver scripts/prerender.mjs#routeToOutputPath.
export const NOT_FOUND_ROUTE = '/404';

// Rotas que ganham HTML prerenderizado mas ficam fora do sitemap.
//
// `/links` é a página de bio: `noindex, follow` por natureza, então não deve ser anunciada
// à busca — mas é o destino do link do Instagram, onde pintar de imediato vale mais que em
// qualquer outra rota. Sem isso ela caía no fallback SPA e só aparecia depois do React montar.
//
// `/nps` é `noindex, nofollow` (página operacional, aberta por convite assinado). Entrou
// aqui junto com o 404 custom: com `dist/404.html` presente o Pages desliga o fallback de
// SPA, e toda rota que dependia dele passaria a responder 404 de verdade. A identidade do
// respondente continua vindo do token validado no servidor — o HTML estático é só a casca.
//
// `/404` é o próprio 404 custom (ver NOT_FOUND_ROUTE).
export const NOINDEX_PRERENDER_ROUTES = ['/links', '/nps', NOT_FOUND_ROUTE];

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
    // Mesma gramática de slug validada em lib/prerender-html.js e aceita por
    // pages/BlogPost.tsx (isValidSlug): arquivos fora dela não viram rota de
    // post nem exigem validação de corpo no HTML.
    .filter((filename) => /^[a-zA-Z0-9-]+\.mdx$/.test(filename))
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
