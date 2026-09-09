type ImageFit = 'cover' | 'scale-down';

export interface ImagePreset {
    id: string;
    width: number;
    height?: number;
    fit: ImageFit;
}

export interface OptimizeImageUrlOptions {
    mediaBaseUrl?: string;
    transformZoneUrl?: string;
    enableTransforms?: boolean;
    width?: number;
    height?: number;
    format?: 'auto' | 'avif' | 'webp';
    /**
     * Cloudflare `quality`, 1-100. Defaults to {@link DEFAULT_QUALITY}.
     *
     * Deliberately a per-call decision rather than a property of the preset:
     * presets are keyed by dimensions alone, so the blog cover and the home
     * hero poster share the 16:9 tiers. Lowering a preset's quality would move
     * both at once — the caller that measured the tradeoff is the one that
     * should own it (issue #1602).
     */
    quality?: number;
}

const RATIO_TOLERANCE = 0.08;
const DEFAULT_QUALITY = 85;

function isAbsoluteHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function safelyParseUrl(value: string): URL | null {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

function stripTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

export function resolveMediaUrl(pathOrUrl: string, mediaBaseUrl: string = ''): string {
    if (!pathOrUrl || isAbsoluteHttpUrl(pathOrUrl)) {
        return pathOrUrl;
    }

    if (!mediaBaseUrl) {
        return pathOrUrl;
    }

    const normalizedBase = `${stripTrailingSlash(mediaBaseUrl)}/`;
    const normalizedPath = pathOrUrl.replace(/^\/+/, '');
    return new URL(normalizedPath, normalizedBase).toString();
}

function isCloseToRatio(actual: number, expected: number): boolean {
    return Math.abs(actual - expected) <= RATIO_TOLERANCE;
}

// Returned by two branches (the 16:9 mid tier and the catch-all). A factory
// rather than a shared const so callers can never mutate the other branch's
// preset through the object they got back.
const contentPreset = (): ImagePreset => ({
    id: 'content',
    width: 1200,
    height: 675,
    fit: 'cover',
});

export function selectImagePreset(width: number = 1200, height?: number): ImagePreset {
    if (!height) {
        return width <= 800
            ? { id: 'inline-sm', width: 800, fit: 'scale-down' }
            : { id: 'inline-lg', width: 1200, fit: 'scale-down' };
    }

    const ratio = width / height;
    const largestDimension = Math.max(width, height);

    if (isCloseToRatio(ratio, 1)) {
        if (largestDimension <= 256) {
            return { id: 'avatar', width: 256, height: 256, fit: 'cover' };
        }

        // Sticker-sized squares (Orlando hero cards, rendered at most 356px wide
        // on mobile) used to jump straight to the 640px preset and download ~4x
        // the pixels they display. 512px still covers 356 CSS px at DPR 1.75.
        if (largestDimension <= 512) {
            return { id: 'square-md', width: 512, height: 512, fit: 'cover' };
        }

        return { id: 'square', width: 640, height: 640, fit: 'cover' };
    }

    // Portrait crop for tall boxes (the blog cover on phones). Without it a 3:4
    // request fell through to the landscape `content` fallback, so a 412x560
    // hero got a 1200x675 image scaled up to cover — heavier AND softer than a
    // crop that matches the box.
    if (isCloseToRatio(ratio, 3 / 4)) {
        return { id: 'portrait', width: 720, height: 960, fit: 'cover' };
    }

    if (isCloseToRatio(ratio, 16 / 10)) {
        return { id: 'card', width: 640, height: 400, fit: 'cover' };
    }

    if (isCloseToRatio(ratio, 4 / 3)) {
        return { id: 'card-tall', width: 640, height: 480, fit: 'cover' };
    }

    if (isCloseToRatio(ratio, 16 / 9)) {
        if (width <= 960) {
            return { id: 'feature', width: 960, height: 540, fit: 'cover' };
        }

        if (width <= 1200) {
            return contentPreset();
        }

        return { id: 'hero', width: 1280, height: 720, fit: 'cover' };
    }

    return contentPreset();
}

/**
 * Clamps to the range Cloudflare accepts and rejects anything non-numeric, so a
 * bad caller degrades to the default instead of emitting an invalid transform
 * URL (which the resizer answers with a 400, i.e. a broken image).
 */
function normalizeQuality(quality?: number): number {
    if (typeof quality !== 'number' || !Number.isFinite(quality)) {
        return DEFAULT_QUALITY;
    }

    return Math.min(100, Math.max(1, Math.round(quality)));
}

export function buildCloudflareImageUrl(
    sourcePathOrUrl: string,
    transformZoneUrl: string,
    preset: ImagePreset,
    format: 'auto' | 'avif' | 'webp' = 'auto',
    quality?: number,
): string {
    const normalizedZone = stripTrailingSlash(transformZoneUrl);
    const params = [
        `format=${format}`,
        `quality=${normalizeQuality(quality)}`,
        'metadata=none',
        `fit=${preset.fit}`,
        `width=${preset.width}`,
    ];

    if (preset.height) {
        params.push(`height=${preset.height}`);
    }

    const normalizedSource = sourcePathOrUrl.startsWith('/')
        ? sourcePathOrUrl
        : `/${sourcePathOrUrl.replace(/^\/+/, '')}`;

    return `${normalizedZone}/cdn-cgi/image/${params.join(',')}${normalizedSource}`;
}

function isExistingCloudflareTransformUrl(url: string): boolean {
    return url.includes('/cdn-cgi/image/');
}

function getTransformSourcePath(
    rawUrl: string,
    resolvedSource: string,
    transformZoneUrl: string,
): string | null {
    if (!isAbsoluteHttpUrl(transformZoneUrl)) {
        return null;
    }

    if (!isAbsoluteHttpUrl(rawUrl)) {
        return `/${rawUrl.replace(/^\/+/, '')}`;
    }

    const sourceUrl = safelyParseUrl(resolvedSource);
    const transformZone = safelyParseUrl(transformZoneUrl);

    if (!sourceUrl || !transformZone) {
        return null;
    }

    if (sourceUrl.origin !== transformZone.origin) {
        return null;
    }

    return `${sourceUrl.pathname}${sourceUrl.search}`;
}

export function optimizeImageUrl(rawUrl: string, options: OptimizeImageUrlOptions = {}): string {
    if (!rawUrl) {
        return rawUrl;
    }

    const resolvedSource = resolveMediaUrl(rawUrl, options.mediaBaseUrl);
    if (!isAbsoluteHttpUrl(resolvedSource) || isExistingCloudflareTransformUrl(resolvedSource)) {
        return resolvedSource;
    }

    if (!options.enableTransforms || !options.transformZoneUrl) {
        return resolvedSource;
    }

    const sourcePath = getTransformSourcePath(rawUrl, resolvedSource, options.transformZoneUrl);
    if (!sourcePath) {
        return resolvedSource;
    }

    const preset = selectImagePreset(options.width, options.height);
    return buildCloudflareImageUrl(
        sourcePath,
        options.transformZoneUrl,
        preset,
        options.format ?? 'auto',
        options.quality,
    );
}
