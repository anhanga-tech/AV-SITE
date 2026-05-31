import { cleanString } from '../lib/lead-logic';
import type { GoogleReview, GoogleReviewsData, ReviewAnnotations, ReviewsBlocklist } from '../types/reviews';

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

async function uploadPhotoToR2(
  reviewId: string,
  sourceUrl: string,
  config: R2Config
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const response = await fetch(sourceUrl);
  if (!response.ok) return '';

  const buffer = Buffer.from(await response.arrayBuffer());
  const key = `reviews/${reviewId}.jpg`;

  const client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await client.send(new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
  }));

  const cdnBase = config.endpoint
    .replace(/\.r2\.cloudflarestorage\.com.*/, '')
    .replace('https://', '');
  return `https://${config.bucketName}.${cdnBase}.r2.dev/${key}`;
}

interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
}

interface EnvConfig {
  outscraperApiKey: string;
  googlePlaceId: string;
  r2: R2Config | null;
}

function loadConfig(): EnvConfig {
  const outscraperApiKey = process.env.OUTSCRAPER_API_KEY;
  const googlePlaceId = process.env.GOOGLE_PLACE_ID;

  if (!outscraperApiKey) throw new Error('Missing OUTSCRAPER_API_KEY');
  if (!googlePlaceId) throw new Error('Missing GOOGLE_PLACE_ID');

  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const r2BucketName = process.env.R2_BUCKET_NAME;
  const r2Endpoint = process.env.R2_ENDPOINT;

  const r2 = r2AccessKeyId && r2SecretAccessKey && r2BucketName && r2Endpoint
    ? { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey, bucketName: r2BucketName, endpoint: r2Endpoint }
    : null;

  return { outscraperApiKey, googlePlaceId, r2 };
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

  const json = await response.json() as { data: Record<string, unknown>[][] };
  const place = json.data?.[0]?.[0];
  if (!place) throw new Error('No place data in Outscraper response');

  const reviewsRaw = (place['reviews_data'] ?? []) as Record<string, unknown>[];
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

  for (const review of withAnnotations) {
    let photoUrl = '';
    if (review.photoUrl && config.r2) {
      try {
        photoUrl = await uploadPhotoToR2(review.id, review.photoUrl, config.r2);
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

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
