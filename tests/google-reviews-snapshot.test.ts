import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HOME_REAL_REVIEW_LIMIT,
  getHomeTestimonialsViewModelFromSnapshot,
  parseGoogleReviewsSnapshot,
  shouldEmitHomeAggregateRating,
} from '../lib/googleReviewsSnapshot.ts';

const validSnapshot = {
  schemaVersion: 1,
  source: 'google-business-profile',
  fetchedAt: '2026-03-18T10:00:00.000Z',
  aggregateRating: {
    ratingValue: 4.9,
    reviewCount: 27,
    bestRating: 5,
    worstRating: 1,
  },
  reviews: [
    {
      id: 'review-1',
      authorName: 'Daryw M.',
      text: 'Desde o primeiro contato, senti um acolhimento e atendimento diferente e especial.',
      rating: 5,
      publishedAt: '2025-12-15',
      reviewUrl: 'https://example.com/review-1',
    },
    {
      id: 'review-2',
      authorName: 'Rafa & Gabi',
      text: 'Chegamos no hotel e havia uma surpresa. Atendimento impecável do início ao fim.',
      rating: 5,
      publishedAt: '2025-11-20',
    },
    {
      id: 'review-3',
      authorName: 'William S.',
      text: 'Viagem mais tranquila da vida. Trens, hotéis, tudo organizado perfeitamente.',
      rating: 5,
      publishedAt: '2025-10-10',
    },
    {
      id: 'review-4',
      authorName: 'Camila R.',
      text: 'A curadoria foi muito certeira e a viagem fluiu sem estresse.',
      rating: 4,
      publishedAt: '2025-09-03',
    },
  ],
};

test('parseGoogleReviewsSnapshot should accept a valid snapshot and pick deterministic reviews for Home', () => {
  const parsed = parseGoogleReviewsSnapshot(validSnapshot);

  assert.equal(parsed.kind, 'valid-real-snapshot');
  assert.equal(parsed.snapshot.schemaVersion, 1);
  assert.equal(parsed.displayedReviews.length, HOME_REAL_REVIEW_LIMIT);
  assert.deepEqual(
    parsed.displayedReviews.map((review) => review.id),
    ['review-1', 'review-2', 'review-3'],
  );
  assert.equal(parsed.aggregateRating.reviewCount >= parsed.displayedReviews.length, true);
});

test('parseGoogleReviewsSnapshot should reject aggregate ratings outside the configured range', () => {
  const parsed = parseGoogleReviewsSnapshot({
    ...validSnapshot,
    aggregateRating: {
      ...validSnapshot.aggregateRating,
      ratingValue: 5.5,
    },
  });

  assert.equal(parsed.kind, 'invalid-snapshot');
  assert.match(parsed.errors.join(' '), /ratingValue/i);
});

test('parseGoogleReviewsSnapshot should reject snapshots whose reviewCount is lower than the number of displayed reviews', () => {
  const parsed = parseGoogleReviewsSnapshot({
    ...validSnapshot,
    aggregateRating: {
      ...validSnapshot.aggregateRating,
      reviewCount: 2,
    },
  });

  assert.equal(parsed.kind, 'invalid-snapshot');
  assert.match(parsed.errors.join(' '), /reviewCount/i);
});

test('parseGoogleReviewsSnapshot should reject invalid review dates', () => {
  const parsed = parseGoogleReviewsSnapshot({
    ...validSnapshot,
    reviews: [
      {
        ...validSnapshot.reviews[0],
        publishedAt: 'not-a-date',
      },
      ...validSnapshot.reviews.slice(1),
    ],
  });

  assert.equal(parsed.kind, 'invalid-snapshot');
  assert.match(parsed.errors.join(' '), /publishedAt/i);
});

test('parseGoogleReviewsSnapshot should return empty-snapshot when no reviews are available', () => {
  const parsed = parseGoogleReviewsSnapshot({
    ...validSnapshot,
    reviews: [],
  });

  assert.equal(parsed.kind, 'empty-snapshot');
});

test('getHomeTestimonialsViewModelFromSnapshot should fall back to editorial mode when the snapshot is invalid', () => {
  const model = getHomeTestimonialsViewModelFromSnapshot({
    ...validSnapshot,
    aggregateRating: {
      ...validSnapshot.aggregateRating,
      ratingValue: 8,
    },
  });

  assert.equal(model.mode, 'fallback');
  assert.equal(model.source, 'editorial-fallback');
});

test('shouldEmitHomeAggregateRating should emit only for valid Home reviews that match the rendered DOM', () => {
  const parsed = parseGoogleReviewsSnapshot(validSnapshot);
  assert.equal(parsed.kind, 'valid-real-snapshot');

  assert.equal(
    shouldEmitHomeAggregateRating({
      pathname: '/',
      parsedSnapshot: parsed,
      renderedReviewIds: parsed.displayedReviews.map((review) => review.id),
    }),
    true,
  );

  assert.equal(
    shouldEmitHomeAggregateRating({
      pathname: '/sobre',
      parsedSnapshot: parsed,
      renderedReviewIds: parsed.displayedReviews.map((review) => review.id),
    }),
    false,
  );

  assert.equal(
    shouldEmitHomeAggregateRating({
      pathname: '/',
      parsedSnapshot: parsed,
      renderedReviewIds: ['review-999'],
    }),
    false,
  );

  const invalidParsed = parseGoogleReviewsSnapshot({
    ...validSnapshot,
    schemaVersion: 2,
  });

  assert.equal(
    shouldEmitHomeAggregateRating({
      pathname: '/',
      parsedSnapshot: invalidParsed,
      renderedReviewIds: [],
    }),
    false,
  );
});
