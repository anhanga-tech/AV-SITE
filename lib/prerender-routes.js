import { readdir } from 'node:fs/promises';

export const BASE_PRERENDER_ROUTES = [
  '/',
  '/orlando',
  '/beto-carrero',
  '/lollapalooza',
  '/sobre',
  '/melhor-idade',
  '/brazil-promotion-day',
  '/mapa-do-site',
  '/termos-de-uso',
  '/politica-privacidade',
];

export async function getBlogPrerenderRoutes(blogDir) {
  const filenames = await readdir(blogDir);

  const postRoutes = filenames
    .filter((filename) => filename.endsWith('.mdx') && !filename.startsWith('_'))
    .sort()
    .map((filename) => `/blog/${filename.replace(/\.mdx$/, '')}`);

  return ['/blog', ...postRoutes];
}

export async function buildPrerenderRoutes(blogDir) {
  return [...BASE_PRERENDER_ROUTES, ...(await getBlogPrerenderRoutes(blogDir))];
}
