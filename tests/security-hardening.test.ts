import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readRepoFile = async (relativePath: string): Promise<string> =>
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Lollapalooza Spotify embed is sandboxed with only the required capabilities', async () => {
  const lineupSection = await readRepoFile('components/landings/lollapalooza/LineupSection.tsx');
  const iframeMatch = lineupSection.match(/<iframe[^>]*data-testid="embed-iframe"[^>]*>/);

  assert.ok(iframeMatch, 'Spotify embed iframe should be present');
  assert.match(iframeMatch[0], /sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts"/);
});

test('pnpm workspace enforces no-downgrade trust policy', async () => {
  const workspaceConfig = await readRepoFile('pnpm-workspace.yaml');

  assert.match(workspaceConfig, /^trustPolicy: no-downgrade$/m);
  assert.match(workspaceConfig, /^\s+- semver@6\.3\.1$/m);
});
