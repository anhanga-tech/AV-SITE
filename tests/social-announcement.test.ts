import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlogAnnouncementPayload, isFrontmatterLike } from '../lib/social-announcement.ts';
import type { BlogPostFrontmatter } from '../types/blog';

const baseFrontmatter: BlogPostFrontmatter = {
  title: '5 Segredos da Disney que Ninguém Conta',
  excerpt: 'Descubra como furar filas legalmente.',
  date: '2025-12-12',
  author: 'queila-oliveira',
  category: 'Dicas de Expert',
  image: 'https://media.anhanga.tur.br/images/blog/5-segredos-disney.jpg',
  tags: ['disney', 'orlando'],
};

test('buildBlogAnnouncementPayload builds the announcement shape from frontmatter', () => {
  const payload = buildBlogAnnouncementPayload('5-segredos-da-disney-que-ninguem-conta', baseFrontmatter);

  assert.deepEqual(payload, {
    event: 'blog_post_published',
    slug: '5-segredos-da-disney-que-ninguem-conta',
    title: '5 Segredos da Disney que Ninguém Conta',
    excerpt: 'Descubra como furar filas legalmente.',
    url: 'https://www.anhanga.tur.br/blog/5-segredos-da-disney-que-ninguem-conta/',
    image: 'https://media.anhanga.tur.br/images/blog/5-segredos-disney.jpg',
    category: 'Dicas de Expert',
    tags: ['disney', 'orlando'],
    publishedAt: '2025-12-12',
  });
});

test('buildBlogAnnouncementPayload trims title/excerpt whitespace', () => {
  const payload = buildBlogAnnouncementPayload('slug', {
    ...baseFrontmatter,
    title: '  Título com espaços  ',
    excerpt: '  Resumo com espaços  ',
  });

  assert.equal(payload.title, 'Título com espaços');
  assert.equal(payload.excerpt, 'Resumo com espaços');
});

test('buildBlogAnnouncementPayload drops non-string tags and defaults missing tags to an empty array', () => {
  const withoutTags = buildBlogAnnouncementPayload('slug', { ...baseFrontmatter, tags: undefined });
  assert.deepEqual(withoutTags.tags, []);

  const withMessyTags = buildBlogAnnouncementPayload('slug', {
    ...baseFrontmatter,
    tags: ['disney', '', '  ', 42 as unknown as string],
  });
  assert.deepEqual(withMessyTags.tags, ['disney']);
});

test('buildBlogAnnouncementPayload respects a custom site base URL', () => {
  const payload = buildBlogAnnouncementPayload('slug', baseFrontmatter, 'https://staging.anhanga.tur.br');
  assert.equal(payload.url, 'https://staging.anhanga.tur.br/blog/slug/');
});

test('buildBlogAnnouncementPayload falls back to empty strings for missing optional fields', () => {
  const sparse = {
    ...baseFrontmatter,
    title: undefined,
    excerpt: undefined,
    image: undefined,
    category: undefined,
    date: undefined,
  } as unknown as BlogPostFrontmatter;

  const payload = buildBlogAnnouncementPayload('slug', sparse);

  assert.equal(payload.title, '');
  assert.equal(payload.excerpt, '');
  assert.equal(payload.image, '');
  assert.equal(payload.category, '');
  assert.equal(payload.publishedAt, '');
});

test('isFrontmatterLike accepts objects and rejects null/scalars', () => {
  assert.equal(isFrontmatterLike(baseFrontmatter), true);
  assert.equal(isFrontmatterLike({}), true);
  assert.equal(isFrontmatterLike(null), false);
  assert.equal(isFrontmatterLike(undefined), false);
  assert.equal(isFrontmatterLike('not an object'), false);
  assert.equal(isFrontmatterLike(42), false);
});
