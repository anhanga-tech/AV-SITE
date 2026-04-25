import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const PROJECT_ROOT = process.cwd();
const INDEX_TEMPLATE_PATH = path.join(PROJECT_ROOT, 'index.html');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const PRERENDER_SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts/prerender.mjs');
const VERCEL_CONFIG_PATH = path.join(PROJECT_ROOT, 'vercel.json');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(raw);
  return isRecord(parsed) ? parsed : {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

test('build pipeline keeps prerender enabled for Vercel deploys', async () => {
  const [packageJson, prerenderScript, vercelConfig] = await Promise.all([
    readFile(PACKAGE_JSON_PATH, 'utf8'),
    readFile(PRERENDER_SCRIPT_PATH, 'utf8'),
    readFile(VERCEL_CONFIG_PATH, 'utf8')
  ]);
  const packageData = parseJsonObject(packageJson);
  const scripts = isRecord(packageData.scripts) ? packageData.scripts : {};
  const buildScript = readString(scripts.build);
  const vercelData = parseJsonObject(vercelConfig);
  const buildCommand = readString(vercelData.buildCommand);

  assert.match(buildScript, /node scripts\/prerender\.mjs/);
  assert.equal(buildCommand, 'pnpm run build');
  assert.match(prerenderScript, /validateHtml/);
  assert.match(prerenderScript, /process\.exit\(1\)/);
});

test('index template does not hide crawlable navigation links', async () => {
  const html = await readFile(INDEX_TEMPLATE_PATH, 'utf8');

  assert.doesNotMatch(html, /<nav class="sr-only" aria-label="Links principais">/);
});
