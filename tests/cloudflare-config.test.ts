import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function collectTomlVarsSection(source: string, sectionName: string): Map<string, string> {
  const vars = new Map<string, string>();
  let inSection = false;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) {
      inSection = sectionMatch[1] === sectionName;
      continue;
    }

    if (!inSection) continue;

    const assignmentMatch = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      vars.set(assignmentMatch[1], assignmentMatch[2].replace(/^["']|["']$/g, ''));
    }
  }

  return vars;
}

test('Cloudflare Pages build should use the repo Node runtime target', async () => {
  const nodeVersion = await readFile(new URL('../.node-version', import.meta.url), 'utf8');

  assert.equal(nodeVersion.trim(), '24');
});

test('wrangler production vars should mirror top-level runtime vars', async () => {
  const source = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const topLevelVars = collectTomlVarsSection(source, 'vars');
  const productionVars = collectTomlVarsSection(source, 'env.production.vars');

  assert.ok(topLevelVars.size > 0);
  assert.deepEqual(productionVars, topLevelVars);
});

test('Cloudflare media vars should use the managed media zone for assets and transforms', async () => {
  const source = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const vars = collectTomlVarsSection(source, 'vars');

  assert.equal(vars.get('VITE_MEDIA_BASE_URL'), 'https://media.anhanga.tur.br');
  assert.equal(vars.get('VITE_MEDIA_TRANSFORM_ZONE_URL'), 'https://media.anhanga.tur.br');
  assert.equal(vars.get('VITE_MEDIA_ENABLE_TRANSFORMS'), 'true');
});

test('Cloudflare redirects should use supported status codes', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.doesNotMatch(redirects, /(?:^|\s)(?:301|302|303|307|308)!(?:\s|$)/);
});

test('Cloudflare redirects should avoid redundant SPA fallback rewrites', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.doesNotMatch(redirects, /^\/\*\s+\/index\.html\s+200$/m);
});

test('Cloudflare splat redirects should come after exact redirects', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
  const lines = redirects
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const blogSplatIndex = lines.findIndex((line) => line.startsWith('/blog/* '));

  assert.notEqual(blogSplatIndex, -1);
  assert.equal(
    lines.slice(blogSplatIndex + 1).some((line) => !line.includes('*')),
    false,
  );
});
