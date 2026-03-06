import test from 'node:test';
import assert from 'node:assert/strict';
import { hasOversizedMessage, resolveMaxMessageLength } from '../lib/ai/utils.ts';

test('resolveMaxMessageLength should default to 4000', () => {
    assert.equal(resolveMaxMessageLength(undefined), 4000);
});

test('resolveMaxMessageLength should use provided env value', () => {
    assert.equal(resolveMaxMessageLength('6000'), 6000);
});

test('resolveMaxMessageLength should fallback to 4000 for invalid env values', () => {
    assert.equal(resolveMaxMessageLength('abc'), 4000);
    assert.equal(resolveMaxMessageLength('-10'), 4000);
    assert.equal(resolveMaxMessageLength('0'), 4000);
});

test('hasOversizedMessage should allow messages up to 4000 chars', () => {
    const contents = [
        { parts: [{ text: 'a'.repeat(4000) }] },
    ];
    assert.equal(hasOversizedMessage(contents, 4000), false);
});

test('hasOversizedMessage should block messages over 4000 chars', () => {
    const contents = [
        { parts: [{ text: 'a'.repeat(4001) }] },
    ];
    assert.equal(hasOversizedMessage(contents, 4000), true);
});
