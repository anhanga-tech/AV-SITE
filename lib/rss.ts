import { escapeXml } from './sitemap.ts';
import type { PostMeta } from '../types/blog';

const SITE_ORIGIN = 'https://www.anhanga.tur.br';

function toRfc822(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toUTCString();
}

export function renderRssFeed(posts: PostMeta[]): string {
  const items = posts.map((post) => {
    const link = `${SITE_ORIGIN}/blog/${post.slug}/`;
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${link}</link>`,
      `      <guid isPermaLink="true">${link}</guid>`,
      `      <pubDate>${toRfc822(post.date)}</pubDate>`,
      `      <description>${escapeXml(post.excerpt)}</description>`,
      post.category ? `      <category>${escapeXml(post.category)}</category>` : '',
      '    </item>'
    ].filter(Boolean).join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Blog Anhangá Viagens</title>',
    `    <link>${SITE_ORIGIN}/blog/</link>`,
    '    <description>Guias práticos de viagem para brasileiros: destinos, documentação, seguros, festivais, parques e roteiros personalizados.</description>',
    '    <language>pt-BR</language>',
    `    <atom:link href="${SITE_ORIGIN}/feed.xml" rel="self" type="application/rss+xml"/>`,
    `    <lastBuildDate>${posts.length ? toRfc822(posts[0].dateModified ?? posts[0].date) : new Date().toUTCString()}</lastBuildDate>`,
    ...items,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
}
