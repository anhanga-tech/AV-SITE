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

test('package engines should accept the deploy Node.js line (24) and newer local runtimes', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    engines?: Record<string, string>;
  };

  assert.equal(packageJson.engines?.node, '>=24');
});

test('pnpm settings live in pnpm-workspace.yaml, not in the package.json "pnpm" field ignored by pnpm 11', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as Record<
    string,
    unknown
  >;
  const workspaceConfig = await readFile(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8');

  assert.equal(packageJson.pnpm, undefined, 'the "pnpm" field is ignored by pnpm >= 11 and must not exist');
  assert.equal(packageJson.overrides, undefined, 'npm-style "overrides" is not read by pnpm; use pnpm-workspace.yaml');

  assert.match(workspaceConfig, /^overrides:\s*$/m);
  assert.match(workspaceConfig, /^onlyBuiltDependencies:\s*$/m);
  for (const pinned of ['rimraf', 'glob', 'qs']) {
    assert.match(workspaceConfig, new RegExp(`^  ${pinned}: `, 'm'), `security override for ${pinned} must stay pinned`);
  }

  assert.match(
    workspaceConfig,
    /^[ ]{2}"minimatch@3": "\^3\.1\.5"$/m,
    'jsx-a11y must use the patched minimatch 3 backport that preserves its CommonJS API',
  );
  assert.doesNotMatch(
    workspaceConfig,
    /^[ ]{2}minimatch: /m,
    'a global minimatch override breaks eslint-plugin-jsx-a11y by forcing the incompatible v10 API',
  );
});
