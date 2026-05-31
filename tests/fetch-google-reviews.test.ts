import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  filterReviews,
  applyBlocklist,
  mergeAnnotations,
  sanitizeReviewText,
} from '../scripts/fetch-google-reviews.ts';

describe('fetch-google-reviews logic', () => {
  const rawReviews = [
    { id: '1', authorName: 'A', rating: 5, text: 'Great', date: '2026-01-01', photoUrl: '' },
    { id: '2', authorName: 'B', rating: 3, text: 'OK', date: '2026-01-02', photoUrl: '' },
    { id: '3', authorName: 'C', rating: 4, text: 'Good', date: '2026-01-03', photoUrl: '' },
    { id: '4', authorName: 'D', rating: 2, text: 'Bad', date: '2026-01-04', photoUrl: '' },
  ];

  test('filterReviews keeps only rating >= 4', () => {
    const result = filterReviews(rawReviews);
    assert.equal(result.length, 2);
    assert.ok(result.every((r) => r.rating >= 4));
  });

  test('applyBlocklist removes blocked IDs', () => {
    const filtered = filterReviews(rawReviews);
    const result = applyBlocklist(filtered, ['1']);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '3');
  });

  test('applyBlocklist with empty blocklist returns all', () => {
    const filtered = filterReviews(rawReviews);
    const result = applyBlocklist(filtered, []);
    assert.equal(result.length, 2);
  });

  test('mergeAnnotations adds destination from annotations', () => {
    const reviews = [{ id: '1', authorName: 'A', rating: 5, text: 'Great', date: '2026-01-01', photoUrl: '' }];
    const annotations = { '1': { destination: 'Paris' } };
    const result = mergeAnnotations(reviews, annotations);
    assert.equal(result[0].destination, 'Paris');
  });

  test('mergeAnnotations preserves reviews without annotations', () => {
    const reviews = [{ id: '2', authorName: 'B', rating: 5, text: 'Nice', date: '2026-01-01', photoUrl: '' }];
    const annotations = { '1': { destination: 'Paris' } };
    const result = mergeAnnotations(reviews, annotations);
    assert.equal(result[0].destination, undefined);
  });

  test('sanitizeReviewText encodes angle brackets and trims', () => {
    const result = sanitizeReviewText('  Hello <script>alert(1)</script>  ');
    assert.ok(!result.includes('<script>'));
    assert.ok(result.includes('&lt;script&gt;'));
    assert.ok(!result.startsWith(' '));
  });

  test('sanitizeReviewText handles empty input', () => {
    assert.equal(sanitizeReviewText(''), '');
  });
});
