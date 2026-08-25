import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { BASE_PRERENDER_ROUTES, NOINDEX_PRERENDER_ROUTES, buildPrerenderRoutes } from '../lib/prerender-routes.js';
import { STATIC_SITEMAP_ENTRIES } from '../lib/site-routes.js';

test('buildPrerenderRoutes includes blog index and blog post routes from MDX files', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'prerender-routes-'));

  try {
    await writeFile(path.join(blogDir, '_template.mdx'), '---\n---\n', 'utf8');
    await writeFile(path.join(blogDir, 'post-alpha.mdx'), '---\n---\n', 'utf8');
    await writeFile(path.join(blogDir, 'post-beta.mdx'), '---\n---\n', 'utf8');

    const routes = await buildPrerenderRoutes(blogDir);

    assert.ok(routes.includes('/blog'));
    assert.ok(routes.includes('/consultoria-de-viagem'));
    assert.ok(routes.includes('/cruzeiros'));
    assert.ok(routes.includes('/quiz'));
    assert.ok(routes.includes('/blog/post-alpha'));
    assert.ok(routes.includes('/blog/post-beta'));
    assert.equal(routes.includes('/nps'), false);
    assert.equal(routes.length, new Set(routes).size);
    assert.equal(routes.some((route) => route.includes('_template')), false);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('base prerender routes cover the indexable static sitemap routes', () => {
  assert.ok(BASE_PRERENDER_ROUTES.includes('/'));
  assert.ok(BASE_PRERENDER_ROUTES.includes('/blog'));
  assert.ok(BASE_PRERENDER_ROUTES.includes('/corporativo'));
  assert.equal(BASE_PRERENDER_ROUTES.includes('/nps'), false);
});

// /links é prerenderizada para pintar de imediato (é o destino do link da bio), mas é
// `noindex, follow` por natureza e não pode ser anunciada à busca. As duas metades desse
// invariante precisam falhar no CI: sem isso, remover a rota de NOINDEX_PRERENDER_ROUTES
// (voltando ao fallback SPA) ou adicioná-la ao sitemap passariam despercebidos.
test('/links entra no prerender mas fica fora do sitemap', () => {
  assert.ok(NOINDEX_PRERENDER_ROUTES.includes('/links'));
  assert.ok(BASE_PRERENDER_ROUTES.includes('/links'));
  assert.equal(STATIC_SITEMAP_ENTRIES.some((entry) => entry.route === '/links'), false);
});

test('toda rota noindex do prerender fica fora do sitemap', () => {
  const rotasDoSitemap = new Set(STATIC_SITEMAP_ENTRIES.map((entry) => entry.route));
  for (const rota of NOINDEX_PRERENDER_ROUTES) {
    assert.equal(rotasDoSitemap.has(rota), false, `${rota} é noindex mas está no sitemap`);
    assert.ok(BASE_PRERENDER_ROUTES.includes(rota), `${rota} é noindex mas não é prerenderizada`);
  }
});
