import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSITIONING_CONTENT_PATHS = [
  'PLANO-SEO-2026.md',
  'QWEN.md',
  'TODO.MD',
  'api/markdown.ts',
  'components',
  'content/blog',
  'competitive-brief-conteudo.md',
  'data/blogManifest.ts',
  'docs',
  'index.html',
  'pages',
  'public/llms.txt',
  'public/sitemap.xml',
  'seo-audit-anhanga-viagens.md',
  'seo-audit-completo-marco-2026.md',
];
const BLOCKED_POSITIONING_PATTERN = /\bboutique\b/i;

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

      if (entry.isFile() && /\.(css|html|md|mdx|ts|tsx|txt|xml)$/i.test(entry.name)) {
        return [path.join(ROOT_DIR, entryPath)];
      }

      return [];
    }),
  );

  return nestedFiles.flat();
}

async function collectDesignSystemReadmes(): Promise<string[]> {
  const entries = await readdir(ROOT_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('Design System'))
    .map((entry) => path.join(ROOT_DIR, entry.name, 'README.md'));
}

test('site positioning content does not use boutique agency positioning', async () => {
  const files = [
    ...(await Promise.all(POSITIONING_CONTENT_PATHS.map(collectTextFiles))).flat(),
    ...(await collectDesignSystemReadmes()),
  ];
  const matches = (
    await Promise.all(
      files.map(async (file) => {
        const content = await readFile(file, 'utf8');

        return BLOCKED_POSITIONING_PATTERN.test(content) ? path.relative(ROOT_DIR, file) : null;
      }),
    )
  ).filter((match): match is string => match !== null);

  assert.deepEqual([...new Set(matches)].sort(), []);
});
