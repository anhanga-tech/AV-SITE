import path from 'node:path';
import matter from 'gray-matter';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import type { BlogPostFrontmatter, PostMeta } from '../types/blog';
import { resolveMediaUrl } from './media-url.ts';
import { isFuturePost, shouldHideFuturePosts, todayInSaoPaulo } from './blog-schedule.js';

// Opções de agendamento compartilhadas pelo manifest e pelo módulo markdown.
// Os defaults vêm do ambiente (ver lib/blog-schedule.js); os testes injetam
// valores fixos para não depender do relógio nem de process.env.
export interface BlogScheduleOptions {
  hideFuture?: boolean;
  today?: string;
}

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

function toPostMeta(filepath: string, parsed: ReturnType<typeof matter>): PostMeta {
  const { data, content } = parsed;
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

// Single readdir + readFile + gray-matter pass over the blog directory, shared by
// every function below. Parsing frontmatter (YAML) is the expensive part of this
// step, so callers that need both the manifest and the markdown export must reuse
// one pass instead of each re-reading and re-parsing every post from disk.
async function readParsedPosts(
  blogDir: string
): Promise<Array<{ filepath: string; parsed: ReturnType<typeof matter> }>> {
  const filenames = await readdir(blogDir);

  return Promise.all(
    filenames
      .filter((filename) => filename.endsWith('.mdx') && !filename.startsWith('_'))
      .map(async (filename) => {
        const filepath = path.join(blogDir, filename);
        const rawContent = await readFile(filepath, 'utf8');
        return { filepath, parsed: matter(rawContent) };
      })
  );
}

function sortPostMeta(posts: PostMeta[]): PostMeta[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export async function collectBlogPostMeta(
  blogDir: string,
  options: BlogScheduleOptions = {}
): Promise<PostMeta[]> {
  const { hideFuture = shouldHideFuturePosts(), today = todayInSaoPaulo() } = options;
  const entries = await readParsedPosts(blogDir);
  const posts = entries.map(({ filepath, parsed }) => toPostMeta(filepath, parsed));
  const published = hideFuture ? posts.filter((post) => !isFuturePost(post.date, today)) : posts;

  return sortPostMeta(published);
}

function serializeBlogPostMeta(posts: PostMeta[]): string {
  return `import type { PostMeta } from '../types/blog';

export const BLOG_POST_MANIFEST: PostMeta[] = ${JSON.stringify(posts, null, 2)};
`;
}

// Versão markdown dos posts para consumo por LLMs/agentes via /api/markdown.
// Gerada em módulo separado do manifest para não inflar o bundle do cliente —
// apenas a edge function importa este arquivo.
function toPostMarkdown(meta: PostMeta, content: string): string {
  const header = [
    `# ${meta.title}`,
    '',
    `**Publicado em:** ${meta.date}${meta.dateModified ? ` (atualizado em ${meta.dateModified})` : ''}`,
    `**Categoria:** ${meta.category}`,
    `**URL:** https://www.anhanga.tur.br/blog/${meta.slug}/`,
    '',
    meta.excerpt,
    '',
  ].join('\n');

  return `${header}\n${content.trim()}\n`;
}

function serializeBlogPostMarkdown(entries: Record<string, string>): string {
  return `// Gerado por scripts/generate-blog-manifest.ts — não editar manualmente.
export const BLOG_POST_MARKDOWN: Record<string, string> = ${JSON.stringify(entries, null, 2)};
`;
}

function buildMarkdownEntries(
  published: Array<{ meta: PostMeta; content: string }>
): Record<string, string> {
  return Object.fromEntries(
    published.map(({ meta, content }) => [meta.slug, toPostMarkdown(meta, content)] as const)
  );
}

export async function writeBlogMarkdown(
  blogDir: string,
  outputFile: string,
  options: BlogScheduleOptions = {}
): Promise<number> {
  const { hideFuture = shouldHideFuturePosts(), today = todayInSaoPaulo() } = options;
  const entries = await readParsedPosts(blogDir);
  const posts = entries.map(({ filepath, parsed }) => ({
    meta: toPostMeta(filepath, parsed),
    content: parsed.content,
  }));
  const published = hideFuture ? posts.filter(({ meta }) => !isFuturePost(meta.date, today)) : posts;

  const markdownEntries = buildMarkdownEntries(published);

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, serializeBlogPostMarkdown(markdownEntries), 'utf8');

  return Object.keys(markdownEntries).length;
}

// Generates both build artifacts (manifest + markdown export) from a single parse
// pass. scripts/generate-blog-manifest.ts uses this so the two outputs share one
// readdir/readFile/matter pass over the posts instead of each parsing every post's
// frontmatter separately — this step runs before every `pnpm dev`, `pnpm build`,
// `pnpm typecheck` and `pnpm test:regression`. writeBlogMarkdown stays as-is for
// standalone/test use.
export async function writeBlogArtifacts(
  blogDir: string,
  manifestOutputFile: string,
  markdownOutputFile: string,
  options: BlogScheduleOptions = {}
): Promise<{ posts: PostMeta[]; markdownCount: number }> {
  const { hideFuture = shouldHideFuturePosts(), today = todayInSaoPaulo() } = options;
  const entries = await readParsedPosts(blogDir);
  const posts = entries.map(({ filepath, parsed }) => ({
    meta: toPostMeta(filepath, parsed),
    content: parsed.content,
  }));
  const published = hideFuture ? posts.filter(({ meta }) => !isFuturePost(meta.date, today)) : posts;

  const manifestPosts = sortPostMeta(published.map(({ meta }) => meta));
  const markdownEntries = buildMarkdownEntries(published);

  await Promise.all([
    mkdir(path.dirname(manifestOutputFile), { recursive: true }),
    mkdir(path.dirname(markdownOutputFile), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(manifestOutputFile, serializeBlogPostMeta(manifestPosts), 'utf8'),
    writeFile(markdownOutputFile, serializeBlogPostMarkdown(markdownEntries), 'utf8'),
  ]);

  return { posts: manifestPosts, markdownCount: Object.keys(markdownEntries).length };
}
