import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { BlogPostHero } from '../components/blog/BlogPostHero.tsx';
import { BlogPostSidebar } from '../components/blog/BlogPostSidebar.tsx';
import { AUTHORS } from '../data/blogData.ts';
import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';

// O nome do autor no byline do hero e no card da sidebar leva à página dele (/autor/<id>/).
// Autor fora de AUTHORS segue como texto: não existe página para linkar.

const post = BLOG_POST_MANIFEST.find((entry) => entry.slug === 'como-planejar-viagem-orlando-sob-medida');
assert.ok(post, 'fixture: post de exemplo ausente do manifesto');
const felipe = AUTHORS['felipe-william'];

const inRouter = (element: React.ReactElement) =>
  renderToStaticMarkup(React.createElement(MemoryRouter, null, element));

test('byline do hero linka a página do autor', () => {
  const html = inRouter(
    React.createElement(BlogPostHero, { post, authorName: felipe.name, authorHref: '/autor/felipe-william/' })
  );
  assert.match(html, /<a [^>]*href="\/autor\/felipe-william\/"[^>]*>Felipe William<\/a>/);
});

test('byline do hero sem página de autor continua texto', () => {
  const html = inRouter(React.createElement(BlogPostHero, { post, authorName: 'alguem-sem-cadastro' }));
  assert.ok(html.includes('alguem-sem-cadastro'));
  assert.ok(!html.includes('/autor/'));
});

test('card do autor na sidebar linka a página do autor', () => {
  const html = inRouter(
    React.createElement(BlogPostSidebar, { author: felipe, authorFallbackName: post.author, relatedPosts: [] })
  );
  assert.match(html, /<a [^>]*href="\/autor\/felipe-william\/"[^>]*>Felipe William<\/a>/);
});

test('sidebar sem autor cadastrado mostra o nome de fallback sem link', () => {
  const html = inRouter(
    React.createElement(BlogPostSidebar, { author: null, authorFallbackName: 'alguem-sem-cadastro', relatedPosts: [] })
  );
  assert.ok(html.includes('alguem-sem-cadastro'));
  assert.ok(!html.includes('/autor/'));
});

test('cards "Leia também" da sidebar não repetem o aviso de crédito em verificação', () => {
  const unknown = BLOG_POST_MANIFEST.find((entry) => entry.imageCreditStatus === 'unknown');
  assert.ok(unknown, 'fixture: post com crédito unknown');
  const html = inRouter(
    React.createElement(BlogPostSidebar, { author: felipe, authorFallbackName: post.author, relatedPosts: [unknown] })
  );
  assert.ok(html.includes(unknown.title), 'o card do relacionado aparece');
  assert.ok(!html.includes('Crédito da imagem em verificação'));
});
