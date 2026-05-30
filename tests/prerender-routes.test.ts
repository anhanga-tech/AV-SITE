import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { BASE_PRERENDER_ROUTES, buildPrerenderRoutes } from '../lib/prerender-routes.js';

test('buildPrerenderRoutes includes blog index and blog post routes from MDX files', async () => {
  const blogDir = await mkdtemp(path.join(os.tmpdir(), 'prerender-routes-'));

  try {
    await writeFile(path.join(blogDir, '_template.mdx'), '---\n---\n', 'utf8');
    await writeFile(path.join(blogDir, 'post-alpha.mdx'), '---\n---\n', 'utf8');
    await writeFile(path.join(blogDir, 'post-beta.mdx'), '---\n---\n', 'utf8');

    const routes = await buildPrerenderRoutes(blogDir);

    assert.ok(routes.includes('/blog'));
    assert.ok(routes.includes('/consultoria-de-viagem'));
    assert.ok(routes.includes('/viagens-para-executivos'));
    assert.ok(routes.includes('/curadoria-cruzeiros-brasil'));
    assert.ok(routes.includes('/quiz'));
    assert.ok(routes.includes('/blog/post-alpha'));
    assert.ok(routes.includes('/blog/post-beta'));
    assert.equal(routes.includes('/nps'), false);
    assert.equal(routes.length, new Set(routes).size);
    assert.equal(routes.some((route) => route.includes('_template')), false);
  } finally {
    await rm(blogDir, { recursive: true, force: true });
  }
});

test('base prerender routes come from the indexable static sitemap routes', () => {
  assert.ok(BASE_PRERENDER_ROUTES.includes('/'));
  assert.ok(BASE_PRERENDER_ROUTES.includes('/blog'));
  assert.ok(BASE_PRERENDER_ROUTES.includes('/corporativo'));
  assert.equal(BASE_PRERENDER_ROUTES.includes('/nps'), false);
});
