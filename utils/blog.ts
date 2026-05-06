export const BLOG_BASE_URL = 'https://www.anhanga.tur.br/blog/';

export const getBlogHomeUrl = (): string => BLOG_BASE_URL;

export const getBlogPostUrl = (slug: string): string => `${BLOG_BASE_URL}${slug}`;

// Converte ISO 8601 (AAAA-MM-DD) para o padrão brasileiro DD/MM/AAAA.
// Usa parsing de string para evitar o bug de fuso horário do new Date().
export function formatDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
