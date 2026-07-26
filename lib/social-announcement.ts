/**
 * Pure payload-building for the "novo post no blog" social announcement
 * webhook. `scripts/notify-blog-published.ts` is the only caller today; kept
 * here (rather than inline in the script) so the shaping logic is unit
 * testable without touching the filesystem or network.
 *
 * TODO(dead code): the n8n workflow on the receiving end was never built —
 * blog social announcements are now scheduled by hand via Postiz (see
 * conversation from 2026-07-26). Delete this file together with
 * `scripts/notify-blog-published.ts`,
 * `.github/workflows/notify-social-automation.yml`,
 * `docs/ops/social-automation.md`, and their tests
 * (`tests/social-announcement.test.ts`,
 * `tests/notify-blog-published.test.ts`,
 * `tests/notify-social-automation-workflow.test.ts`).
 */
import type { BlogPostFrontmatter } from '../types/blog';

const DEFAULT_SITE_BASE_URL = 'https://www.anhanga.tur.br';

export interface SocialAnnouncementPayload {
  event: 'blog_post_published';
  slug: string;
  title: string;
  excerpt: string;
  url: string;
  image: string;
  category: string;
  tags: string[];
  publishedAt: string;
}

function normalizeTags(tags: BlogPostFrontmatter['tags']): string[] {
  return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0) : [];
}

/**
 * Frontmatter comes from a dynamically parsed MDX file, so required fields
 * aren't guaranteed at runtime even though the type says they are. This guard
 * only confirms gray-matter handed back an object (not `null`/a scalar) —
 * `scripts/notify-blog-published.ts` uses it instead of an unchecked `as` cast
 * before calling `buildBlogAnnouncementPayload`, which itself falls back to
 * `''` for any individual missing field below.
 */
export function isFrontmatterLike(value: unknown): value is BlogPostFrontmatter {
  return typeof value === 'object' && value !== null;
}

export function buildBlogAnnouncementPayload(
  slug: string,
  frontmatter: BlogPostFrontmatter,
  siteBaseUrl: string = DEFAULT_SITE_BASE_URL,
): SocialAnnouncementPayload {
  return {
    event: 'blog_post_published',
    slug,
    title: frontmatter.title?.trim() ?? '',
    excerpt: frontmatter.excerpt?.trim() ?? '',
    url: new URL(`/blog/${slug}/`, siteBaseUrl).toString(),
    image: frontmatter.image ?? '',
    category: frontmatter.category ?? '',
    tags: normalizeTags(frontmatter.tags),
    publishedAt: frontmatter.date ?? '',
  };
}
