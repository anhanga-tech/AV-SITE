import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldHydratePrerenderedRoute } from '../lib/hydration.ts';

test('shouldHydratePrerenderedRoute only hydrates when the prerendered route matches the current path', () => {
  assert.equal(shouldHydratePrerenderedRoute('/', '/'), true);
  assert.equal(shouldHydratePrerenderedRoute('/blog', '/blog'), true);
  assert.equal(shouldHydratePrerenderedRoute('/blog', '/blog/'), true);
  assert.equal(shouldHydratePrerenderedRoute('/', '/blog'), false);
  assert.equal(shouldHydratePrerenderedRoute('/blog/teste', '/blog'), false);
  assert.equal(shouldHydratePrerenderedRoute(null, '/blog'), false);
});
