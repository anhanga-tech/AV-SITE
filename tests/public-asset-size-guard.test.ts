import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Issue #1139: a forgotten 62 MiB of Beto Carrero JPG/PNG originals sat in
// `public/` and shipped in every deployment even though production pages
// only reference the managed R2/webp replacements. This guard keeps large
// binary assets out of the public deployment tree going forward.
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MiB

// Justified exceptions only: add an entry with a one-line reason, never bump
// the global limit to make an oversized file pass.
const ALLOWLIST: Record<string, string> = {};

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

async function listFilesRecursively(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFilesRecursively(fullPath);
      return [fullPath];
    }),
  );
  return files.flat();
}

test('public/ deployment tree has no unexpectedly large files', async () => {
  const files = await listFilesRecursively(PUBLIC_DIR);
  const offenders: string[] = [];

  for (const file of files) {
    const relativePath = path.relative(PUBLIC_DIR, file);
    if (relativePath.endsWith('.DS_Store')) continue;
    if (relativePath in ALLOWLIST) continue;

    const { size } = await stat(file);
    if (size > MAX_FILE_SIZE_BYTES) {
      offenders.push(`${relativePath} (${(size / 1024 / 1024).toFixed(2)} MiB)`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Found files over ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MiB in public/ with no allowlist entry: ${offenders.join(', ')}`,
  );
});
