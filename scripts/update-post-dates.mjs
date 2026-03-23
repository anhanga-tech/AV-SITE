/**
 * Atualiza `dateModified` no frontmatter de posts MDX modificados e
 * regenera o blogManifest.ts.
 *
 * Usado pelo pre-commit hook e pelo script `pnpm update:dates`.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

// Em modo hook (sem args) lê apenas arquivos staged; com --all processa todos os MDX.
const processAll = process.argv.includes('--all');

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (result.error) throw result.error;
  return result.stdout ?? '';
}

function getStagedMdxFiles() {
  return run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'])
    .trim()
    .split('\n')
    .filter(f => f.startsWith('content/blog/') && f.endsWith('.mdx') && !f.includes('_template'));
}

function getAllMdxFiles() {
  return run('git', ['ls-files', 'content/blog/'])
    .trim()
    .split('\n')
    .filter(f => f.endsWith('.mdx') && !f.includes('_template'));
}

const files = processAll ? getAllMdxFiles() : getStagedMdxFiles();

if (files.length === 0) {
  process.exit(0);
}

let updated = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');

  // Extrai a data de publicação original
  const dateMatch = content.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?/m);
  if (!dateMatch) continue;

  const postDate = dateMatch[1];

  // Pula posts publicados hoje (dateModified == date seria redundante)
  if (postDate >= today) continue;

  let newContent;
  if (/^dateModified:/m.test(content)) {
    // Atualiza campo existente
    newContent = content.replace(
      /^(dateModified:\s*["']?)\d{4}-\d{2}-\d{2}(["']?)$/m,
      `$1${today}$2`
    );
  } else {
    // Insere após o campo `date`
    newContent = content.replace(
      /^(date:\s*["']?\d{4}-\d{2}-\d{2}["']?)$/m,
      `$1\ndateModified: "${today}"`
    );
  }

  if (newContent === content) continue;

  writeFileSync(file, newContent, 'utf8');
  console.log(`✓ dateModified → ${today}  (${file})`);
  updated = true;

  if (!processAll) {
    // No modo hook, re-adiciona o arquivo ao stage após a edição
    run('git', ['add', file]);
  }
}

if (updated || processAll) {
  run('node', ['--experimental-strip-types', 'scripts/generate-blog-manifest.ts'], { stdio: 'inherit' });

  if (!processAll) {
    run('git', ['add', 'data/blogManifest.ts']);
  }
}
