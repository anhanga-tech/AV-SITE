const BLOG_BASE_URL = 'https://www.anhanga.tur.br/blog/';

export const getBlogHomeUrl = (): string => BLOG_BASE_URL;

// Trailing slash obrigatório: o Cloudflare Pages responde 308 para a versão sem barra,
// o que desperdiça link equity interno (auditoria Ahrefs jun/2026).
export const getBlogPostUrl = (slug: string): string => `${BLOG_BASE_URL}${slug}/`;

// Converte ISO 8601 (AAAA-MM-DD) para o padrão brasileiro DD/MM/AAAA.
// Usa parsing de string para evitar o bug de fuso horário do new Date().
export function formatDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

interface SearchablePost {
  title: string;
  category: string;
  tags: string[];
}

export interface BlogSearchEntry<T> {
  post: T;
  haystack: string;
}

// PERFORMANCE: precompute one lowercased "haystack" per post so the search box
// filter doesn't re-lowercase every title/category/tag on each keystroke.
// Fields are joined with "\n" so a term (which can never contain "\n" from an
// <input>) can only match within a single field — identical semantics to the
// previous per-field `.toLowerCase().includes()` / `tags.some()` checks.
export function buildBlogSearchIndex<T extends SearchablePost>(
  posts: readonly T[],
): BlogSearchEntry<T>[] {
  return posts.map((post) => ({
    post,
    haystack: `${post.title}\n${post.category}\n${post.tags.join('\n')}`.toLowerCase(),
  }));
}

// Filters a prebuilt index by a search term. An empty term is a fast path that
// returns every post without scanning any string.
export function filterBlogSearchIndex<T>(
  index: readonly BlogSearchEntry<T>[],
  rawTerm: string,
): T[] {
  const term = rawTerm.toLowerCase();
  if (!term) return index.map((entry) => entry.post);
  return index.filter((entry) => entry.haystack.includes(term)).map((entry) => entry.post);
}
