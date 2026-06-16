/**
 * Pure decision helpers for the R2 batch image optimizer (`scripts/optimize-r2-images.ts`).
 *
 * Kept free of I/O so the policy — which objects to touch, how to resize, where to
 * back up — can be unit tested without hitting the network or the filesystem.
 */

/** Objects below this size are already light enough to leave untouched. */
export const DEFAULT_MIN_BYTES = 300 * 1024;

/** Retina 2x of the 1200px hero — never downscale below the largest real usage. */
export const DEFAULT_MAX_WIDTH = 2400;

/** mozjpeg quality for JPEG recompression. */
export const DEFAULT_QUALITY = 80;

/** Prefix where untouched originals are copied before any overwrite. */
export const DEFAULT_BACKUP_PREFIX = 'originals/';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'svg' | 'unknown';

const EXTENSION_TO_FORMAT: Record<string, ImageFormat> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.webp': 'webp',
  '.avif': 'avif',
  '.gif': 'gif',
  '.svg': 'svg',
};

/**
 * Formats we recompress in place. WebP/AVIF originals are already efficient,
 * GIF risks dropping animation, and SVG is vector — all left alone so we never
 * change a URL's effective format or break OG/social embeds.
 */
const RECOMPRESSIBLE: ReadonlySet<ImageFormat> = new Set<ImageFormat>(['jpeg', 'png']);

export function detectFormatFromKey(key: string): ImageFormat {
  const lower = key.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot === -1) return 'unknown';
  return EXTENSION_TO_FORMAT[lower.slice(dot)] ?? 'unknown';
}

export function isRecompressibleFormat(format: ImageFormat): boolean {
  return RECOMPRESSIBLE.has(format);
}

export function isBackupKey(key: string, backupPrefix: string = DEFAULT_BACKUP_PREFIX): boolean {
  return key.startsWith(backupPrefix);
}

export function buildBackupKey(key: string, backupPrefix: string = DEFAULT_BACKUP_PREFIX): string {
  return `${backupPrefix}${key}`;
}

export interface OptimizeDecision {
  process: boolean;
  /** Machine-readable reason for skipping/processing, used in the report. */
  reason: 'ok' | 'backup-object' | 'unsupported-format' | 'already-light';
}

/**
 * Decide whether an object is a candidate for recompression based only on its
 * key and size. Pixel-level decisions (resize) happen later once dimensions are
 * known via {@link planResize}.
 */
export function shouldOptimize(params: {
  key: string;
  sizeBytes: number;
  minBytes?: number;
  backupPrefix?: string;
}): OptimizeDecision {
  const { key, sizeBytes, minBytes = DEFAULT_MIN_BYTES, backupPrefix = DEFAULT_BACKUP_PREFIX } = params;

  if (isBackupKey(key, backupPrefix)) {
    return { process: false, reason: 'backup-object' };
  }
  if (!isRecompressibleFormat(detectFormatFromKey(key))) {
    return { process: false, reason: 'unsupported-format' };
  }
  if (sizeBytes < minBytes) {
    return { process: false, reason: 'already-light' };
  }
  return { process: true, reason: 'ok' };
}

export interface ResizePlan {
  /** Target width to pass to sharp, or null to keep original dimensions. */
  targetWidth: number | null;
  willResize: boolean;
}

/**
 * Only ever downscale: resize to `maxWidth` when the original is wider, never
 * enlarge. Originals narrower than `maxWidth` keep their dimensions and are only
 * recompressed.
 */
export function planResize(originalWidth: number, maxWidth: number = DEFAULT_MAX_WIDTH): ResizePlan {
  if (Number.isFinite(originalWidth) && originalWidth > maxWidth) {
    return { targetWidth: maxWidth, willResize: true };
  }
  return { targetWidth: null, willResize: false };
}

/**
 * Keep an overwrite only when it actually saves bytes. Recompression can grow a
 * file (e.g. already-optimized JPEGs); in that case the original is preserved.
 */
export function isWorthOverwriting(originalBytes: number, optimizedBytes: number): boolean {
  return optimizedBytes > 0 && optimizedBytes < originalBytes;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
