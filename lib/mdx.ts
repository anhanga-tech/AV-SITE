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

export type PostMeta = BlogPostFrontmatter & {
  rawSlug: string;     // derivado do filename, ex: "dicas-disney-2026"
  readingTime: string; // ex: "4 min de leitura"
};

export function getAllPosts(): PostMeta[] {
  return Object.entries(postFiles)
    .map(([filepath, rawContent]) => {
      const { data, content } = matter(rawContent);
      const rawSlug = filepath.split('/').pop()?.replace('.mdx', '') ?? '';
      const rt = readingTime(content);
      return {
        ...(data as BlogPostFrontmatter),
        rawSlug,
        readingTime: rt.text.replace('read', 'de leitura'),
      };
    })
    .filter(post => !post.rawSlug.startsWith('_')) // ignora _template e _rascunhos
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): string | null {
  const key = `/content/blog/${slug}.mdx`;
  return postFiles[key] ?? null;
}
