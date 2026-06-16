import test from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeEqual } from '../lib/security.ts';

test('timingSafeEqual returns true for identical strings', () => {
    assert.equal(timingSafeEqual('abc123', 'abc123'), true);
});

test('timingSafeEqual returns true for two empty strings', () => {
    assert.equal(timingSafeEqual('', ''), true);
});

test('timingSafeEqual returns false for same-length strings that differ', () => {
    assert.equal(timingSafeEqual('abc123', 'abc124'), false);
    assert.equal(timingSafeEqual('abc123', 'xbc123'), false);
});

test('timingSafeEqual returns false for strings of different length', () => {
    assert.equal(timingSafeEqual('abc', 'abcd'), false);
    assert.equal(timingSafeEqual('abcd', 'abc'), false);
    assert.equal(timingSafeEqual('', 'a'), false);
});

test('timingSafeEqual distinguishes a single differing character', () => {
    const base = 'a'.repeat(36);
    const altered = `${'a'.repeat(35)}b`;
    assert.equal(timingSafeEqual(base, altered), false);
    assert.equal(timingSafeEqual(base, base), true);
});
