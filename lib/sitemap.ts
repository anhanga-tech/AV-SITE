interface SitemapImage {
  loc: string;
  caption?: string | null;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string | null;
  changefreq?: string | null;
  priority?: string | null;
  images?: SitemapImage[];
}

export function escapeXml(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function requireText(value: string | null | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`Missing required sitemap field: ${fieldName}`);
  }

  return value;
}

export function renderSitemapEntry(entry: SitemapEntry): string {
  const images = entry.images ?? [];
  const imageXml = images
    .map((image) => {
      const imageLines = [
        '    <image:image>',
        `      <image:loc>${escapeXml(requireText(image.loc, 'image.loc'))}</image:loc>`
      ];

      if (image.caption) {
        imageLines.push(`      <image:caption>${escapeXml(image.caption)}</image:caption>`);
      }

      imageLines.push('    </image:image>');

      return imageLines.join('\n');
    })
    .join('\n');

  return [
    '  <url>',
    `    <loc>${escapeXml(requireText(entry.loc, 'loc'))}</loc>`,
    entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '',
    entry.changefreq ? `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>` : '',
    entry.priority ? `    <priority>${escapeXml(entry.priority)}</priority>` : '',
    imageXml,
    '  </url>'
  ].filter(Boolean).join('\n');
}

export function renderSitemap(entries: SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries.map(renderSitemapEntry),
    '</urlset>',
    ''
  ].join('\n');
}
