import path from 'node:path';
import matter from 'gray-matter';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import type { BlogPostFrontmatter, PostMeta } from '../types/blog';
import { resolveMediaUrl } from './media-url.ts';

const DEFAULT_SITE_BASE_URL = process.env.SITE_URL || 'https://www.anhanga.tur.br';
const DEFAULT_MEDIA_BASE_URL =
  process.env.VITE_MEDIA_BASE_URL ||
  process.env.VITE_MEDIA_CDN_URL ||
  'https://media.anhanga.tur.br';

function calcReadingTime(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).length / 200);
}

function normalizeTags(tags: BlogPostFrontmatter['tags']): string[] {
  return Array.isArray(tags) ? tags : [];
}

function normalizeFrontmatterDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    return value.trim() ? value : undefined;
  }

  return undefined;
}

// The generated manifest is consumed as static data during build/prerender.
// It intentionally materializes absolute image URLs here instead of relying on
// runtime media helpers that component-facing modules such as blogData/LazyImage
// apply in the browser.
function normalizePostImageUrl(image: string): string {
  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  if (image.startsWith('/')) {
    return new URL(image, `${DEFAULT_SITE_BASE_URL.replace(/\/+$/, '')}/`).toString();
  }

  return resolveMediaUrl(image, DEFAULT_MEDIA_BASE_URL);
}

function toPostMeta(filepath: string, rawContent: string): PostMeta {
  const { data, content } = matter(rawContent);
  const slug = path.basename(filepath, '.mdx');
  const frontmatter = data as BlogPostFrontmatter;
  const dateModified = normalizeFrontmatterDate(frontmatter.dateModified);

  return {
    ...frontmatter,
    date: normalizeFrontmatterDate(frontmatter.date) ?? '',
    ...(dateModified ? { dateModified } : {}),
    image: normalizePostImageUrl(frontmatter.image),
    tags: normalizeTags(frontmatter.tags),
    slug,
    readingTime: `${calcReadingTime(content)} min de leitura`,
  };
}

export async function collectBlogPostMeta(blogDir: string): Promise<PostMeta[]> {
  const filenames = await readdir(blogDir);

  const posts = await Promise.all(
    filenames.flatMap((filename) => {
      if (!filename.endsWith('.mdx') || filename.startsWith('_')) return [];
      const filepath = path.join(blogDir, filename);
      return [readFile(filepath, 'utf8').then((rawContent) => toPostMeta(filepath, rawContent))];
    })
  );

  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

function serializeBlogPostMeta(posts: PostMeta[]): string {
  return `import type { PostMeta } from '../types/blog';

export const BLOG_POST_MANIFEST: PostMeta[] = ${JSON.stringify(posts, null, 2)};
`;
}

export async function writeBlogManifest(blogDir: string, outputFile: string): Promise<PostMeta[]> {
  const [posts] = await Promise.all([
    collectBlogPostMeta(blogDir),
    mkdir(path.dirname(outputFile), { recursive: true }),
  ]);

  await writeFile(outputFile, serializeBlogPostMeta(posts), 'utf8');

  return posts;
}
