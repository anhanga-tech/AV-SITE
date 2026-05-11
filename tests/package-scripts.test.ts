import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('validation scripts regenerate the blog manifest before running checks', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert.match(packageJson.scripts?.typecheck ?? '', /generate:blog-manifest/);
  assert.match(packageJson.scripts?.['test:regression'] ?? '', /generate:blog-manifest/);
});

test('package engines should target the active Node.js LTS line used by deploys', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    engines?: Record<string, string>;
  };

  assert.equal(packageJson.engines?.node, '24.x');
});
