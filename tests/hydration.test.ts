import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClientOnly } from '../components/ClientOnly';
import { shouldHydratePrerenderedRoute } from '../lib/hydration.ts';

function renderClientOnly(): string {
  return renderToStaticMarkup(
    React.createElement(
      ClientOnly,
      null,
      React.createElement('div', null, 'client-only feature')
    )
  );
}

test('shouldHydratePrerenderedRoute only hydrates when the prerendered route matches the current path', () => {
  assert.equal(shouldHydratePrerenderedRoute('/', '/'), true);
  assert.equal(shouldHydratePrerenderedRoute('/blog', '/blog'), true);
  assert.equal(shouldHydratePrerenderedRoute('/blog', '/blog/'), true);
  assert.equal(shouldHydratePrerenderedRoute('/', '/blog'), false);
  assert.equal(shouldHydratePrerenderedRoute('/blog/teste', '/blog'), false);
  assert.equal(shouldHydratePrerenderedRoute(null, '/blog'), false);
});

test('ClientOnly omits children during the initial render', () => {
  assert.equal(renderClientOnly(), '');
});
