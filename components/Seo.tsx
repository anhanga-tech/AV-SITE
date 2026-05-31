import React, { useEffect } from 'react';
import { useHeadTags } from '../lib/head';
import { DEFAULT_OG_IMAGE_URL } from '../lib/media-assets';

const DEFAULT_OG_IMAGE = DEFAULT_OG_IMAGE_URL;
const DEFAULT_OG_IMAGE_WIDTH = '1200';
const DEFAULT_OG_IMAGE_HEIGHT = '630';

const SITE_NAME = "Anhangá Viagens";

const normalizeStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normalizeCanonical(urlStr: string): string {
  try {
    const url = new URL(urlStr, 'https://www.anhanga.tur.br');
    url.protocol = 'https:';
    url.hostname = 'www.anhanga.tur.br';
    url.port = '';
    url.search = '';
    url.hash = '';
    if (!url.pathname.endsWith('/') && !url.pathname.includes('.')) {
      url.pathname += '/';
    }
    return url.toString();
  } catch (error) {
    console.error('[SEO] Failed to normalize canonical URL: "%s"', urlStr, error);
    return '';
  }
}

interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  imageWidth?: string;
  imageHeight?: string;
  type?: 'website' | 'article';
  robots?: string;
  /**
   * When true, suppresses hreflang link tags.
   * Use on dedicated landing pages that serve a single locale
   * to avoid redundant pt-BR + x-default signals on the same URL.
   */
  noHreflang?: boolean;
}

export const Seo: React.FC<SeoProps> = ({
  title = 'Anhangá Viagens | Agência de Viagens Personalizadas',
  description = 'Agência de viagens em São Paulo com roteiros personalizados, experiências no Brasil e no mundo e suporte especializado.',
  canonical,
  image = DEFAULT_OG_IMAGE,
  imageWidth,
  imageHeight,
  type = 'website',
  robots = 'index, follow',
  noHreflang = false
}) => {
  // Only emit og:image dimensions when accurate: explicit props or the known-sized default image.
  // Blog posts and other pages with third-party images of unknown sizes omit these tags.
  const resolvedImageWidth = imageWidth ?? (image === DEFAULT_OG_IMAGE ? DEFAULT_OG_IMAGE_WIDTH : undefined);
  const resolvedImageHeight = imageHeight ?? (image === DEFAULT_OG_IMAGE ? DEFAULT_OG_IMAGE_HEIGHT : undefined);

  const fullTitle = normalizeStr(title).includes(normalizeStr(SITE_NAME))
    ? title
    : `${title} | ${SITE_NAME}`;

  // Generate canonical URL
  let canonicalUrl = '';
  if (canonical) {
    canonicalUrl = normalizeCanonical(canonical);
  } else if (typeof window !== 'undefined') {
    canonicalUrl = normalizeCanonical(window.location.href);
  }

  useHeadTags([
    {
      tagName: 'title',
      key: 'title',
      textContent: fullTitle
    },
    {
      tagName: 'meta',
      key: 'meta:description',
      attrs: { name: 'description', content: description }
    },
    {
      tagName: 'meta',
      key: 'meta:robots',
      attrs: { name: 'robots', content: robots }
    },
    {
      tagName: 'meta',
      key: 'meta:og:type',
      attrs: { property: 'og:type', content: type }
    },
    {
      tagName: 'meta',
      key: 'meta:og:title',
      attrs: { property: 'og:title', content: fullTitle }
    },
    {
      tagName: 'meta',
      key: 'meta:og:description',
      attrs: { property: 'og:description', content: description }
    },
    {
      tagName: 'meta',
      key: 'meta:og:image',
      attrs: { property: 'og:image', content: image }
    },
    ...(resolvedImageWidth ? [{ tagName: 'meta' as const, key: 'meta:og:image:width', attrs: { property: 'og:image:width', content: resolvedImageWidth } }] : []),
    ...(resolvedImageHeight ? [{ tagName: 'meta' as const, key: 'meta:og:image:height', attrs: { property: 'og:image:height', content: resolvedImageHeight } }] : []),
    {
      tagName: 'meta',
      key: 'meta:og:site_name',
      attrs: { property: 'og:site_name', content: SITE_NAME }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:card',
      attrs: { name: 'twitter:card', content: 'summary_large_image' }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:title',
      attrs: { name: 'twitter:title', content: fullTitle }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:description',
      attrs: { name: 'twitter:description', content: description }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:image',
      attrs: { name: 'twitter:image', content: image }
    },
    ...(canonicalUrl
      ? [
          {
            tagName: 'link' as const,
            key: 'link:canonical',
            attrs: { rel: 'canonical', href: canonicalUrl }
          },
          ...(!noHreflang
            ? [
                {
                  tagName: 'link' as const,
                  key: 'link:hreflang:pt-BR',
                  attrs: { rel: 'alternate', hreflang: 'pt-BR', href: canonicalUrl }
                },
                {
                  tagName: 'link' as const,
                  key: 'link:hreflang:x-default',
                  attrs: { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl }
                }
              ]
            : []),
          {
            tagName: 'meta' as const,
            key: 'meta:og:url',
            attrs: { property: 'og:url', content: canonicalUrl }
          }
        ]
      : [])
  ]);

  // When noHreflang=true, remove static hreflang tags baked into index.html
  // that useHeadTags won't claim (since they're absent from the tags array).
  useEffect(() => {
    if (typeof document === 'undefined' || !noHreflang) return;
    for (const key of ['link:hreflang:pt-BR', 'link:hreflang:x-default']) {
      document.head.querySelector(`[data-av-head="${key}"]`)?.remove();
    }
  }, [noHreflang]);

  return null;
};
