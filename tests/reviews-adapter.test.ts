import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  googleToDisplayReviews,
  manualToDisplayReviews,
  getDisplayReviews,
  getReviewSummary,
  formatRelativeDate,
  getInitials,
} from '../data/reviewsAdapter.ts';

import type { GoogleReviewsData } from '../types/reviews.ts';
import type { TestimonialItem } from '../data/testimonialsData.ts';

describe('reviewsAdapter', () => {
  const sampleGoogleData: GoogleReviewsData = {
    placeId: 'ChIJtest',
    averageRating: 4.9,
    totalReviews: 47,
    lastFetched: '2026-05-31T12:00:00Z',
    reviews: [
      {
        id: 'rev1',
        authorName: 'Maria S.',
        rating: 5,
        text: 'Excelente atendimento!',
        date: '2026-04-15',
        photoUrl: 'https://cdn.example.com/reviews/rev1.jpg',
        destination: 'Paris',
      },
    ],
  };

  const sampleManualItem: TestimonialItem = {
    name: 'Daryw M.',
    destination: 'Finlândia',
    text: 'Desde o primeiro contato, senti um acolhimento especial.',
    image: '/images/testimonials/daryw-m.svg',
    bg: 'bg-yellow-50',
    rotate: '-rotate-2',
    date: '2025-12-15',
    ratingValue: 5,
  };

  test('googleToDisplayReviews maps fields and sets source google', () => {
    const result = googleToDisplayReviews(sampleGoogleData.reviews);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'rev1');
    assert.equal(result[0].authorName, 'Maria S.');
    assert.equal(result[0].rating, 5);
    assert.equal(result[0].source, 'google');
    assert.equal(result[0].photoUrl, 'https://cdn.example.com/reviews/rev1.jpg');
    assert.equal(result[0].destination, 'Paris');
  });

  test('manualToDisplayReviews maps fields and sets source manual', () => {
    const result = manualToDisplayReviews([sampleManualItem]);
    assert.equal(result.length, 1);
    assert.equal(result[0].authorName, 'Daryw M.');
    assert.equal(result[0].source, 'manual');
    assert.equal(result[0].photoUrl, '/images/testimonials/daryw-m.svg');
    assert.equal(result[0].rating, 5);
    assert.equal(result[0].destination, 'Finlândia');
  });

  test('getDisplayReviews returns Google reviews when available', () => {
    const result = getDisplayReviews(sampleGoogleData);
    assert.equal(result[0].source, 'google');
  });

  test('getDisplayReviews returns manual fallback when Google is empty', () => {
    const emptyGoogle: GoogleReviewsData = {
      ...sampleGoogleData,
      reviews: [],
    };
    const result = getDisplayReviews(emptyGoogle);
    assert.ok(result.length > 0);
    assert.equal(result[0].source, 'manual');
  });

  test('getReviewSummary returns unfiltered metadata', () => {
    const summary = getReviewSummary(sampleGoogleData);
    assert.equal(summary!.averageRating, 4.9);
    assert.equal(summary!.totalReviews, 47);
  });

  test('getReviewSummary returns null when no Google data', () => {
    const empty: GoogleReviewsData = { ...sampleGoogleData, totalReviews: 0, reviews: [] };
    const summary = getReviewSummary(empty);
    assert.equal(summary, null);
  });

  test('getInitials handles first and last name', () => {
    assert.equal(getInitials('Daryw M.'), 'DM');
  });

  test('getInitials handles compound names', () => {
    assert.equal(getInitials('Rafa & Gabi'), 'RG');
  });

  test('getInitials handles single name', () => {
    assert.equal(getInitials('Ana'), 'A');
  });

  test('formatRelativeDate returns "hoje" for today', () => {
    const today = new Date().toISOString().split('T')[0];
    assert.equal(formatRelativeDate(today), 'hoje');
  });

  test('formatRelativeDate returns months for past months', () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    const result = formatRelativeDate(d.toISOString().split('T')[0]);
    assert.match(result, /há [23] meses/);
  });

  test('formatRelativeDate returns empty string for invalid date', () => {
    assert.equal(formatRelativeDate('not-a-date'), '');
  });

  test('formatRelativeDate returns "há 1 ano" for 12+ months', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    const result = formatRelativeDate(d.toISOString().split('T')[0]);
    assert.equal(result, 'há 1 ano');
  });
});
