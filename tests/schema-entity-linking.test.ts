import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArticleSchema } from '../components/schemas/ArticleSchema';
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
