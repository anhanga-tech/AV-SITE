/**
 * Batch-optimize the heavy original images stored in the Cloudflare R2 bucket
 * (`av-site-media`, served at https://media.anhanga.tur.br).
 *
 * This is SEO/technical hygiene and origin robustness — the live site already
 * serves ~200 KB AVIF/WebP via Cloudflare Image Transformations, so this does
 * not change runtime LCP. It re-encodes the *originals* so the raw URLs indexed
 * by crawlers stop being multi-MB, and so the transform layer reads from leaner
 * sources.
 *
 * Guarantees:
 *   - Same key, same extension, same Content-Type — URLs / OG tags never change.
 *   - Originals are copied to `originals/<key>` (server-side) before any write.
 *   - Never upscales; only downscales when wider than --max-width.
 *   - Only overwrites when the re-encode is actually smaller.
 *   - Dry-run by default. Nothing is written without --apply.
 *
 * Auth (S3-compatible API). Set via env or .env / .env.local:
 *   R2_ACCOUNT_ID         Cloudflare account id (the r2.cloudflarestorage.com host)
 *   R2_ACCESS_KEY_ID      R2 API token Access Key ID (Object Read & Write)
 *   R2_SECRET_ACCESS_KEY  R2 API token Secret Access Key
 *   R2_BUCKET_NAME        defaults to "av-site-media"
 *
 * Usage:
 *   tsx scripts/optimize-r2-images.ts                       # dry-run, whole bucket under images/
 *   tsx scripts/optimize-r2-images.ts --prefix images/blog/ # scope a folder
 *   tsx scripts/optimize-r2-images.ts --limit 3             # first 3 candidates (validation pass)
 *   tsx scripts/optimize-r2-images.ts --apply               # actually back up + overwrite
 *   tsx scripts/optimize-r2-images.ts --apply --limit 3 --prefix images/blog/
 *
 * Flags: --max-width (2400), --min-kb (300), --quality (80), --backup-prefix (originals/)
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  type _Object,
} from '@aws-sdk/client-s3';
import {
  DEFAULT_BACKUP_PREFIX,
  DEFAULT_MAX_WIDTH,
  DEFAULT_MIN_BYTES,
  DEFAULT_QUALITY,
  buildBackupKey,
  detectFormatFromKey,
  formatBytes,
  isWorthOverwriting,
  planResize,
  shouldOptimize,
  type ImageFormat,
} from '../lib/image-optimization';

for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path);
  }
}

interface Options {
  apply: boolean;
  prefix: string;
  limit: number | null;
  maxWidth: number;
  minBytes: number;
  quality: number;
  backupPrefix: string;
}

export function parseArgs(argv: string[]): Options {
  const opts: Options = {
    apply: false,
    prefix: 'images/',
    limit: null,
    maxWidth: DEFAULT_MAX_WIDTH,
    minBytes: DEFAULT_MIN_BYTES,
    quality: DEFAULT_QUALITY,
    backupPrefix: DEFAULT_BACKUP_PREFIX,
  };
  let i = 0;
  const next = (arg: string): string => {
    const value = argv[++i];
    if (value === undefined) {
      throw new Error(`Missing value for argument: ${arg}`);
    }
    return value;
  };
  const nextNum = (arg: string): number => {
    const value = Number(next(arg));
    if (Number.isNaN(value)) {
      throw new Error(`Invalid numeric value for argument: ${arg}`);
    }
    return value;
  };
  for (; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--apply': opts.apply = true; break;
      case '--prefix': opts.prefix = next(arg); break;
      case '--limit': opts.limit = nextNum(arg); break;
      case '--max-width': opts.maxWidth = nextNum(arg); break;
      case '--min-kb': opts.minBytes = nextNum(arg) * 1024; break;
      case '--quality': opts.quality = nextNum(arg); break;
      case '--backup-prefix': opts.backupPrefix = next(arg); break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY ` +
        `(R2 API token with Object Read & Write) in your environment or .env.`,
    );
  }
  return value;
}

function createClient(): S3Client {
  const accountId = requireEnv('R2_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

async function listAllObjects(client: S3Client, bucket: string, prefix: string): Promise<_Object[]> {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken }),
    );
    objects.push(...(res.Contents ?? []));
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

/**
 * Build an S3 `CopySource` for `bucket/key`. Each path segment is URL-encoded
 * (so spaces/specials in keys are safe) while the `/` separators stay literal —
 * the form R2 accepts unambiguously, avoiding reliance on the store decoding
 * `%2F` back into a separator.
 */
export function encodeCopySource(bucket: string, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${bucket}/${encodedKey}`;
}

export function contentTypeFor(format: ImageFormat, existing?: string): string {
  // Trust the stored type only when it is already an image/* type; correct
  // generic uploads (e.g. application/octet-stream) to the real mime-type.
  if (existing && existing.startsWith('image/')) return existing;
  return format === 'png' ? 'image/png' : 'image/jpeg';
}

/** Re-encode a buffer preserving its format. Returns the smaller-or-equal bytes. */
async function reencode(input: Buffer, format: ImageFormat, opts: Options): Promise<{ output: Buffer; width: number; resized: boolean }> {
  const image = sharp(input, { failOn: 'none' }).rotate(); // bake EXIF orientation, then strip metadata
  const meta = await image.metadata();
  const originalWidth = meta.width ?? 0;
  const { targetWidth, willResize } = planResize(originalWidth, opts.maxWidth);

  let pipeline = image;
  if (targetWidth) {
    pipeline = pipeline.resize({ width: targetWidth, withoutEnlargement: true });
  }

  pipeline =
    format === 'png'
      ? pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 8 })
      : pipeline.jpeg({ quality: opts.quality, mozjpeg: true });

  const output = await pipeline.toBuffer();
  return { output, width: targetWidth ?? originalWidth, resized: willResize };
}

async function backupExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

interface RowResult {
  key: string;
  before: number;
  after: number;
  status: 'optimized' | 'would-optimize' | 'skipped-no-gain' | 'skipped';
  reason: string;
}

/** Copy the original to the backup prefix once, before it is overwritten. */
async function backupOriginal(client: S3Client, bucket: string, key: string, backupPrefix: string): Promise<void> {
  const backupKey = buildBackupKey(key, backupPrefix);
  if (await backupExists(client, bucket, backupKey)) return;
  await client.send(
    new CopyObjectCommand({ Bucket: bucket, Key: backupKey, CopySource: encodeCopySource(bucket, key) }),
  );
}

function formatSaving(before: number, after: number, width: number, resized: boolean): string {
  const pct = (((before - after) / before) * 100).toFixed(0);
  return `${formatBytes(before)} → ${formatBytes(after)}  (-${pct}%)${resized ? `  ↧${width}px` : ''}`;
}

/** Fetch, re-encode and (when --apply) back up + overwrite a single object. */
async function processObject(client: S3Client, bucket: string, obj: _Object, opts: Options): Promise<RowResult> {
  const key = obj.Key!;
  const before = obj.Size ?? 0;
  const format = detectFormatFromKey(key);

  try {
    const getRes = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!getRes.Body) {
      throw new Error('R2 object has no body');
    }
    const input = Buffer.from(await getRes.Body.transformToByteArray());
    const { output, width, resized } = await reencode(input, format, opts);
    const after = output.length;

    if (!isWorthOverwriting(before, after)) {
      console.log(`  ↷ ${key}  ${formatBytes(before)} → ${formatBytes(after)}  (sem ganho, mantido)`);
      return { key, before, after, status: 'skipped-no-gain', reason: 'recompressão não reduziu' };
    }

    const detail = formatSaving(before, after, width, resized);

    if (!opts.apply) {
      console.log(`  • ${key}  ${detail}`);
      return { key, before, after, status: 'would-optimize', reason: 'dry-run' };
    }

    await backupOriginal(client, bucket, key, opts.backupPrefix);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: output,
        ContentType: contentTypeFor(format, getRes.ContentType),
        CacheControl: getRes.CacheControl,
      }),
    );

    console.log(`  ✓ ${key}  ${detail}`);
    return { key, before, after, status: 'optimized', reason: 'ok' };
  } catch (err) {
    console.error(`  ✗ ${key}  erro: ${err instanceof Error ? err.message : err}`);
    return { key, before, after: before, status: 'skipped', reason: err instanceof Error ? err.message : String(err) };
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const bucket = process.env.R2_BUCKET_NAME || 'av-site-media';
  const client = createClient();

  console.log(
    `\nR2 image optimizer — bucket="${bucket}" prefix="${opts.prefix}" ` +
      `mode=${opts.apply ? 'APPLY (writes enabled)' : 'DRY-RUN'} ` +
      `maxWidth=${opts.maxWidth} minKB=${Math.round(opts.minBytes / 1024)} quality=${opts.quality}\n`,
  );

  const all = await listAllObjects(client, bucket, opts.prefix);
  const candidates = all.filter((o) => {
    const decision = shouldOptimize({
      key: o.Key ?? '',
      sizeBytes: o.Size ?? 0,
      minBytes: opts.minBytes,
      backupPrefix: opts.backupPrefix,
    });
    return decision.process;
  });

  const selected = opts.limit ? candidates.slice(0, opts.limit) : candidates;
  console.log(`Found ${all.length} objects, ${candidates.length} candidates, processing ${selected.length}.\n`);

  const rows: RowResult[] = [];
  for (const obj of selected) {
    rows.push(await processObject(client, bucket, obj, opts));
  }

  const touched = rows.filter((r) => r.status === 'optimized' || r.status === 'would-optimize');
  const savedBytes = touched.reduce((sum, r) => sum + (r.before - r.after), 0);
  const beforeTotal = touched.reduce((sum, r) => sum + r.before, 0);

  console.log('\n— Resumo —');
  console.log(`  ${opts.apply ? 'Otimizadas' : 'Seriam otimizadas'}: ${touched.length}`);
  console.log(`  Sem ganho: ${rows.filter((r) => r.status === 'skipped-no-gain').length}`);
  console.log(`  Erros: ${rows.filter((r) => r.status === 'skipped').length}`);
  console.log(`  Total antes: ${formatBytes(beforeTotal)}  →  depois: ${formatBytes(beforeTotal - savedBytes)}`);
  console.log(`  Economia: ${formatBytes(savedBytes)}${beforeTotal ? `  (-${((savedBytes / beforeTotal) * 100).toFixed(0)}%)` : ''}`);
  if (!opts.apply) {
    console.log('\n  Dry-run. Reexecute com --apply para gravar (backup automático em originals/).');
  }
}

const isDirectRun = !!process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
