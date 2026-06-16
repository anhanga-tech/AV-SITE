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
