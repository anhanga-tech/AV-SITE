/**
 * Atualiza `dateModified` no frontmatter de posts MDX modificados e
 * regenera o blogManifest.ts.
 *
 * Usado pelo pre-commit hook e pelo script `pnpm update:dates`.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { blogSourcesOutsideStage, shouldBumpDateModified } from './post-date-diff.mjs';

const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

// Em modo hook (sem args) lê apenas arquivos staged; com --all processa todos os MDX.
const processAll = process.argv.includes('--all');

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (result.error) throw result.error;
  return result.stdout ?? '';
}

// `rev` é `HEAD` ou `` (índice/stage). Devolve `null` se o arquivo não existe nessa revisão.
function readGitVersion(rev, file) {
  const result = spawnSync('git', ['show', `${rev}:${file}`], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result.status === 0 ? result.stdout : null;
}

// Compara o que vai para o commit (stage), não a árvore de trabalho com edições não staged.
function bodyChangedInCommit(file) {
  const staged = readGitVersion('', file);
  if (staged === null) return true;
  return shouldBumpDateModified(readGitVersion('HEAD', file), staged);
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

if (!processAll) {
  const lines = (args) => run('git', args).trim().split('\n').filter(Boolean);
  const outside = blogSourcesOutsideStage(
    lines(['diff', '--name-only', '--', 'content/blog/']),
    lines(['ls-files', '--others', '--exclude-standard', '--', 'content/blog/']),
  );
  if (outside.length > 0) {
    // Não bloqueia o commit; só não toca em nada. Datas e manifests ficam para
    // `pnpm update:dates` / o build depois que o stage estiver completo.
    console.warn('⚠ dateModified e manifests do blog NÃO atualizados: posts com conteúdo fora do stage:');
    for (const file of outside) console.warn(`  - ${file}`);
    process.exit(0);
  }
}


for (const file of files) {
  const content = readFileSync(file, 'utf8');

  // No modo hook, só o corpo conta como atualização; o --all segue forçando o bump.
  if (!processAll && !bodyChangedInCommit(file)) continue;

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

  if (!processAll) {
    // No modo hook, re-adiciona o arquivo ao stage após a edição
    run('git', ['add', file]);
  }
}

// Regenera os manifests para qualquer MDX staged, não só quando a data mudou:
// mudança só de frontmatter (título, crédito de imagem) também muda o manifest,
// e pular o bump não pode deixar o artefato commitado desatualizado.
run('node', ['--experimental-strip-types', 'scripts/generate-blog-manifest.ts'], { stdio: 'inherit' });

if (!processAll) {
  run('git', ['add', 'data/blogManifest.ts', 'data/blogManifestHomeTeaser.ts', 'data/blogMarkdown.ts']);
}
