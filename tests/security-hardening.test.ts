import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readRepoFile = async (relativePath: string): Promise<string> =>
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('Lollapalooza Spotify embed is sandboxed with only the required capabilities', async () => {
  const lineupSection = await readRepoFile('components/landings/lollapalooza/LineupSection.tsx');

  assert.match(
    lineupSection,
    /<iframe[\s\S]*data-testid="embed-iframe"[\s\S]*sandbox="allow-popups allow-scripts"[\s\S]*>/,
  );
});

test('pnpm workspace enforces no-downgrade trust policy', async () => {
  const workspaceConfig = await readRepoFile('pnpm-workspace.yaml');

  assert.match(workspaceConfig, /^trustPolicy: no-downgrade$/m);
});
