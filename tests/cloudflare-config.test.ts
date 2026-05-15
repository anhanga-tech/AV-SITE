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
      vars.set(assignmentMatch[1], assignmentMatch[2]);
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

test('Cloudflare redirects should use supported status codes', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.doesNotMatch(redirects, /(?:^|\s)(?:301|302|303|307|308)!(?:\s|$)/);
});
