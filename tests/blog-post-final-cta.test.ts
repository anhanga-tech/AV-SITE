import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogPostFinalCTA } from '../components/blog/BlogPostFinalCTA.tsx';
import type { PostMeta } from '../lib/mdx';

const render = () =>
  renderToStaticMarkup(
    React.createElement(BlogPostFinalCTA, { post: { title: 'Post de teste' } as PostMeta })
  );

test('final CTA keeps its copy and the specialist button', () => {
  const html = render();
  assert.ok(html.includes('Gostou do conteúdo?'));
  assert.ok(html.includes('Sua viagem começa aqui.'));
  assert.ok(html.includes('data-tracking="footer-blog-post"'));
});

test('final CTA does not add any heading to the article outline', () => {
  const html = render();
  assert.doesNotMatch(html, /<h[1-6][\s>]/i);
  assert.doesNotMatch(html, /role="heading"/i);
});
