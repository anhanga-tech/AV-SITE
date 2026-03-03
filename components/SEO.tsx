import React, { useEffect } from 'react';

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
    const fullTitle = normalize(title).includes(normalize(siteName)) ? title : `${title} | ${siteName}`;

    const getCanonicalUrl = () => {
        if (canonical) return canonical;
        if (typeof window === 'undefined') return '';

        const url = new URL(window.location.href);

        const isBlogSubdomain = url.hostname.startsWith('blog.');
        const productionDomain = isBlogSubdomain ? (import.meta.env.VITE_BLOG_DOMAIN || 'blog.anhanga.tur.br') : (import.meta.env.VITE_SITE_DOMAIN || 'www.anhanga.tur.br');

        let pathname = url.pathname;

        if (isBlogSubdomain) {
            if (!pathname.endsWith('/')) {
                pathname += '/';
            }
        } else {
            if (pathname.length > 1 && pathname.endsWith('/')) {
                pathname = pathname.slice(0, -1);
            }
        }

        return `https://${productionDomain}${pathname}`;
    };

    const currentUrl = getCanonicalUrl();

    useEffect(() => {
        document.title = fullTitle;

        const setMeta = (attr: string, key: string, content: string) => {
            let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        setMeta('name', 'description', description);
        setMeta('name', 'keywords', keywords);
        setMeta('name', 'robots', robots);

        setMeta('property', 'og:type', type);
        setMeta('property', 'og:title', fullTitle);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:url', currentUrl);
        setMeta('property', 'og:image', image);
        setMeta('property', 'og:site_name', siteName);

        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', fullTitle);
        setMeta('name', 'twitter:description', description);
        setMeta('name', 'twitter:image', image);

        if (currentUrl) {
            let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', currentUrl);
        }
    }, [fullTitle, description, keywords, robots, type, currentUrl, image]);

    return null;
};
