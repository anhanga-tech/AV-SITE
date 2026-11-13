import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogPostSchemas } from '../components/blog/BlogPostSchemas';
import { parseImageCreator } from '../components/schemas/article-image';
import { AUTHORS } from '../data/blogData';
import { BLOG_POST_MANIFEST } from '../data/blogManifest';
import { HeadContext, createHeadManager, renderHeadTags } from '../lib/head';

// Regressão da auditoria Ahrefs jun/2026: propriedades fora do vocabulário schema.org
// ("keywords" em Service, "blog" em Organization) geravam erro de validação em 8 páginas.

const readRepoFile = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ServiceSchema does not emit "keywords" (invalid for Service type)', async () => {
  const source = await readRepoFile('components/schemas/ServiceSchema.tsx');
  assert.doesNotMatch(source, /keywords\s*[:=]/);
});

test('OrganizationSchema does not emit "blog" (not a schema.org property)', async () => {
  const source = await readRepoFile('components/schemas/OrganizationSchema.tsx');
  assert.doesNotMatch(source, /"blog"\s*:/);
});

test('no page passes the removed keywords prop to ServiceSchema', async () => {
  const pages = [
    'pages/Home.tsx',
    'pages/landings/BetoCarreroLanding.tsx',
    'pages/landings/OrlandoLanding.tsx',
    'pages/landings/MelhorIdadeLanding.tsx',
    'pages/landings/LollapaloozaLanding.tsx',
    'pages/landings/CruzeirosLanding.tsx',
    'pages/landings/ConsultoriaDeViagemLanding.tsx',
  ];
  for (const page of pages) {
    const source = await readRepoFile(page);
    assert.doesNotMatch(source, /keywords=\{/, `${page} still passes keywords prop`);
  }
});

// BlogPosting.image: com crédito confirmado vira ImageObject (creditText, creator, license,
// acquireLicensePage); com crédito `unknown` ou ausente continua a URL pura, sem autoria fictícia.
type Node = Record<string, unknown>;
type PostMeta = (typeof BLOG_POST_MANIFEST)[number];

function blogPosting(post: PostMeta): Node {
  const headManager = createHeadManager();
  renderToStaticMarkup(
    React.createElement(HeadContext.Provider, { value: headManager },
      React.createElement(BlogPostSchemas, {
        post, author: AUTHORS[post.author] ?? null,
        canonicalUrl: `https://www.anhanga.tur.br/blog/${post.slug}/`
      }))
  );
  const nodes = [...renderHeadTags(headManager.getTags())
    .matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]) as Node);
  const posting = nodes.find((node) => node['@type'] === 'BlogPosting');
  assert.ok(posting, 'BlogPosting ausente');
  return posting;
}

const bySlug = (slug: string): PostMeta => {
  const post = BLOG_POST_MANIFEST.find((entry) => entry.slug === slug);
  assert.ok(post, `post ${slug} ausente do manifesto`);
  return post;
};

for (const [slug, credit] of [
  ['como-planejar-viagem-orlando-sob-medida', 'Erasto Chávez / Unsplash'],
  ['melhor-epoca-viajar-orlando-guia-perfil-viajante', 'Jose Mizrahi / Unsplash'],
] as const) {
  test(`${slug}: image é ImageObject com o crédito confirmado`, () => {
    const post = bySlug(slug);
    const image = blogPosting(post).image as Node;
    assert.equal(typeof image, 'object');
    assert.equal(image['@type'], 'ImageObject');
    assert.equal(image.url, post.image);
    assert.equal(image.creditText, credit);
    assert.deepEqual(image.creator, { '@type': 'Person', name: credit.split(' / ')[0] });
    assert.equal(image.license, 'https://unsplash.com/pt-br/licenca');
    assert.equal(image.acquireLicensePage, post.imageSource);
  });
}

test('quanto-custa-viagem-disney-2026 (crédito unknown): image segue a URL pura, sem crédito inventado', () => {
  const post = bySlug('quanto-custa-viagem-disney-2026');
  assert.equal(post.imageCreditStatus, 'unknown');
  const posting = blogPosting(post);
  assert.equal(posting.image, post.image);
  assert.ok(!JSON.stringify(posting).includes('creditText'));
});

test('image fica como URL pura quando o status é unknown, mesmo com texto de crédito', () => {
  const base = bySlug('quanto-custa-viagem-disney-2026');
  const posting = blogPosting({ ...base, imageCreditStatus: 'unknown', imageCredit: 'Alguém / Flickr' });
  assert.equal(posting.image, base.image);
});

test('ImageObject omite license e acquireLicensePage quando o post não os traz', () => {
  const base = bySlug('como-planejar-viagem-orlando-sob-medida');
  const image = blogPosting({
    ...base, imageSource: undefined, imageLicense: undefined, imageLicenseUrl: undefined
  }).image as Node;
  assert.equal(image.creditText, 'Erasto Chávez / Unsplash');
  assert.equal('license' in image, false);
  assert.equal('acquireLicensePage' in image, false);
});

test('creator só sai quando o crédito segue "Autor / Plataforma"', () => {
  assert.equal(parseImageCreator('Marcus Holland-Moritz (mhx) / Wikimedia Commons'), 'Marcus Holland-Moritz (mhx)');
  assert.equal(parseImageCreator('Divulgação'), undefined);
  assert.equal(parseImageCreator(' / Unsplash'), undefined);
});

test('todos os créditos confirmados do manifesto geram ImageObject com creditText igual ao crédito', () => {
  const confirmed = BLOG_POST_MANIFEST.filter((post) => post.imageCreditStatus === 'confirmed' && post.imageCredit);
  assert.ok(confirmed.length >= 2);
  for (const post of confirmed) {
    const image = blogPosting(post).image as Node;
    assert.equal(image.creditText, post.imageCredit, post.slug);
  }
});
