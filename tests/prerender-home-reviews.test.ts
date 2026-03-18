import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const distDir = path.resolve(process.cwd(), 'dist');

function ensureDistExists(): void {
  const homePath = path.join(distDir, 'index.html');

  if (fs.existsSync(homePath)) {
    return;
  }

  execFileSync('pnpm', ['build'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: process.env,
  });
}

async function getRouteHtml(route: '/' | '/sobre'): Promise<string> {
  ensureDistExists();

  const distPath = route === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, 'sobre', 'index.html');

  return fs.readFileSync(distPath, 'utf8');
}

test('Home prerender should include real reviews, coherent aggregate rating, and no empty placeholder section', async () => {
  const html = await getRouteHtml('/');

  assert.match(html, /id="depoimentos"/);
  assert.match(html, /data-review-mode="real"/);
  assert.match(html, /Daryw M\./);
  assert.match(html, /Rafa &amp; Gabi|Rafa & Gabi/);
  assert.match(html, /William S\./);
  assert.doesNotMatch(html, /<section id="depoimentos"[^>]*aria-hidden="true"[^>]*><\/section>/);
  assert.match(html, /"aggregateRating":\{"@type":"AggregateRating","ratingValue":"?4\.9"?,"reviewCount":"?27"?/);
});

test('About prerender should keep organization schema without aggregateRating when no visible reviews exist', async () => {
  const html = await getRouteHtml('/sobre');

  assert.match(html, /script:ld-json:organization/);
  assert.doesNotMatch(html, /"aggregateRating":\{/);
});
