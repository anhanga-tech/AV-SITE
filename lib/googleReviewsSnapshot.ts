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

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

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

const parseRequiredTrimmedStringField = (
  value: unknown,
  fieldPath: string,
  errors: string[],
): string | null => {
  if (!isNonEmptyString(value)) {
    errors.push(`${fieldPath} must be a non-empty string`);
    return null;
  }

  return value.trim();
};

const parseIsoDateField = (
  value: unknown,
  fieldPath: string,
  errors: string[],
): string | null => {
  if (!isValidIsoDate(value)) {
    errors.push(`${fieldPath} must be a valid date`);
    return null;
  }

  return value;
};

const parseOptionalDestination = (
  value: unknown,
  fieldPath: string,
  errors: string[],
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!isNonEmptyString(value)) {
    errors.push(`${fieldPath} must be a non-empty string when provided`);
    return undefined;
  }

  return value.trim();
};

const parseOptionalStringField = (
  value: unknown,
  fieldPath: string,
  errors: string[],
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldPath} must be a string when provided`);
    return undefined;
  }

  return value;
};

const parseReviewRatingField = (
  value: unknown,
  fieldPath: string,
  errors: string[],
  aggregateRating: GoogleAggregateRating | null,
): number | null => {
  if (!isFiniteNumber(value)) {
    errors.push(`${fieldPath} must be a finite number`);
    return null;
  }

  if (
    aggregateRating &&
    (value < aggregateRating.worstRating || value > aggregateRating.bestRating)
  ) {
    errors.push(`${fieldPath} must stay between worstRating and bestRating`);
  }

  return value;
};

function parseSnapshotMetadata(
  rawSnapshot: Record<string, unknown>,
  errors: string[],
): {
  schemaVersion: 1 | null;
  source: string;
  fetchedAt: string;
} {
  const schemaVersion = rawSnapshot.schemaVersion === 1 ? 1 : null;

  if (!schemaVersion) {
    errors.push('schemaVersion must be 1');
  }

  return {
    schemaVersion,
    source: parseRequiredTrimmedStringField(rawSnapshot.source, 'source', errors) ?? '',
    fetchedAt: parseIsoDateField(rawSnapshot.fetchedAt, 'fetchedAt', errors) ?? '',
  };
}

function parseReviewsCollection(
  value: unknown,
  errors: string[],
  aggregateRating: GoogleAggregateRating | null,
): {
  reviews: GoogleBusinessReview[];
  hasExplicitEmptyArray: boolean;
} {
  if (!Array.isArray(value)) {
    errors.push('reviews must be an array');
    return {
      reviews: [],
      hasExplicitEmptyArray: false,
    };
  }

  return {
    reviews: value
      .map((review, index) => parseReview(review, index, errors, aggregateRating))
      .filter((review): review is GoogleBusinessReview => review !== null),
    hasExplicitEmptyArray: value.length === 0,
  };
}

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

  const fieldPath = (fieldName: string) => `reviews[${index}].${fieldName}`;
  const id = parseRequiredTrimmedStringField(value.id, fieldPath('id'), errors);
  const authorName = parseRequiredTrimmedStringField(value.authorName, fieldPath('authorName'), errors);
  const text = parseRequiredTrimmedStringField(value.text, fieldPath('text'), errors);
  const rating = parseReviewRatingField(value.rating, fieldPath('rating'), errors, aggregateRating);
  const publishedAt = parseIsoDateField(value.publishedAt, fieldPath('publishedAt'), errors);
  const destination = parseOptionalDestination(value.destination, fieldPath('destination'), errors);
  const profilePhotoUrl = parseOptionalStringField(value.profilePhotoUrl, fieldPath('profilePhotoUrl'), errors);
  const reviewUrl = parseOptionalStringField(value.reviewUrl, fieldPath('reviewUrl'), errors);

  if (!id || !authorName || !text || rating === null || !publishedAt) {
    return null;
  }

  return {
    id,
    authorName,
    text,
    rating,
    publishedAt,
    destination,
    profilePhotoUrl,
    reviewUrl,
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

  const metadata = parseSnapshotMetadata(rawSnapshot, errors);
  const aggregateRating = parseAggregateRating(rawSnapshot.aggregateRating, errors);
  const parsedReviews = parseReviewsCollection(rawSnapshot.reviews, errors, aggregateRating);

  if (parsedReviews.hasExplicitEmptyArray) {
    return {
      kind: 'empty-snapshot',
      errors: ['reviews array is empty'],
    };
  }

  const displayedReviews = parsedReviews.reviews.slice(0, visibleReviewCount).map(normalizeReview);

  if (displayedReviews.length === 0 && parsedReviews.reviews.length === 0 && errors.length === 0) {
    return {
      kind: 'empty-snapshot',
      errors: ['no reviews available for Home'],
    };
  }

  if (aggregateRating && aggregateRating.reviewCount < displayedReviews.length) {
    errors.push('aggregateRating.reviewCount must be greater than or equal to displayed reviews');
  }

  if (errors.length > 0 || !aggregateRating || metadata.schemaVersion !== 1) {
    return {
      kind: 'invalid-snapshot',
      errors,
    };
  }

  return {
    kind: 'valid-real-snapshot',
    snapshot: {
      schemaVersion: 1,
      source: metadata.source,
      fetchedAt: metadata.fetchedAt,
      aggregateRating,
      reviews: parsedReviews.reviews,
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
