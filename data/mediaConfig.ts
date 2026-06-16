import { optimizeImageUrl, resolveMediaUrl } from '../lib/media-url.ts';

/**
 * Media Configuration - Centralized media assets management.
 *
 * The current migration target is Cloudflare R2 for origin storage and
 * Cloudflare image transformations via `/cdn-cgi/image/...` on the media zone.
 */

interface MediaEnv {
    VITE_MEDIA_BASE_URL?: string;
    VITE_MEDIA_CDN_URL?: string;
    VITE_MEDIA_TRANSFORM_ZONE_URL?: string;
    VITE_MEDIA_ENABLE_TRANSFORMS?: string;
}

interface RuntimeLocation {
    hostname: string;
    origin: string;
}

interface MediaRuntimeConfig {
    mediaBaseUrl: string;
    transformZoneUrl: string;
    enableTransforms: boolean;
}

const DEFAULT_MEDIA_BASE_URL = 'https://media.anhanga.tur.br';

function parseBooleanEnv(value?: string): boolean {
    if (!value) {
        return false;
    }

    const normalized = value.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function getImportMetaEnv(): MediaEnv {
    if (typeof import.meta === 'undefined') {
        return {};
    }

    const viteEnv = (import.meta as ImportMeta & { env?: MediaEnv }).env;

    return {
        VITE_MEDIA_BASE_URL: viteEnv && import.meta.env.VITE_MEDIA_BASE_URL,
        VITE_MEDIA_CDN_URL: viteEnv && import.meta.env.VITE_MEDIA_CDN_URL,
        VITE_MEDIA_TRANSFORM_ZONE_URL: viteEnv && import.meta.env.VITE_MEDIA_TRANSFORM_ZONE_URL,
        VITE_MEDIA_ENABLE_TRANSFORMS: viteEnv && import.meta.env.VITE_MEDIA_ENABLE_TRANSFORMS,
    };
}

function getDefaultTransformZoneUrl(location?: RuntimeLocation): string {
    if (!location) {
        return '';
    }

    const { hostname, origin } = location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '';
    }

    return origin;
}

function getRuntimeLocation(): RuntimeLocation | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return {
        hostname: window.location.hostname,
        origin: window.location.origin,
    };
}

let cachedConfig: MediaRuntimeConfig | null = null;

/**
 * Retrieves the current media configuration, optionally overriding environment or location.
 * PERFORMANCE: Results for the default call (no arguments) are memoized to avoid
 * redundant lookups of environment variables and window location.
 */
export function getMediaRuntimeConfig(
    env?: MediaEnv,
    location?: RuntimeLocation,
): MediaRuntimeConfig {
    if (!env && !location && cachedConfig) {
        return cachedConfig;
    }

    const resolvedEnv = env ?? getImportMetaEnv();
    const resolvedLocation = location ?? getRuntimeLocation();

    const mediaBaseUrl = resolvedEnv.VITE_MEDIA_BASE_URL || resolvedEnv.VITE_MEDIA_CDN_URL || DEFAULT_MEDIA_BASE_URL;
    const enableTransforms = parseBooleanEnv(resolvedEnv.VITE_MEDIA_ENABLE_TRANSFORMS);

    const config = {
        mediaBaseUrl,
        transformZoneUrl: resolvedEnv.VITE_MEDIA_TRANSFORM_ZONE_URL || (enableTransforms ? mediaBaseUrl : getDefaultTransformZoneUrl(resolvedLocation)),
        enableTransforms,
    };

    if (!env && !location) {
        cachedConfig = config;
    }

    return config;
}

export const getMediaUrl = (path: string): string => {
    const { mediaBaseUrl } = getMediaRuntimeConfig();
    return resolveMediaUrl(path, mediaBaseUrl);
};

export const optimizeRemoteImageUrl = (
    rawUrl: string,
    width: number = 1200,
    height?: number,
    format?: 'auto' | 'avif' | 'webp',
): string => {
    const { mediaBaseUrl, transformZoneUrl, enableTransforms } = getMediaRuntimeConfig();
    return optimizeImageUrl(rawUrl, {
        mediaBaseUrl,
        transformZoneUrl,
        enableTransforms,
        width,
        height,
        format,
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
const DESTINATION_IMAGES: Record<string, DestinationMedia> = {
    // Americas
    "Orlando": {
        image: "images/destinations/orlando.jpg",
    },
    "Punta Cana": {
        image: "images/destinations/punta-cana.jpg",
    },
    "Cancún": {
        image: "images/destinations/cancun.jpg",
    },
    "Beto Carrero": {
        image: "images/destinations/beto-carrero.jpg",
    },
    "Gramado": {
        image: "images/destinations/gramado.jpg",
    },
    "Rio de Janeiro": {
        image: "images/destinations/rio-de-janeiro.jpg",
    },
    "Natal": {
        image: "images/destinations/natal.jpg",
    },
    "Cusco": {
        image: "images/destinations/cusco.jpg",
    },
    "Santiago": {
        image: "images/destinations/santiago.jpg",
    },
    "Cartagena": {
        image: "images/destinations/cartagena.jpg",
    },

    // Europe
    "Paris": {
        image: "images/destinations/paris.jpg",
    },
    "Lisboa": {
        image: "images/destinations/lisboa.jpg",
    },
    "Santorini": {
        image: "images/destinations/santorini.jpg",
    },

    // Asia
    "Tóquio": {
        image: "images/destinations/toquio.jpg",
    },
    "Bali": {
        image: "images/destinations/bali.jpg",
    },
    "Dubai": {
        image: "images/destinations/dubai.jpg",
    },
    "Bangkok": {
        image: "images/destinations/bangkok.jpg",
    },

    // Africa
    "Cidade do Cabo": {
        image: "images/destinations/cidade-do-cabo.jpg",
    },
    "Cairo": {
        image: "images/destinations/cairo.jpg",
    },
    "Marrakech": {
        image: "images/destinations/marrakech.jpg",
    },

    // Oceania
    "Sydney": {
        image: "images/destinations/sydney.jpg",
    },
    "Bora Bora": {
        image: "images/destinations/bora-bora.jpg",
    },
};

// Helper to get destination image with fallback
export const getDestinationImage = (city: string): string => {
    const media = DESTINATION_IMAGES[city];
    if (media) {
        return getMediaUrl(media.image);
    }
    // Fallback image
    return getMediaUrl('images/destinations/santorini.jpg');
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
    format: 'auto' | 'webp' | 'avif' = 'auto',
): string => optimizeRemoteImageUrl(url, width, undefined, format);

/**
 * Generate srcset for responsive images using the active media provider.
 */
export const generateSrcSet = (url: string, sizes: number[] = [400, 800, 1200]): string => {
    return sizes
        .map(size => `${optimizeRemoteImageUrl(url, size)} ${size}w`)
        .join(', ');
};

/**
 * Generate an AVIF srcset for use inside a <picture> <source> element.
 * Returns an empty string when Cloudflare transforms are not enabled, preventing
 * browsers from requesting JPEG/PNG origins with type="image/avif".
 */
export const generateAvifSrcSet = (url: string, sizes: number[] = [400, 800, 1200]): string => {
    const entries = sizes.flatMap(size => {
        const formatted = optimizeRemoteImageUrl(url, size, undefined, 'avif');
        const unformatted = optimizeRemoteImageUrl(url, size);
        return formatted !== unformatted ? [`${formatted} ${size}w`] : [];
    });
    return entries.join(', ');
};

/**
 * Generate a WebP srcset for use inside a <picture> <source> element.
 * Returns an empty string when Cloudflare transforms are not enabled, preventing
 * browsers from requesting JPEG/PNG origins with type="image/webp".
 */
export const generateWebpSrcSet = (url: string, sizes: number[] = [400, 800, 1200]): string => {
    const entries = sizes.flatMap(size => {
        const formatted = optimizeRemoteImageUrl(url, size, undefined, 'webp');
        const unformatted = optimizeRemoteImageUrl(url, size);
        return formatted !== unformatted ? [`${formatted} ${size}w`] : [];
    });
    return entries.join(', ');
};
