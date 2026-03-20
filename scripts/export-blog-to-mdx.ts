/**
 * Exporta os posts de data/blogData.ts para arquivos .mdx em content/blog/
 *
 * Uso: npx tsx scripts/export-blog-to-mdx.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BLOG_POSTS } from '../data/blogData';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Normaliza "12 Dez, 2025" → "2025-12-12"
const MESES: Record<string, string> = {
  'Jan': '01', 'Fev': '02', 'Mar': '03', 'Abr': '04',
  'Mai': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
  'Set': '09', 'Out': '10', 'Nov': '11', 'Dez': '12',
};

function parseDate(dateStr: string): string {
  const m = dateStr.match(/(\d+)\s+(\w+),?\s+(\d{4})/);
  if (!m) return dateStr;
  const [, day, mes, year] = m;
  const month = MESES[mes] ?? '01';
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

const outDir = join(ROOT, 'content', 'blog');
mkdirSync(outDir, { recursive: true });

let count = 0;

for (const post of BLOG_POSTS) {
  const date = parseDate(post.date);
  const author = post.authorId ?? 'equipe-anhanga';
  const featured = post.isFeatured ? 'true' : 'false';

  // Limpa indentação de template literal
  const content = (post.content ?? '').trim().replace(/^ {4,12}/gm, '');

  const frontmatter = [
    '---',
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${post.excerpt.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `author: "${author}"`,
    `category: "${post.category}"`,
    `image: "${post.image}"`,
    `featured: ${featured}`,
    `tags: []`,
    '---',
  ].join('\n');

  const mdx = `${frontmatter}\n\n${content}\n`;

  const outPath = join(outDir, `${post.slug}.mdx`);
  writeFileSync(outPath, mdx, 'utf-8');
  console.log(`✓ ${post.slug}.mdx`);
  count++;
}

console.log(`\n${count} arquivos criados em content/blog/`);
