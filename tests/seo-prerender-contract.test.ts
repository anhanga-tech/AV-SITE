import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const PROJECT_ROOT = process.cwd();
const INDEX_TEMPLATE_PATH = path.join(PROJECT_ROOT, 'index.html');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const PRERENDER_SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts/prerender.mjs');
const VERCEL_CONFIG_PATH = path.join(PROJECT_ROOT, 'vercel.json');

test('build pipeline keeps prerender enabled for Vercel deploys', async () => {
  const [packageJson, prerenderScript, vercelConfig] = await Promise.all([
    readFile(PACKAGE_JSON_PATH, 'utf8'),
    readFile(PRERENDER_SCRIPT_PATH, 'utf8'),
    readFile(VERCEL_CONFIG_PATH, 'utf8')
  ]);
  const { scripts } = JSON.parse(packageJson) as { scripts?: Record<string, string> };
  const buildScript = scripts?.build ?? '';
  const { buildCommand } = JSON.parse(vercelConfig) as { buildCommand?: string };

  assert.match(buildScript, /node scripts\/prerender\.mjs/);
  assert.equal(buildCommand, 'pnpm run build');
  assert.match(prerenderScript, /validateHtml/);
  assert.match(prerenderScript, /process\.exit\(1\)/);
});

test('index template does not hide crawlable navigation links', async () => {
  const html = await readFile(INDEX_TEMPLATE_PATH, 'utf8');

  assert.doesNotMatch(html, /<nav class="sr-only" aria-label="Links principais">/);
});
