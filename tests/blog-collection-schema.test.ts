import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BlogCollectionSchema,
  buildBlogCollectionData,
} from '../components/schemas/BlogCollectionSchema';
import { ORGANIZATION_ID, WEBSITE_ID } from '../components/schemas/schema-ids';
import { HeadContext, createHeadManager, renderHeadTags } from '../lib/head';
import { render } from '../ssr.tsx';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';

type Node = Record<string, unknown>;

const parseJsonLd = (headHtml: string): Node[] =>
  [...headHtml.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]) as Node);

const ITEMS = [
  { name: 'Primeiro post', url: getBlogPostUrl('primeiro-post') },
  { name: 'Segundo post', url: getBlogPostUrl('segundo-post') },
  { name: 'Terceiro post', url: getBlogPostUrl('terceiro-post') },
];

test('blog collection schema is a CollectionPage whose mainEntity is an ItemList', () => {
  const data = buildBlogCollectionData({
    name: 'Blog',
    url: getBlogHomeUrl(),
    description: 'Descrição',
    items: ITEMS,
  });
  assert.equal(data['@type'], 'CollectionPage');
  assert.equal(data.url, 'https://www.anhanga.tur.br/blog/');
  assert.deepEqual(data.isPartOf, { '@id': WEBSITE_ID });
  assert.deepEqual(data.publisher, { '@id': ORGANIZATION_ID });

  const list = data.mainEntity as Node;
  assert.equal(list['@type'], 'ItemList');
  assert.equal(list.numberOfItems, ITEMS.length);
});

test('blog collection list items have sequential positions, absolute trailing-slash urls and names', () => {
  const data = buildBlogCollectionData({ name: 'Blog', url: getBlogHomeUrl(), description: 'd', items: ITEMS });
  const elements = (data.mainEntity as { itemListElement: Node[] }).itemListElement;

  assert.deepEqual(elements.map((e) => e.position), [1, 2, 3]);
  assert.deepEqual(elements.map((e) => e.name), ITEMS.map((i) => i.name));
  for (const element of elements) {
    assert.equal(element['@type'], 'ListItem');
    assert.match(String(element.url), /^https:\/\/www\.anhanga\.tur\.br\/blog\/[a-z0-9-]+\/$/);
  }
});

test('BlogCollectionSchema emits one ld+json script through the head manager', () => {
  const headManager = createHeadManager();
  renderToStaticMarkup(
    React.createElement(HeadContext.Provider, { value: headManager },
      React.createElement(BlogCollectionSchema, {
        name: 'Blog', url: getBlogHomeUrl(), description: 'd', items: ITEMS,
      }))
  );
  const nodes = parseJsonLd(renderHeadTags(headManager.getTags()));
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0]['@type'], 'CollectionPage');
});

test('/blog renders CollectionPage + ItemList alongside the BreadcrumbList', async () => {
  const { headHtml } = await render('/blog');
  const nodes = parseJsonLd(headHtml);

  assert.ok(nodes.some((n) => n['@type'] === 'BreadcrumbList'), 'BreadcrumbList must be kept');
  const collection = nodes.find((n) => n['@type'] === 'CollectionPage');
  assert.ok(collection, '/blog has no CollectionPage node');

  const elements = (collection.mainEntity as { itemListElement: Node[] }).itemListElement;
  assert.ok(elements.length > 0, 'ItemList must not be empty');
  elements.forEach((element, index) => {
    assert.equal(element.position, index + 1);
    assert.match(String(element.url), /^https:\/\/www\.anhanga\.tur\.br\/blog\/[^/]+\/$/);
    assert.ok(String(element.name).length > 0, 'ListItem needs a name');
  });
});
