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

function collectHeadersBlocks(source: string): Map<string, Map<string, string>> {
  const blocks = new Map<string, Map<string, string>>();
  let currentPath: string | undefined;

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    const line = rawLine.trim();
    if (line.startsWith('#')) continue;

    if (!rawLine.startsWith(' ') && !rawLine.startsWith('\t')) {
      currentPath = line;
      blocks.set(currentPath, new Map());
      continue;
    }

    if (!currentPath) continue;

    const headerMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (headerMatch) {
      blocks.get(currentPath)?.set(headerMatch[1], headerMatch[2]);
    }
  }

  return blocks;
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

test('Cloudflare Pages headers should cache hashed Vite assets immutably', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const blocks = collectHeadersBlocks(headers);
  const assetHeaders = blocks.get('/assets/*');

  assert.ok(assetHeaders);
  assert.equal(assetHeaders.get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.notEqual(blocks.get('/*')?.get('Cache-Control'), assetHeaders.get('Cache-Control'));
});

test('Cloudflare splat redirects should come after exact redirects', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
  const lines = redirects
    .split(/\r?\n/)
    .flatMap((line) => {
      const t = line.trim();
      return t && !t.startsWith('#') ? [t] : [];
    });
  const blogSplatIndex = lines.findIndex((line) => line.startsWith('/blog/* '));

  assert.notEqual(blogSplatIndex, -1);
  assert.equal(
    lines.slice(blogSplatIndex + 1).some((line) => !line.includes('*')),
    false,
  );
});
