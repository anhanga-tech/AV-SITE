const SITE_ORIGIN = 'https://www.anhanga.tur.br';

// Prefixo da página de autor. Duplicado em lib/site-routes.js (JavaScript puro, lido pelo
// prerender e pelo gerador do sitemap); tests/author-page.test.ts trava as duas listas
// contra as chaves de AUTHORS para que não divirjam.
export const AUTHOR_ROUTE_PREFIX = '/autor';

// Trailing slash obrigatório: mesma regra de getBlogPostUrl — o Cloudflare Pages responde
// 308 para a versão sem barra.
export const getAuthorPath = (authorId: string): string => `${AUTHOR_ROUTE_PREFIX}/${authorId}/`;

export const getAuthorUrl = (authorId: string): string => `${SITE_ORIGIN}${getAuthorPath(authorId)}`;

// @id do nó Person no grafo JSON-LD. É o mesmo no post, na página do autor e na /sobre, então
// os três descrevem a mesma entidade. O fragmento mantém o @id distinto do `url` da página.
export const getAuthorEntityId = (authorId: string): string => `${getAuthorUrl(authorId)}#person`;
