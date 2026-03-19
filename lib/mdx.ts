import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { BlogPostFrontmatter } from '../types/blog';

// Vite glob — importa todos os MDX como string raw para extrair frontmatter
// eager: true = processado em build time, não lazy
const postFiles = import.meta.glob('/content/blog/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export type PostMeta = Omit<BlogPostFrontmatter, 'tags'> & {
  tags: string[];      // normalizado: nunca undefined
  slug: string;        // derivado do filename, ex: "dicas-disney-2026"
  readingTime: string; // ex: "4 min de leitura"
};

export function getAllPosts(): PostMeta[] {
  return Object.entries(postFiles)
    .filter(([filepath]) => !filepath.split('/').pop()?.startsWith('_')) // ignora _template e _rascunhos
    .map(([filepath, rawContent]) => {
      const { data, content } = matter(rawContent);
      const slug = filepath.split('/').pop()?.replace('.mdx', '') ?? '';
      const rt = readingTime(content);
      const fm = data as BlogPostFrontmatter;
      return {
        ...fm,
        tags: fm.tags ?? [],
        slug,
        readingTime: `${Math.ceil(rt.minutes)} min de leitura`,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // ISO 8601 ordena corretamente como string
}

export function getPostBySlug(slug: string): string | null {
  const key = `/content/blog/${slug}.mdx`;
  return postFiles[key] ?? null;
}
