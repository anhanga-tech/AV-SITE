import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { AUTHORS } from '../data/blogData.ts';
import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { BASE_PRERENDER_ROUTES } from '../lib/prerender-routes.js';
import { STATIC_SITEMAP_ENTRIES, routeToCanonicalUrl } from '../lib/site-routes.js';
import { getAuthorEntityId, getAuthorPath, getAuthorUrl } from '../utils/author.ts';
import { render } from '../ssr.tsx';

// Cada autor de AUTHORS tem uma URL estável (/autor/<id>/): HTML prerenderizado, entrada no
// sitemap e página com nome, função, bio, redes e a lista dos posts dele.

type Node = Record<string, unknown>;

const parseJsonLd = (headHtml: string): Node[] =>
  [...headHtml.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]) as Node);

const hasType = (node: Node, type: string) => ([] as unknown[]).concat(node['@type']).includes(type);

// O React escapa aspas/apóstrofos no HTML; compara texto já decodificado.
const decode = (html: string) =>
  html.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

const authorIds = Object.keys(AUTHORS);

test('helpers de URL do autor usam a barra final canônica', () => {
  assert.equal(getAuthorPath('felipe-william'), '/autor/felipe-william/');
  assert.equal(getAuthorUrl('felipe-william'), 'https://www.anhanga.tur.br/autor/felipe-william/');
  assert.equal(getAuthorEntityId('felipe-william'), 'https://www.anhanga.tur.br/autor/felipe-william/#person');
});

test('toda chave de AUTHORS tem rota no sitemap e no prerender (e vice-versa)', () => {
  const authorRoutes = STATIC_SITEMAP_ENTRIES
    .map((entry) => entry.route)
    .filter((route) => route.startsWith('/autor/'))
    .sort();
  assert.deepEqual(authorRoutes, authorIds.map((id) => `/autor/${id}`).sort());

  for (const route of authorRoutes) {
    assert.ok(BASE_PRERENDER_ROUTES.includes(route), `${route} fora do prerender`);
  }
});

test('public/sitemap.xml lista as páginas de autor com barra final', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  for (const id of authorIds) {
    assert.ok(
      sitemap.includes(`<loc>${routeToCanonicalUrl(`/autor/${id}`)}</loc>`),
      `sitemap sem /autor/${id}/`
    );
  }
});

for (const id of authorIds) {
  const author = AUTHORS[id];

  test(`/autor/${id}/ renderiza nome, função, bio, redes, link para /sobre/ e os posts do autor`, async () => {
    const { appHtml: shellHtml, headHtml } = await render(`/autor/${id}/`);
    // Header/Footer também linkam /sobre/; as asserções valem para o conteúdo da página.
    const appHtml = shellHtml.match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
    assert.ok(appHtml.length > 0, 'sem <main> no HTML renderizado');
    const text = decode(appHtml);

    assert.match(appHtml, new RegExp(`<h1[^>]*>${author.name}</h1>`), 'h1 com o nome');
    assert.ok(text.includes(author.role), 'função');
    assert.ok(text.includes(author.bio), 'bio já cadastrada, sem texto novo');
    assert.ok(appHtml.includes(`href="${author.social?.instagram}"`), 'Instagram');
    assert.ok(appHtml.includes(`href="${author.social?.linkedin}"`), 'LinkedIn');
    assert.ok(appHtml.includes('href="/sobre/"'), 'link para a agência em /sobre/');

    const posts = BLOG_POST_MANIFEST.filter((post) => post.author === id);
    assert.ok(posts.length > 0, 'fixture: o autor tem posts');
    for (const post of posts) {
      assert.ok(appHtml.includes(`href="/blog/${post.slug}/"`), `post ${post.slug} sem link canônico`);
    }
    // Só posts deste autor.
    for (const post of BLOG_POST_MANIFEST.filter((p) => p.author !== id)) {
      assert.ok(!appHtml.includes(`href="/blog/${post.slug}/"`), `post de outro autor: ${post.slug}`);
    }

    assert.ok(
      headHtml.includes(`<link rel="canonical" href="${getAuthorUrl(id)}"`),
      'canonical com barra final'
    );
    assert.match(headHtml, /<meta name="robots" content="index, follow"/);
  });

  test(`/autor/${id}/ emite ProfilePage + Person ligados pelo mesmo @id, só com dados de AUTHORS`, async () => {
    const { headHtml } = await render(`/autor/${id}/`);
    const nodes = parseJsonLd(headHtml);

    const profile = nodes.find((node) => hasType(node, 'ProfilePage'));
    const person = nodes.find((node) => hasType(node, 'Person'));
    assert.ok(profile, 'sem ProfilePage');
    assert.ok(person, 'sem Person');

    assert.equal(profile.url, getAuthorUrl(id));
    assert.deepEqual(profile.mainEntity, { '@id': getAuthorEntityId(id) });
    assert.equal(person['@id'], getAuthorEntityId(id));
    assert.equal(person.url, getAuthorUrl(id));
    assert.equal(person.name, author.name);
    assert.equal(person.jobTitle, author.role);
    assert.equal(person.description, author.bio);
    assert.deepEqual(person.sameAs, Object.values(author.social ?? {}));
    assert.deepEqual(
      (person.worksFor as Node)['@id'],
      'https://www.anhanga.tur.br/#organization'
    );

    const breadcrumb = nodes.find((node) => hasType(node, 'BreadcrumbList'));
    assert.ok(breadcrumb, 'sem BreadcrumbList');
  });
}

test('/autor/<id desconhecido>/ cai no NotFound (noindex), sem página de autor', async () => {
  for (const unknown of ['nao-existe', 'constructor']) {
    const { appHtml, headHtml } = await render(`/autor/${unknown}/`);
    assert.ok(appHtml.includes('data-testid="not-found-section"'), `${unknown} deveria ser 404`);
    assert.ok(!parseJsonLd(headHtml).some((node) => hasType(node, 'ProfilePage')));
    assert.match(headHtml, /noindex/);
  }
});
