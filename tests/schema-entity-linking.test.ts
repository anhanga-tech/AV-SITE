import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArticleSchema } from '../components/schemas/ArticleSchema';
import { BlogPostSchemas } from '../components/blog/BlogPostSchemas';
import { AUTHORS } from '../data/blogData';
import { BLOG_POST_MANIFEST } from '../data/blogManifest';
import { HeadContext, createHeadManager, renderHeadTags } from '../lib/head';
import { render } from '../ssr.tsx';

// Entity linking (IsAgentReady `ia.entity-linking`, AR-READ-08): a Anhangá é uma entidade
// só, com @id estável, e os nós que falam dela (Service, BlogPosting, Person) apontam
// para esse @id em vez de descreverem uma organização solta.
const ORGANIZATION_ID = 'https://www.anhanga.tur.br/#organization';

type Node = Record<string, unknown>;

const parseJsonLd = (headHtml: string): Node[] =>
  [...headHtml.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]) as Node);

async function jsonLdFor(url: string): Promise<Node[]> {
  const { headHtml } = await render(url);
  return parseJsonLd(headHtml);
}

const hasType = (node: Node, type: string) =>
  ([] as unknown[]).concat(node['@type']).includes(type);

const refId = (value: unknown) => (value as Node | undefined)?.['@id'];

test('the Organization node carries a stable @id on home and /sobre', async () => {
  for (const url of ['/', '/sobre']) {
    const org = (await jsonLdFor(url)).find((node) => hasType(node, 'Organization'));
    assert.ok(org, `${url} has no Organization node`);
    assert.equal(org['@id'], ORGANIZATION_ID, `${url} Organization @id`);
  }
});

test('Service provider on home links to the Organization @id', async () => {
  const service = (await jsonLdFor('/')).find((node) => hasType(node, 'Service'));
  assert.ok(service, 'home has no Service node');
  assert.equal(refId(service.provider), ORGANIZATION_ID);
});

// A rota de post depende de import.meta.glob (Vite), indisponível no tsx: renderiza o
// ArticleSchema direto, com o mesmo head manager do prerender.
test('BlogPosting publisher links to the Organization @id', () => {
  const headManager = createHeadManager();
  renderToStaticMarkup(
    React.createElement(HeadContext.Provider, { value: headManager },
      React.createElement(ArticleSchema, {
        title: 'Post', description: 'Resumo', image: 'https://media.anhanga.tur.br/x.jpg',
        datePublished: '2026-01-01', authorName: 'Autora', url: 'https://www.anhanga.tur.br/blog/post/'
      }))
  );
  const post = parseJsonLd(renderHeadTags(headManager.getTags())).find((node) => hasType(node, 'BlogPosting'));
  assert.ok(post, 'blog post has no BlogPosting node');
  assert.equal(refId(post.publisher), ORGANIZATION_ID);
});

test('consultants on /sobre link worksFor to the Organization @id', async () => {
  const people = (await jsonLdFor('/sobre')).filter((node) => hasType(node, 'Person') && node.worksFor);
  assert.ok(people.length > 0, '/sobre has no Person with worksFor');
  for (const person of people) {
    assert.equal(refId(person.worksFor), ORGANIZATION_ID, `${String(person.name)} worksFor`);
  }
});

// Páginas de confiança (IsAgentReady `ia.trust-pages`): /sobre e /contato se declaram
// AboutPage e ContactPage e apontam para a Organization, em vez de WebPage genérico.
test('/sobre is an AboutPage and /contato a ContactPage about the Organization', async () => {
  for (const [url, type] of [['/sobre', 'AboutPage'], ['/contato', 'ContactPage']] as const) {
    const page = (await jsonLdFor(url)).find((node) => hasType(node, type));
    assert.ok(page, `${url} has no ${type} node`);
    assert.equal(refId(page.about), ORGANIZATION_ID, `${url} ${type} about`);
  }
});

// Página de autor (/autor/<id>/): a URL do Person e do BlogPosting.author é a da página do
// autor — nunca a do post nem a /sobre/ — e os dois nós compartilham o mesmo @id.
function postJsonLd(slug: string): { nodes: Node[]; postUrl: string } {
  const post = BLOG_POST_MANIFEST.find((entry) => entry.slug === slug);
  assert.ok(post, `post ${slug} ausente do manifesto`);
  const postUrl = `https://www.anhanga.tur.br/blog/${slug}/`;
  const headManager = createHeadManager();
  renderToStaticMarkup(
    React.createElement(HeadContext.Provider, { value: headManager },
      React.createElement(BlogPostSchemas, { post, author: AUTHORS[post.author] ?? null, canonicalUrl: postUrl }))
  );
  return { nodes: parseJsonLd(renderHeadTags(headManager.getTags())), postUrl };
}

for (const [slug, authorId] of [
  ['como-planejar-viagem-orlando-sob-medida', 'felipe-william'],
  ['melhor-epoca-viajar-orlando-guia-perfil-viajante', 'queila-oliveira'],
] as const) {
  test(`${slug}: Person.url e BlogPosting.author.url apontam para a página do autor`, () => {
    const { nodes, postUrl } = postJsonLd(slug);
    const author = AUTHORS[authorId];
    const authorUrl = `https://www.anhanga.tur.br/autor/${authorId}/`;
    const posting = nodes.find((node) => hasType(node, 'BlogPosting'));
    const person = nodes.find((node) => hasType(node, 'Person'));
    assert.ok(posting && person, 'BlogPosting e Person são esperados');

    const postingAuthor = posting.author as Node;
    assert.equal(person.url, authorUrl);
    assert.equal(postingAuthor.url, authorUrl);
    assert.notEqual(person.url, postUrl, 'Person.url não pode ser a URL do post');
    assert.ok(!String(person.url).includes('/sobre'), 'Person.url não pode ser /sobre/');
    assert.equal(postingAuthor['@id'], person['@id'], 'mesma entidade nos dois nós');
    assert.equal(person['@id'], `${authorUrl}#person`);

    const expectedSameAs = Object.values(author.social ?? {});
    assert.ok(expectedSameAs.length > 0, 'fixture: autor com redes');
    assert.deepEqual(person.sameAs, expectedSameAs);
    assert.deepEqual(postingAuthor.sameAs, expectedSameAs);
    assert.equal(refId(person.worksFor), ORGANIZATION_ID);
  });
}

test('post com autor fora de AUTHORS não inventa página de autor', () => {
  const [base] = BLOG_POST_MANIFEST;
  const headManager = createHeadManager();
  renderToStaticMarkup(
    React.createElement(HeadContext.Provider, { value: headManager },
      React.createElement(BlogPostSchemas, {
        post: { ...base, author: 'alguem-sem-cadastro' }, author: null,
        canonicalUrl: 'https://www.anhanga.tur.br/blog/x/'
      }))
  );
  const nodes = parseJsonLd(renderHeadTags(headManager.getTags()));
  const posting = nodes.find((node) => hasType(node, 'BlogPosting'));
  assert.ok(posting);
  assert.equal((posting.author as Node).name, 'alguem-sem-cadastro');
  assert.equal('url' in (posting.author as Node), false);
  assert.equal(nodes.some((node) => hasType(node, 'Person')), false);
});

test('consultants on /sobre share the author page url and @id', async () => {
  const people = (await jsonLdFor('/sobre')).filter((node) => hasType(node, 'Person'));
  assert.equal(people.length, 2);
  for (const person of people) {
    assert.match(String(person.url), /^https:\/\/www\.anhanga\.tur\.br\/autor\/[a-z-]+\/$/);
    assert.equal(person['@id'], `${String(person.url)}#person`);
  }
});
