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
 * @param {string | null} previous Conteúdo no HEAD; `null` quando o arquivo é novo.
 * @param {string} next Conteúdo que vai para o commit.
 */
export function shouldBumpDateModified(previous, next) {
  if (previous === null) return true;
  return bodyAfterFrontmatter(previous) !== bodyAfterFrontmatter(next);
}
