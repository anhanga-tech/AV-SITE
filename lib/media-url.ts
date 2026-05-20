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

export function selectImagePreset(width: number = 1200, height?: number): ImagePreset {
    if (!height) {
        return width <= 800
            ? { id: 'inline-sm', width: 800, fit: 'scale-down' }
            : { id: 'inline-lg', width: 1200, fit: 'scale-down' };
    }

    const ratio = width / height;
    const largestDimension = Math.max(width, height);

    if (isCloseToRatio(ratio, 1)) {
        return largestDimension <= 256
            ? { id: 'avatar', width: 256, height: 256, fit: 'cover' }
            : { id: 'square', width: 640, height: 640, fit: 'cover' };
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
            return { id: 'content', width: 1200, height: 675, fit: 'cover' };
        }

        return { id: 'hero', width: 1280, height: 720, fit: 'cover' };
    }

    return { id: 'content', width: 1200, height: 675, fit: 'cover' };
}

export function buildCloudflareImageUrl(
    sourcePathOrUrl: string,
    transformZoneUrl: string,
    preset: ImagePreset,
    format: 'auto' | 'avif' | 'webp' = 'auto',
): string {
    const normalizedZone = stripTrailingSlash(transformZoneUrl);
    const params = [
        `format=${format}`,
        `quality=${DEFAULT_QUALITY}`,
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
    return buildCloudflareImageUrl(sourcePath, options.transformZoneUrl, preset, options.format ?? 'auto');
}
