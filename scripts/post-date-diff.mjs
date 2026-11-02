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

// Mesmo critério de lib/blog-manifest.ts (readParsedPosts): todo .mdx de content/blog
// que não começa com `_`.
const isBlogSource = (file) => /^content\/blog\/[^/_][^/]*\.mdx$/.test(file);

/**
 * Posts do blog cujo conteúdo na árvore de trabalho difere do que vai para o commit:
 * edições fora do stage (`git add -p`, ou outro post nem adicionado) e arquivos não
 * rastreados. O hook reescreve a partir da árvore e faz `git add`, e o gerador lê TODOS
 * os MDX do diretório — então qualquer um desses entraria no commit, ao menos pelo corpo
 * embutido em data/blogMarkdown.ts, sem a pessoa ter posto no stage.
 *
 * @param {string[]} unstaged Saída de `git diff --name-only` (árvore vs. índice).
 * @param {string[]} untracked Saída de `git ls-files --others --exclude-standard`.
 */
export function blogSourcesOutsideStage(unstaged, untracked) {
  return [...new Set([...unstaged, ...untracked])].filter(isBlogSource).sort();
}

/**
 * @param {string | null} previous Conteúdo no HEAD; `null` quando o arquivo é novo.
 * @param {string} next Conteúdo que vai para o commit.
 */
export function shouldBumpDateModified(previous, next) {
  if (previous === null) return true;
  return bodyAfterFrontmatter(previous) !== bodyAfterFrontmatter(next);
}
