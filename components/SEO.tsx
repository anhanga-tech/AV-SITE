import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string;
  robots?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Anhangá Viagens | Agência de Viagens Personalizadas',
  description = 'Agência de viagens boutique em São Paulo com roteiros personalizados, experiências no Brasil e no mundo e suporte especializado.',
  canonical,
  image = 'https://www.anhanga.tur.br/og-image-1200x630.jpg',
  type = 'website',
  keywords = 'agência de viagens em São Paulo, viagens personalizadas, pacotes para Orlando, pacote Beto Carrero, viagem Lollapalooza 2026, viagens melhor idade 50+, roteiros exclusivos',
  robots = 'index, follow'
}) => {
  const siteName = "Anhangá Viagens";
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Ensure title has the site name suffix if it doesn't already
  const fullTitle = normalize(title).includes(normalize(siteName))
    ? title
    : `${title} | ${siteName}`;

  // Helper to normalize canonical URLs
  const normalizeCanonical = (urlStr: string): string => {
    try {
      const url = new URL(urlStr, 'https://www.anhanga.tur.br');

      // Force production hostname and protocol
      url.protocol = 'https:';
      if (url.hostname !== 'blog.anhanga.tur.br') {
        url.hostname = 'www.anhanga.tur.br';
      }
      url.port = ''; // Remove port (dev/preview servers)

      // Strip query parameters and hash to prevent duplicate content
      url.search = '';
      url.hash = '';

      // Normalize trailing slash on pathname (only for extension-less paths)
      if (!url.pathname.endsWith('/') && !url.pathname.includes('.')) {
        url.pathname += '/';
      }

      return url.toString();
    } catch (error) {
      console.error('[SEO] Failed to normalize canonical URL: "%s"', urlStr, error);
      return '';
    }
  };

  // Generate canonical URL
  let canonicalUrl = '';
  if (canonical) {
    canonicalUrl = normalizeCanonical(canonical);
  } else if (typeof window !== 'undefined') {
    canonicalUrl = normalizeCanonical(window.location.href);
  }

  return (
    <>
      <title suppressHydrationWarning>{fullTitle}</title>
      <meta name="description" content={description} suppressHydrationWarning />
      <meta name="keywords" content={keywords} suppressHydrationWarning />
      {canonicalUrl && (
        <>
          <link rel="canonical" href={canonicalUrl} suppressHydrationWarning />
          <link rel="alternate" hreflang="pt-BR" href={canonicalUrl} suppressHydrationWarning />
          <link rel="alternate" hreflang="x-default" href={canonicalUrl} suppressHydrationWarning />
        </>
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} suppressHydrationWarning />
      <meta property="og:title" content={fullTitle} suppressHydrationWarning />
      <meta property="og:description" content={description} suppressHydrationWarning />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} suppressHydrationWarning />}
      <meta property="og:image" content={image} suppressHydrationWarning />
      <meta property="og:site_name" content={siteName} suppressHydrationWarning />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" suppressHydrationWarning />
      <meta name="twitter:title" content={fullTitle} suppressHydrationWarning />
      <meta name="twitter:description" content={description} suppressHydrationWarning />
      <meta name="twitter:image" content={image} suppressHydrationWarning />

      {/* Robots */}
      <meta name="robots" content={robots} suppressHydrationWarning />
    </>
  );
};
