import snapshot from '../data/google-business-reviews.snapshot.v1.json';
import type {
  GoogleAggregateRating,
  GoogleBusinessReview,
  GoogleBusinessReviewsSnapshotV1,
  HomeFallbackStory,
  HomeRealReview,
  HomeTestimonialsViewModel,
  ParsedGoogleReviewsSnapshot,
} from '../types/googleReviews';

export const HOME_REAL_REVIEW_LIMIT = 3;
const AVATAR_BACKGROUND_COLORS = ['b6e3f4', 'ffdfbf', 'c0aede'];
const DEFAULT_DESTINATION_LABEL = 'Google';

const FALLBACK_HOME_STORIES: HomeFallbackStory[] = [
  {
    id: 'fallback-1',
    name: 'Daryw M.',
    destination: 'Finlandia',
    text: 'Desde o primeiro contato, senti um acolhimento e atendimento diferente e especial.',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Daryw&backgroundColor=b6e3f4',
    publishedAt: '2025-12-15',
  },
  {
    id: 'fallback-2',
    name: 'Rafa & Gabi',
    destination: 'Paraty',
    text: 'Chegamos no hotel e havia uma surpresa. Atendimento impecavel do inicio ao fim.',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=CarlosFer&backgroundColor=ffdfbf',
    publishedAt: '2025-11-20',
  },
  {
    id: 'fallback-3',
    name: 'William S.',
    destination: 'Alemanha',
    text: 'Viagem mais tranquila da vida. Trens, hoteis, tudo organizado perfeitamente.',
    avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Roberto&backgroundColor=c0aede',
    publishedAt: '2025-10-10',
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isValidIsoDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const buildInitials = (authorName: string): string =>
  authorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const getAvatarBackgroundColor = (index: number): string =>
  AVATAR_BACKGROUND_COLORS[index % AVATAR_BACKGROUND_COLORS.length];

const buildAvatarUrl = (authorName: string, index: number): string =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(authorName)}&backgroundColor=${getAvatarBackgroundColor(index)}`;

const normalizeReview = (review: GoogleBusinessReview, index: number): HomeRealReview => ({
  ...review,
  initials: buildInitials(review.authorName),
  destinationLabel: review.destination ?? DEFAULT_DESTINATION_LABEL,
  avatarUrl: review.profilePhotoUrl ?? buildAvatarUrl(review.authorName, index),
});

function parseAggregateRating(
  value: unknown,
  errors: string[],
): GoogleAggregateRating | null {
  if (!isRecord(value)) {
    errors.push('aggregateRating must be an object');
    return null;
  }

  const ratingValue = value.ratingValue;
  const reviewCount = value.reviewCount;
  const bestRating = value.bestRating;
  const worstRating = value.worstRating;

  if (!isFiniteNumber(ratingValue)) {
    errors.push('aggregateRating.ratingValue must be a finite number');
  }

  if (!isFiniteNumber(reviewCount)) {
    errors.push('aggregateRating.reviewCount must be a finite number');
  }

  if (!isFiniteNumber(bestRating)) {
    errors.push('aggregateRating.bestRating must be a finite number');
  }

  if (!isFiniteNumber(worstRating)) {
    errors.push('aggregateRating.worstRating must be a finite number');
  }

  if (
    !isFiniteNumber(ratingValue) ||
    !isFiniteNumber(reviewCount) ||
    !isFiniteNumber(bestRating) ||
    !isFiniteNumber(worstRating)
  ) {
    return null;
  }

  if (bestRating <= worstRating) {
    errors.push('aggregateRating.bestRating must be greater than aggregateRating.worstRating');
  }

  if (ratingValue < worstRating || ratingValue > bestRating) {
    errors.push('aggregateRating.ratingValue must stay between worstRating and bestRating');
  }

  return {
    ratingValue,
    reviewCount,
    bestRating,
    worstRating,
  };
}

function parseReview(
  value: unknown,
  index: number,
  errors: string[],
  aggregateRating: GoogleAggregateRating | null,
): GoogleBusinessReview | null {
  if (!isRecord(value)) {
    errors.push(`reviews[${index}] must be an object`);
    return null;
  }

  const id = value.id;
  const authorName = value.authorName;
  const text = value.text;
  const rating = value.rating;
  const publishedAt = value.publishedAt;
  const destination = value.destination;
  const profilePhotoUrl = value.profilePhotoUrl;
  const reviewUrl = value.reviewUrl;
  const normalizedDestination = typeof destination === 'string' ? destination.trim() : undefined;
  const normalizedProfilePhotoUrl = typeof profilePhotoUrl === 'string' ? profilePhotoUrl : undefined;
  const normalizedReviewUrl = typeof reviewUrl === 'string' ? reviewUrl : undefined;

  if (typeof id !== 'string' || id.trim().length === 0) {
    errors.push(`reviews[${index}].id must be a non-empty string`);
  }

  if (typeof authorName !== 'string' || authorName.trim().length === 0) {
    errors.push(`reviews[${index}].authorName must be a non-empty string`);
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    errors.push(`reviews[${index}].text must be a non-empty string`);
  }

  if (!isFiniteNumber(rating)) {
    errors.push(`reviews[${index}].rating must be a finite number`);
  }

  if (!isValidIsoDate(publishedAt)) {
    errors.push(`reviews[${index}].publishedAt must be a valid date`);
  }

  if (
    destination !== undefined &&
    (typeof destination !== 'string' || normalizedDestination?.length === 0)
  ) {
    errors.push(`reviews[${index}].destination must be a non-empty string when provided`);
  }

  if (
    aggregateRating &&
    isFiniteNumber(rating) &&
    (rating < aggregateRating.worstRating || rating > aggregateRating.bestRating)
  ) {
    errors.push(`reviews[${index}].rating must stay between worstRating and bestRating`);
  }

  if (
    (profilePhotoUrl !== undefined && typeof profilePhotoUrl !== 'string') ||
    (reviewUrl !== undefined && typeof reviewUrl !== 'string')
  ) {
    errors.push(`reviews[${index}] optional URLs must be strings when provided`);
  }

  if (
    typeof id !== 'string' ||
    typeof authorName !== 'string' ||
    typeof text !== 'string' ||
    !isFiniteNumber(rating) ||
    !isValidIsoDate(publishedAt)
  ) {
    return null;
  }

  return {
    id: id.trim(),
    authorName: authorName.trim(),
    text: text.trim(),
    rating,
    publishedAt,
    destination: normalizedDestination,
    profilePhotoUrl: normalizedProfilePhotoUrl,
    reviewUrl: normalizedReviewUrl,
  };
}

export function parseGoogleReviewsSnapshot(
  rawSnapshot: unknown,
  options: { visibleReviewCount?: number } = {},
): ParsedGoogleReviewsSnapshot {
  const visibleReviewCount = options.visibleReviewCount ?? HOME_REAL_REVIEW_LIMIT;
  const errors: string[] = [];

  if (!isRecord(rawSnapshot)) {
    return {
      kind: 'invalid-snapshot',
      errors: ['snapshot must be an object'],
    };
  }

  if (rawSnapshot.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1');
  }

  const rawSource = rawSnapshot.source;
  const rawFetchedAt = rawSnapshot.fetchedAt;
  const normalizedSource = typeof rawSource === 'string' ? rawSource.trim() : '';
  const normalizedFetchedAt = isValidIsoDate(rawFetchedAt) ? rawFetchedAt : '';

  if (normalizedSource.length === 0) {
    errors.push('source must be a non-empty string');
  }

  if (!normalizedFetchedAt) {
    errors.push('fetchedAt must be a valid date');
  }

  const aggregateRating = parseAggregateRating(rawSnapshot.aggregateRating, errors);

  if (!Array.isArray(rawSnapshot.reviews)) {
    errors.push('reviews must be an array');
  }

  const parsedReviews = Array.isArray(rawSnapshot.reviews)
    ? rawSnapshot.reviews
        .map((review, index) => parseReview(review, index, errors, aggregateRating))
        .filter((review): review is GoogleBusinessReview => review !== null)
    : [];

  if (Array.isArray(rawSnapshot.reviews) && rawSnapshot.reviews.length === 0) {
    return {
      kind: 'empty-snapshot',
      errors: ['reviews array is empty'],
    };
  }

  const displayedReviews = parsedReviews.slice(0, visibleReviewCount).map(normalizeReview);

  if (displayedReviews.length === 0 && parsedReviews.length === 0 && errors.length === 0) {
    return {
      kind: 'empty-snapshot',
      errors: ['no reviews available for Home'],
    };
  }

  if (aggregateRating && aggregateRating.reviewCount < displayedReviews.length) {
    errors.push('aggregateRating.reviewCount must be greater than or equal to displayed reviews');
  }

  if (errors.length > 0 || !aggregateRating || rawSnapshot.schemaVersion !== 1) {
    return {
      kind: 'invalid-snapshot',
      errors,
    };
  }

  return {
    kind: 'valid-real-snapshot',
    snapshot: {
      schemaVersion: 1,
      source: normalizedSource,
      fetchedAt: normalizedFetchedAt,
      aggregateRating,
      reviews: parsedReviews,
    } satisfies GoogleBusinessReviewsSnapshotV1,
    aggregateRating,
    displayedReviews,
  };
}

export function shouldEmitHomeAggregateRating(params: {
  pathname: string;
  parsedSnapshot: ParsedGoogleReviewsSnapshot;
  renderedReviewIds: string[];
}): boolean {
  const { pathname, parsedSnapshot, renderedReviewIds } = params;

  if (pathname !== '/' || parsedSnapshot.kind !== 'valid-real-snapshot') {
    return false;
  }

  if (renderedReviewIds.length !== parsedSnapshot.displayedReviews.length) {
    return false;
  }

  return parsedSnapshot.displayedReviews.every(
    (review, index) => renderedReviewIds[index] === review.id,
  );
}

export function getHomeTestimonialsViewModelFromSnapshot(
  rawSnapshot: unknown,
): HomeTestimonialsViewModel {
  const parsedSnapshot = parseGoogleReviewsSnapshot(rawSnapshot);

  if (parsedSnapshot.kind === 'valid-real-snapshot') {
    return {
      mode: 'real',
      source: parsedSnapshot.snapshot.source,
      fetchedAt: parsedSnapshot.snapshot.fetchedAt,
      aggregateRating: parsedSnapshot.aggregateRating,
      displayedReviews: parsedSnapshot.displayedReviews,
    };
  }

  return {
    mode: 'fallback',
    source: 'editorial-fallback',
    stories: FALLBACK_HOME_STORIES,
  };
}

export function getHomeTestimonialsViewModel(): HomeTestimonialsViewModel {
  return getHomeTestimonialsViewModelFromSnapshot(snapshot);
}

export function getParsedHomeReviewsSnapshot(): ParsedGoogleReviewsSnapshot {
  return parseGoogleReviewsSnapshot(snapshot);
}
