import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regression coverage for issue #1017: the privileged release workflow runs with
// contents/issues/pull-requests write scopes, so it must never execute unpinned
// remote code. Two guards: (1) GitHub Actions pinned by full 40-char commit SHA,
// (2) semantic-release runs from lockfile-locked devDependencies via `pnpm exec`,
// never `pnpm dlx` (which resolves and runs remote code at job time).

const SHA_PIN = /@[0-9a-f]{40}(?:\s|$)/;

async function readReleaseWorkflow(): Promise<string> {
  return readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
}

async function readPackageJson(): Promise<{ devDependencies?: Record<string, string> }> {
  return JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
}

test('release workflow pins every GitHub Action to a full commit SHA', async () => {
  const workflow = await readReleaseWorkflow();

  const usesLines = workflow.split('\n').filter((line) => /^\s*(-\s*)?uses:/.test(line));
  assert.ok(usesLines.length >= 3, 'expected at least the checkout/pnpm/node action steps');

  for (const line of usesLines) {
    const ref = line.replace(/^\s*(-\s*)?uses:\s*/, '').trim();
    assert.match(ref, SHA_PIN, `action must be pinned by SHA, not a mutable tag: ${ref}`);
  }
});

test('release workflow runs semantic-release from the lockfile, not remotely', async () => {
  const workflow = await readReleaseWorkflow();

  assert.doesNotMatch(
    workflow,
    /pnpm\s+dlx\s+semantic-release/,
    'pnpm dlx fetches and runs unpinned remote code with a write token',
  );
  assert.match(workflow, /pnpm\s+exec\s+semantic-release/, 'semantic-release must run via pnpm exec (local binary)');
});

test('semantic-release and its plugins are exact-pinned devDependencies', async () => {
  const packageJson = await readPackageJson();
  const devDependencies = packageJson.devDependencies ?? {};

  const required = [
    'semantic-release',
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/github',
  ];

  for (const name of required) {
    const version = devDependencies[name];
    assert.ok(version, `${name} must be a devDependency so it is locked in pnpm-lock.yaml`);
    assert.match(version, /^\d+\.\d+\.\d+/, `${name} must be pinned to an exact version, got "${version}"`);
  }
});
