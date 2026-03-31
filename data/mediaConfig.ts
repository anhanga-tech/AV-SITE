import { optimizeImageUrl, resolveMediaUrl } from '../lib/media-url.ts';

/**
 * Media Configuration - Centralized media assets management.
 *
 * The current migration target is Cloudflare R2 for origin storage and
 * Cloudflare image transformations via `/cdn-cgi/image/...` on the site zone.
 */

interface MediaEnv {
    VITE_MEDIA_BASE_URL?: string;
    VITE_MEDIA_CDN_URL?: string;
    VITE_MEDIA_TRANSFORM_ZONE_URL?: string;
    VITE_MEDIA_ENABLE_TRANSFORMS?: string;
}

const DEFAULT_MEDIA_BASE_URL = 'https://media.anhanga.tur.br';

function parseBooleanEnv(value?: string): boolean {
    if (!value) {
        return false;
    }

    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function getImportMetaEnv(): MediaEnv {
    if (typeof import.meta === 'undefined') {
        return {};
    }

    const candidate = import.meta as ImportMeta & { env?: MediaEnv };
    return candidate.env ?? {};
}

function getDefaultTransformZoneUrl(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '';
    }

    return origin;
}

function getMediaRuntimeConfig() {
    const env = getImportMetaEnv();
    return {
        mediaBaseUrl: env.VITE_MEDIA_BASE_URL || env.VITE_MEDIA_CDN_URL || DEFAULT_MEDIA_BASE_URL,
        transformZoneUrl: env.VITE_MEDIA_TRANSFORM_ZONE_URL || getDefaultTransformZoneUrl(),
        enableTransforms: parseBooleanEnv(env.VITE_MEDIA_ENABLE_TRANSFORMS),
    };
}

export const getMediaUrl = (path: string): string => {
    const { mediaBaseUrl } = getMediaRuntimeConfig();
    return resolveMediaUrl(path, mediaBaseUrl);
};

export const optimizeRemoteImageUrl = (
    rawUrl: string,
    width: number = 1200,
    height?: number
): string => {
    const { mediaBaseUrl, transformZoneUrl, enableTransforms } = getMediaRuntimeConfig();
    return optimizeImageUrl(rawUrl, {
        mediaBaseUrl,
        transformZoneUrl,
        enableTransforms,
        width,
        height,
    });
};

// =============================================================================
// HERO VIDEOS
// =============================================================================
export interface HeroVideo {
    id: number;
    url: string;
    poster: string;
    description: string;
}

export const HERO_VIDEOS: HeroVideo[] = [
    {
        id: 1,
        url: getMediaUrl('videos/hero/rio.mp4'),
        poster: getMediaUrl('images/hero/rio-poster.jpg'),
        description: "Rio de Janeiro / Tropical Brazil"
    },
    {
        id: 2,
        url: getMediaUrl('videos/hero/paris.mp4'),
        poster: getMediaUrl('images/hero/paris-poster.jpg'),
        description: "Paris / Europa"
    },
    {
        id: 3,
        url: getMediaUrl('videos/hero/maldivas.mp4'),
        poster: getMediaUrl('images/hero/maldivas-poster.jpg'),
        description: "Maldivas / Praia Paradisíaca"
    },
    {
        id: 4,
        url: getMediaUrl('videos/hero/new-york.mp4'),
        poster: getMediaUrl('images/hero/new-york-poster.jpg'),
        description: "New York / Urbano"
    },
    {
        id: 5,
        url: getMediaUrl('videos/hero/natureza.mp4'),
        poster: getMediaUrl('images/hero/natureza-poster.jpg'),
        description: "Natureza / Montanhas"
    }
];

// =============================================================================
// DESTINATION IMAGES
// =============================================================================
export interface DestinationMedia {
    image: string;
    thumbnail?: string; // Optional smaller version for cards
}

// Map of destination city names to their images
// This allows easy updating when migrating to CDN
export const DESTINATION_IMAGES: Record<string, DestinationMedia> = {
    // Americas
    "Orlando": {
        image: "https://images.pexels.com/photos/3411139/pexels-photo-3411139.jpeg",
    },
    "Punta Cana": {
        image: "https://images.pexels.com/photos/3675435/pexels-photo-3675435.jpeg",
    },
    "Cancún": {
        image: "https://images.pexels.com/photos/20210505/pexels-photo-20210505.jpeg",
    },
    "Gramado": {
        image: "https://images.pexels.com/photos/3101546/pexels-photo-3101546.jpeg",
    },
    "Rio de Janeiro": {
        image: "https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg",
    },
    "Natal": {
        image: "https://images.pexels.com/photos/4265480/pexels-photo-4265480.jpeg",
    },
    "Cusco": {
        image: "https://images.pexels.com/photos/35570962/pexels-photo-35570962.jpeg",
    },
    "Santiago": {
        image: "https://images.pexels.com/photos/7410250/pexels-photo-7410250.jpeg",
    },
    "Cartagena": {
        image: "https://images.pexels.com/photos/13804522/pexels-photo-13804522.jpeg",
    },

    // Europe
    "Paris": {
        image: "https://images.pexels.com/photos/1850619/pexels-photo-1850619.jpeg",
    },
    "Lisboa": {
        image: "https://images.pexels.com/photos/3763903/pexels-photo-3763903.jpeg",
    },
    "Santorini": {
        image: "https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg",
    },

    // Asia
    "Tóquio": {
        image: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg",
    },
    "Bali": {
        image: "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg",
    },
    "Dubai": {
        image: "https://images.pexels.com/photos/3769312/pexels-photo-3769312.jpeg",
    },
    "Bangkok": {
        image: "https://images.pexels.com/photos/1031659/pexels-photo-1031659.jpeg",
    },

    // Africa
    "Cidade do Cabo": {
        image: "https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg",
    },
    "Cairo": {
        image: "https://images.pexels.com/photos/3522880/pexels-photo-3522880.jpeg",
    },
    "Marrakech": {
        image: "https://images.pexels.com/photos/6752812/pexels-photo-6752812.jpeg",
    },

    // Oceania
    "Sydney": {
        image: "https://images.pexels.com/photos/2845013/pexels-photo-2845013.jpeg",
    },
    "Bora Bora": {
        image: "https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg",
    },
};

// Helper to get destination image with fallback
export const getDestinationImage = (city: string): string => {
    const media = DESTINATION_IMAGES[city];
    if (media) {
        return getMediaUrl(media.image);
    }
    // Fallback image
    return "https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg";
};

// =============================================================================
// IMAGE OPTIMIZATION HELPERS
// =============================================================================

/**
 * Backwards-compatible alias preserved for legacy call sites.
 */
export const optimizeCloudinaryUrl = (
    url: string,
    width: number = 800,
    format: 'auto' | 'webp' | 'avif' = 'auto'
): string => {
    void format;
    return optimizeRemoteImageUrl(url, width);
};

/**
 * Generate srcset for responsive images using the active media provider.
 */
export const generateSrcSet = (url: string, sizes: number[] = [400, 800, 1200]): string => {
    return sizes
        .map(size => `${optimizeRemoteImageUrl(url, size)} ${size}w`)
        .join(', ');
};
