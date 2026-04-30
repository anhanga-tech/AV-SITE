import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLISHED_PATHS = [
  'api/markdown.ts',
  'components',
  'content/blog',
  'data/blogManifest.ts',
  'index.html',
  'pages',
  'public/llms.txt',
  'public/sitemap.xml',
];
const BLOCKED_POSITIONING_PATTERNS = [
  /\bboutique\b/i,
  /agencias-boutique-sao-paulo/i,
  /ag[eê]ncia de viagens boutique/i,
  /ag[eê]ncia boutique/i,
];

async function collectTextFiles(targetPath: string): Promise<string[]> {
  const absolutePath = path.join(ROOT_DIR, targetPath);
  const targetStats = await stat(absolutePath);

  if (targetStats.isFile()) {
    return [absolutePath];
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(targetPath, entry.name);

      if (entry.isDirectory()) {
        return collectTextFiles(entryPath);
      }

      if (entry.isFile() && /\.(css|html|mdx|ts|tsx|txt|xml)$/.test(entry.name)) {
        return [path.join(ROOT_DIR, entryPath)];
      }

      return [];
    }),
  );

  return nestedFiles.flat();
}

test('published site content does not use boutique agency positioning', async () => {
  const files = (await Promise.all(PUBLISHED_PATHS.map(collectTextFiles))).flat();
  const matches: string[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf8');

    for (const pattern of BLOCKED_POSITIONING_PATTERNS) {
      if (pattern.test(content)) {
        matches.push(path.relative(ROOT_DIR, file));
        break;
      }
    }
  }

  assert.deepEqual([...new Set(matches)].sort(), []);
});
