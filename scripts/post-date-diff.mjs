/**
 * Decide se um post MDX merece bump de `dateModified`: só quando o corpo
 * (o que vem depois do frontmatter) mudou. Mudança só de frontmatter — crédito
 * de imagem, tags, a própria data — não é atualização de conteúdo e inflava o
 * `lastmod` do sitemap (auditoria 01/11/2026, #1969).
 */

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

export function bodyAfterFrontmatter(source) {
  const normalized = source.replace(/\r\n/g, '\n');
  return normalized.replace(FRONTMATTER, '').trim();
}

/**
 * Arquivos staged que também têm edições fora do stage (ex.: `git add -p`). O hook lê
 * a árvore de trabalho e faz `git add`, então reescrever um desses — ou embutir o corpo
 * dele em data/blogMarkdown.ts — levaria para o commit o que a pessoa não pôs no stage.
 *
 * @param {string[]} staged
 * @param {string[]} unstaged Saída de `git diff --name-only` (árvore vs. índice).
 */
export function partiallyStagedFiles(staged, unstaged) {
  const dirty = new Set(unstaged);
  return staged.filter((file) => dirty.has(file));
}

/**
 * @param {string | null} previous Conteúdo no HEAD; `null` quando o arquivo é novo.
 * @param {string} next Conteúdo que vai para o commit.
 */
export function shouldBumpDateModified(previous, next) {
  if (previous === null) return true;
  return bodyAfterFrontmatter(previous) !== bodyAfterFrontmatter(next);
}
