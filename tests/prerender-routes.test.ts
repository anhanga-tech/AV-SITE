import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { BASE_PRERENDER_ROUTES, NOINDEX_PRERENDER_ROUTES, NOT_FOUND_ROUTE, buildPrerenderRoutes } from '../lib/prerender-routes.js';
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
    assert.ok(routes.includes('/nps'));
    assert.equal(routes.length, new Set(routes).size);
    assert.equal(routes.some((route) => route.includes('_template')), false);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('buildPrerenderRoutes ignora MDX com slug fora da gramática aceita', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'prerender-routes-'));

  try {
    await writeFile(path.join(blogDir, 'post-alpha.mdx'), '---\n---\n', 'utf8');
    await writeFile(path.join(blogDir, 'foo_bar.mdx'), '---\n---\n', 'utf8');
    await writeFile(path.join(blogDir, 'foo.bar.mdx'), '---\n---\n', 'utf8');

    const routes = await buildPrerenderRoutes(blogDir);

    assert.ok(routes.includes('/blog/post-alpha'));
    assert.equal(routes.some((route) => route.includes('foo_bar')), false);
    assert.equal(routes.some((route) => route.includes('foo.bar')), false);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('base prerender routes cover the indexable static sitemap routes', () => {
  assert.ok(BASE_PRERENDER_ROUTES.includes('/'));
  assert.ok(BASE_PRERENDER_ROUTES.includes('/blog'));
  assert.ok(BASE_PRERENDER_ROUTES.includes('/corporativo'));
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

// A presença de `dist/404.html` é o que faz o Cloudflare Pages responder 404 de verdade;
// sem ela o Pages trata o projeto como SPA e devolve a home com 200 para qualquer URL
// inexistente (soft 404: o crawler indexa lixo como duplicata da home). Remover a rota da
// lista reintroduz exatamente esse bug em silêncio — daí o teste.
test('/404 é prerenderizada e fica fora do sitemap', () => {
  assert.equal(NOT_FOUND_ROUTE, '/404');
  assert.ok(NOINDEX_PRERENDER_ROUTES.includes(NOT_FOUND_ROUTE));
  assert.ok(BASE_PRERENDER_ROUTES.includes(NOT_FOUND_ROUTE));
  assert.equal(STATIC_SITEMAP_ENTRIES.some((entry) => entry.route === NOT_FOUND_ROUTE), false);
});

// Contrapartida do 404 custom: com o fallback de SPA desligado, toda rota que o React
// atende por navegação direta precisa existir como asset prerenderizado OU ser resolvida na
// borda (_redirects / Pages Function). Uma rota que não esteja em nenhum dos dois passa a
// responder 404 de verdade — foi o caso de /nps, /old-blog e /viagens-para-executivos, que
// viviam só do fallback.
//
// Cobre as duas sintaxes de rota do App.tsx, porque as duas já produziram regressão:
// `path: '...'` dos arrays LANDING_PAGES/REDIRECT_ALIASES (que cresce a cada campanha) e
// `path="..."` do JSX do MainSiteShell — onde moram /old-blog e /old-blog/:slug, que NÃO
// estão no sitemap nem no prerender (são rotas de redirect, não indexáveis). Uma versão
// anterior deste guard só olhava a sintaxe de objeto e deixava /old-blog de fora: passava
// porque o _redirects tinha sido editado à mão, não porque o teste garantia.
//
// Rota com parâmetro (`/blog/:slug`) é validada pelo prefixo estático: vale se houver um
// splat na borda cobrindo o prefixo (`/old-blog/*`) ou ao menos uma rota concreta
// prerenderizada sob ele (os posts de `/blog/<slug>`). Os catch-alls (`*`, `/*`) ficam de
// fora: são o próprio 404.
test('toda rota de App.tsx é prerenderizada ou resolvida na borda', async () => {
  const [appSource, redirectsSource] = await Promise.all([
    readFile(path.join(process.cwd(), 'App.tsx'), 'utf8'),
    readFile(path.join(process.cwd(), 'public/_redirects'), 'utf8')
  ]);

  const semBarraFinal = (rota: string) => (rota === '/' ? '/' : rota.replace(/\/+$/, ''));

  // As duas sintaxes: `path: '/x'` (arrays) e `path="/x"` (JSX).
  const rotasDeclaradas = [
    ...Array.from(appSource.matchAll(/path:\s*'(\/[^']*)'/g), (m) => m[1]),
    ...Array.from(appSource.matchAll(/path="(\/[^"]*)"/g), (m) => m[1])
  ].filter((rota) => rota !== '/*');

  assert.ok(rotasDeclaradas.length > 0, 'nenhuma rota extraída de App.tsx — regex desatualizada?');
  for (const esperada of ['/old-blog', '/old-blog/:slug', '/nps', '/viagens-para-executivos']) {
    assert.ok(
      rotasDeclaradas.includes(esperada),
      `${esperada} não foi extraída de App.tsx — as regex pararam de casar a sintaxe dela`
    );
  }

  const linhasDeRedirect = redirectsSource
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha && !linha.startsWith('#'))
    .map((linha) => linha.split(/\s+/)[0]);

  const origensNaBorda = new Set(linhasDeRedirect.map(semBarraFinal));
  const prefixosDeSplat = linhasDeRedirect
    .filter((origem) => origem.endsWith('/*'))
    .map((origem) => origem.slice(0, -2));

  const prerenderizadas = new Set(BASE_PRERENDER_ROUTES.map(semBarraFinal));
  const rotasDeBlog = await buildPrerenderRoutes(path.join(process.cwd(), 'content/blog'));

  for (const rota of rotasDeclaradas) {
    const normalizada = semBarraFinal(rota);

    if (normalizada.includes('/:')) {
      const prefixo = semBarraFinal(normalizada.slice(0, normalizada.indexOf('/:')));
      const cobertaPorSplat = prefixosDeSplat.includes(prefixo);
      const temFilhaPrerenderizada = rotasDeBlog.some(
        (candidata) => semBarraFinal(candidata).startsWith(`${prefixo}/`)
      );
      assert.ok(
        cobertaPorSplat || temFilhaPrerenderizada,
        `${rota} é dinâmica e o prefixo ${prefixo} não tem splat na borda nem filha prerenderizada: responderia 404 em navegação direta`
      );
      continue;
    }

    assert.ok(
      prerenderizadas.has(normalizada) || origensNaBorda.has(normalizada),
      `${rota} não é prerenderizada nem redirecionada na borda: responderia 404 em navegação direta`
    );
  }
});
