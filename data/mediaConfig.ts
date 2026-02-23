/**
 * Media Configuration - Centralized media assets management
 *
 * MIGRATION TO CDN:
 * 1. Upload all videos/images to your CDN (Cloudinary, Vercel Blob, AWS S3, etc.)
 * 2. Update the URLs below to point to your CDN
 * 3. For Cloudinary, you can use transformations for automatic optimization:
 *    - Videos: Add '/q_auto,f_auto/' to the URL
 *    - Images: Add '/w_800,q_auto,f_auto/' for responsive optimization
 *
 * RECOMMENDED CDN SERVICES:
 * - Cloudinary (https://cloudinary.com) - Best for image/video transformations
 * - Vercel Blob (https://vercel.com/docs/storage/vercel-blob) - Simple, integrated with Vercel
 * - Bunny CDN (https://bunny.net) - Cost-effective
 * - AWS CloudFront + S3 - Enterprise-grade
 */

// Base URL for media assets - change this when migrating to CDN
const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_CDN_URL || '';

// Helper function to construct media URLs
export const getMediaUrl = (path: string): string => {
    if (path.startsWith('http')) {
        // Already an absolute URL (e.g., from Pexels)
        return path;
    }
    return `${MEDIA_BASE_URL}${path}`;
};

/**
 * Optimize remote image URLs to reduce transfer size.
 * - Pexels: use built-in compression and constrained dimensions
 * - Other remote hosts: use wsrv.nl proxy to convert/compress as WebP
 */
export const optimizeRemoteImageUrl = (
    rawUrl: string,
    width: number = 1200,
    height?: number
): string => {
    if (!rawUrl || !rawUrl.startsWith('http')) {
        return rawUrl;
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(rawUrl);
    } catch {
        // If the URL is not parseable, return it unchanged.
        return rawUrl;
    }

    if (parsedUrl.hostname === 'images.pexels.com') {
        if (!parsedUrl.searchParams.has('auto')) {
            parsedUrl.searchParams.set('auto', 'compress');
        }
        if (!parsedUrl.searchParams.has('cs')) {
            parsedUrl.searchParams.set('cs', 'tinysrgb');
        }
        if (!parsedUrl.searchParams.has('w')) {
            parsedUrl.searchParams.set('w', String(width));
        }
        if (height && !parsedUrl.searchParams.has('h')) {
            parsedUrl.searchParams.set('h', String(height));
        }
        if (!parsedUrl.searchParams.has('dpr')) {
            parsedUrl.searchParams.set('dpr', '1');
        }
        return parsedUrl.toString();
    }

    if (parsedUrl.hostname === 'wsrv.nl') {
        return rawUrl;
    }

    if (rawUrl.includes('res.cloudinary.com') && rawUrl.includes('/image/upload/')) {
        // Inject Cloudinary delivery transformations only if not already present.
        if (rawUrl.includes('/image/upload/f_') || rawUrl.includes('/image/upload/q_') || rawUrl.includes('/image/upload/w_')) {
            return rawUrl;
        }
        const transforms = height
            ? `f_auto,q_auto,w_${width},h_${height},c_fill`
            : `f_auto,q_auto,w_${width}`;
        return rawUrl.replace('/image/upload/', `/image/upload/${transforms}/`);
    }

    const withoutProtocol = rawUrl.replace(/^https?:\/\//, '');
    const encodedUrl = encodeURIComponent(withoutProtocol);
    return `https://wsrv.nl/?url=${encodedUrl}&w=${width}&output=webp&q=80`;
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
        url: "https://res.cloudinary.com/dzehqrcmm/video/upload/f_auto,q_auto,vc_auto/v1771293570/16863167_kbozxi.mp4",
        poster: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293589/pexels-photo-2868242_hugrsz.jpg",
        description: "Rio de Janeiro / Tropical Brazil"
    },
    {
        id: 2,
        url: "https://res.cloudinary.com/dzehqrcmm/video/upload/f_auto,q_auto,vc_auto/v1771293602/7197880_r8nk2w.mp4",
        poster: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293621/pexels-photo-1530259_iea81k.jpg",
        description: "Paris / Europa"
    },
    {
        id: 3,
        url: "https://res.cloudinary.com/dzehqrcmm/video/upload/f_auto,q_auto,vc_auto/v1771293785/4069480-uhd_3840_2160_25fps_mqkuxl.mov",
        poster: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293814/pexels-photo-1483053_azoiz9.jpg",
        description: "Maldivas / Praia Paradisíaca"
    },
    {
        id: 4,
        url: "https://res.cloudinary.com/dzehqrcmm/video/upload/f_auto,q_auto,vc_auto/v1771293836/31312984_af8j6l.mp4",
        poster: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293870/pexels-photo-12110576_qaeilk.jpg",
        description: "New York / Urbano"
    },
    {
        id: 5,
        url: "https://res.cloudinary.com/dzehqrcmm/video/upload/f_auto,q_auto,vc_auto/v1771293881/3120431_c16dlk.mp4",
        poster: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293923/pexels-photo-4027087_zipkrv.jpg",
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
// IMAGE OPTIMIZATION HELPERS (for when using Cloudinary)
// =============================================================================

/**
 * Generate optimized Cloudinary URL
 * @param url Original Cloudinary URL
 * @param width Desired width
 * @param format Output format (auto recommended)
 */
export const optimizeCloudinaryUrl = (
    url: string,
    width: number = 800,
    format: 'auto' | 'webp' | 'avif' = 'auto'
): string => {
    // Only works with Cloudinary URLs
    if (!url.includes('cloudinary.com')) {
        return url;
    }

    // Insert transformation parameters
    const transformations = `w_${width},q_auto,f_${format}`;
    return url.replace('/upload/', `/upload/${transformations}/`);
};

/**
 * Generate srcset for responsive images
 * Only works with Cloudinary URLs
 */
export const generateSrcSet = (url: string, sizes: number[] = [400, 800, 1200]): string => {
    if (!url.includes('cloudinary.com')) {
        return '';
    }

    return sizes
        .map(size => `${optimizeCloudinaryUrl(url, size)} ${size}w`)
        .join(', ');
};
