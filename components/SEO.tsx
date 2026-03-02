import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    image?: string;
    type?: 'website' | 'article';
    keywords?: string;
    robots?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    canonical,
    image = 'https://www.anhanga.tur.br/og-image-1200x630.jpg',
    type = 'website',
    keywords = 'viagens personalizadas, agência viagens São Paulo, Lollapalooza 2026, Rock in Rio, The Town, viagens melhor idade, turismo 50+, Disney Orlando, roteiros transformação',
    robots = 'index, follow'
}) => {
    const siteName = "Anhangá Viagens";
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fullTitle = normalize(title).includes(normalize(siteName)) ? title : `${title} | ${siteName}`;

    // Normalization logic for canonical URL
    const getCanonicalUrl = () => {
        if (canonical) return canonical;
        if (typeof window === 'undefined') return '';

        const url = new URL(window.location.href);

        // Detect subdomain to maintain consistency across main site and blog
        const isBlogSubdomain = url.hostname.startsWith('blog.');
        const productionDomain = isBlogSubdomain ? 'blog.anhanga.tur.br' : 'www.anhanga.tur.br';

        // Normalization rules:
        // 1. Main site (www): Remove trailing slash for subpaths (standard for SPAs)
        // 2. Blog site (blog): Keep/ensure trailing slash (standard for blog platforms/SEO)
        let pathname = url.pathname;

        if (isBlogSubdomain) {
            // Ensure trailing slash for blog
            if (!pathname.endsWith('/')) {
                pathname += '/';
            }
        } else {
            // Remove trailing slash for main site subpaths
            if (pathname.length > 1 && pathname.endsWith('/')) {
                pathname = pathname.slice(0, -1);
            }
        }

        return `https://${productionDomain}${pathname}`;
    };

    const currentUrl = getCanonicalUrl();

    return (
        <Helmet defer={false}>
            {/* Standard Metadata */}
            <link rel="canonical" href={currentUrl} />
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            
            {/* Robots */}
            <meta name="robots" content={robots} />
        </Helmet>
    );
};
