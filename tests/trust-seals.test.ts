import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReviewCountLabel } from '../components/links/reviewFormatting.ts';

test('formatReviewCountLabel omite a contagem quando totalReviews é 0', () => {
    assert.equal(formatReviewCountLabel(0), null);
});

test('formatReviewCountLabel usa singular "avaliação" para 1 review', () => {
    assert.equal(formatReviewCountLabel(1), '1 avaliação');
});

test('formatReviewCountLabel usa plural "avaliações" para 2+ reviews', () => {
    assert.equal(formatReviewCountLabel(3), '3 avaliações');
});
