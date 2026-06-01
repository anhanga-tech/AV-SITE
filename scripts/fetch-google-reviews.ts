import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanString } from '../lib/lead-logic';
import type { GoogleReview, GoogleReviewsData, ReviewAnnotations, ReviewsBlocklist } from '../types/reviews';

for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path);
  }
}

const MIN_RATING = 4;

interface RawReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
  photoUrl: string;
  destination?: string;
}

export function filterReviews(reviews: RawReview[]): RawReview[] {
  return reviews.filter((r) => r.rating >= MIN_RATING);
}

export function applyBlocklist(reviews: RawReview[], blockedIds: string[]): RawReview[] {
  if (blockedIds.length === 0) return reviews;
  const blocked = new Set(blockedIds);
  return reviews.filter((r) => !blocked.has(r.id));
}

export function mergeAnnotations(
  reviews: RawReview[],
  annotations: ReviewAnnotations
): RawReview[] {
  return reviews.map((r) => {
    const ann = annotations[r.id];
    if (!ann) return r;
    return { ...r, destination: ann.destination ?? r.destination };
  });
}

export function sanitizeReviewText(text: string): string {
  return cleanString(text);
}

function parseOutscraperReview(raw: Record<string, unknown>): RawReview {
  return {
    id: String(raw['review_id'] ?? raw['google_id'] ?? ''),
    authorName: sanitizeReviewText(String(raw['author_title'] ?? '')),
    rating: Number(raw['review_rating'] ?? 0),
    text: sanitizeReviewText(String(raw['review_text'] ?? '')),
    date: parseOutscraperDate(raw['review_datetime_utc']),
    photoUrl: String(raw['author_image'] ?? ''),
  };
}

function parseOutscraperDate(value: unknown): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
}

const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;

async function uploadPhotoToR2(
  reviewId: string,
  sourceUrl: string,
  bucketName: string,
  cdnBaseUrl: string
): Promise<string> {
  const { execFileSync } = await import('node:child_process');
  const { writeFileSync, unlinkSync, mkdirSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  if (!SAFE_ID_RE.test(reviewId)) {
    throw new Error(`Invalid review ID: ${reviewId}`);
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) return '';

  const buffer = Buffer.from(await response.arrayBuffer());
  const key = `reviews/${reviewId}.jpg`;

  const tmpDir = join(tmpdir(), 'review-photos');
  mkdirSync(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, `${reviewId}.jpg`);

  writeFileSync(tmpFile, buffer);
  try {
    execFileSync('npx', [
      'wrangler', 'r2', 'object', 'put',
      `${bucketName}/${key}`,
      `--file=${tmpFile}`,
      '--content-type=image/jpeg',
    ], { stdio: 'pipe' });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }

  return `${cdnBaseUrl}/${key}`;
}

interface EnvConfig {
  outscraperApiKey: string;
  googlePlaceId: string;
  r2BucketName: string | null;
  r2CdnBaseUrl: string | null;
}

function loadConfig(): EnvConfig {
  const outscraperApiKey = process.env.OUTSCRAPER_API_KEY;
  const googlePlaceId = process.env.GOOGLE_PLACE_ID;

  if (!outscraperApiKey) throw new Error('Missing OUTSCRAPER_API_KEY');
  if (!googlePlaceId) throw new Error('Missing GOOGLE_PLACE_ID');

  return {
    outscraperApiKey,
    googlePlaceId,
    r2BucketName: process.env.R2_BUCKET_NAME || null,
    r2CdnBaseUrl: process.env.R2_CDN_BASE_URL || null,
  };
}

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function pollForResults(
  resultsUrl: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    console.log(`Polling for results (attempt ${attempt}/${MAX_POLL_ATTEMPTS})...`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    try {
      const res = await fetch(resultsUrl, {
        headers: { 'X-API-KEY': apiKey },
      });

      if (!res.ok) {
        console.warn(`Poll attempt ${attempt} failed: ${res.status} ${res.statusText}`);
        continue;
      }

      const rawJson: unknown = await res.json();
      if (!isRecord(rawJson)) {
        console.warn(`Poll attempt ${attempt} returned invalid JSON`);
        continue;
      }

      if (rawJson['status'] === 'Success' || Array.isArray(rawJson['data'])) {
        return rawJson;
      }

      if (rawJson['status'] !== 'Pending') {
        throw new Error(`Outscraper job failed with status: ${rawJson['status']}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Outscraper job failed')) {
        throw err;
      }
      console.warn(`Transient error during poll attempt ${attempt}:`, err);
    }
  }

  throw new Error(`Outscraper job timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
}

async function fetchFromOutscraper(apiKey: string, placeId: string): Promise<{
  reviews: Record<string, unknown>[];
  averageRating: number;
  totalReviews: number;
}> {
  const url = new URL('https://api.app.outscraper.com/maps/reviews-v3');
  url.searchParams.set('query', placeId);
  url.searchParams.set('reviewsLimit', '100');
  url.searchParams.set('sort', 'newest');
  url.searchParams.set('language', 'pt');

  const response = await fetch(url.toString(), {
    headers: { 'X-API-KEY': apiKey },
  });

  if (!response.ok) {
    throw new Error(`Outscraper API error: ${response.status} ${response.statusText}`);
  }

  const rawJson: unknown = await response.json();
  if (!isRecord(rawJson)) {
    throw new Error('Invalid JSON response from Outscraper');
  }
  let json = rawJson;

  const resultsLocation = json['results_location'];
  if (json['status'] === 'Pending' && typeof resultsLocation === 'string') {
    console.log('Job queued, waiting for results...');
    json = await pollForResults(resultsLocation, apiKey);
  }

  let place: Record<string, unknown> | undefined;

  if (Array.isArray(json['data'])) {
    const first = (json['data'] as unknown[])[0];
    if (isRecord(first)) {
      place = first;
    } else if (Array.isArray(first) && isRecord(first[0])) {
      place = first[0];
    }
  }

  if (!place) {
    throw new Error('No place data in Outscraper response');
  }

  const reviewsRaw = Array.isArray(place['reviews_data']) ? place['reviews_data'] as Record<string, unknown>[] : [];
  const averageRating = Number(place['rating'] ?? 0);
  const totalReviews = Number(place['reviews'] ?? 0);

  return { reviews: reviewsRaw, averageRating, totalReviews };
}

async function main() {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  const config = loadConfig();
  console.log('Fetching reviews from Outscraper...');

  const { reviews: rawReviews, averageRating, totalReviews } = await fetchFromOutscraper(
    config.outscraperApiKey,
    config.googlePlaceId
  );

  const parsed = rawReviews.map(parseOutscraperReview);
  const filtered = filterReviews(parsed);

  const blocklistPath = resolve(import.meta.dirname, '../data/reviewsBlocklist.json');
  const blocklist: ReviewsBlocklist = JSON.parse(readFileSync(blocklistPath, 'utf-8'));
  const afterBlocklist = applyBlocklist(filtered, blocklist.blockedIds);

  const annotationsPath = resolve(import.meta.dirname, '../data/reviewAnnotations.json');
  const annotations: ReviewAnnotations = JSON.parse(readFileSync(annotationsPath, 'utf-8'));
  const withAnnotations = mergeAnnotations(afterBlocklist, annotations);

  let photosUploaded = 0;
  const finalReviews: GoogleReview[] = [];
  const canUpload = config.r2BucketName && config.r2CdnBaseUrl;

  for (const review of withAnnotations) {
    let photoUrl = '';
    if (review.photoUrl && canUpload) {
      try {
        photoUrl = await uploadPhotoToR2(review.id, review.photoUrl, config.r2BucketName!, config.r2CdnBaseUrl!);
        if (photoUrl) photosUploaded++;
      } catch {
        console.warn(`Failed to upload photo for review ${review.id}`);
      }
    }
    finalReviews.push({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      text: review.text,
      date: review.date,
      photoUrl,
      destination: review.destination,
    });
  }

  const output: GoogleReviewsData = {
    placeId: config.googlePlaceId,
    averageRating,
    totalReviews,
    lastFetched: new Date().toISOString(),
    reviews: finalReviews,
  };

  const outputPath = resolve(import.meta.dirname, '../data/googleReviews.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');

  console.log(JSON.stringify({
    found: rawReviews.length,
    filtered: filtered.length,
    blocked: filtered.length - afterBlocklist.length,
    photosUploaded,
    output: outputPath,
  }, null, 2));
}

const isDirectRun = !!process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
