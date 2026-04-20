import test from 'node:test';
import assert from 'node:assert/strict';
import { hasOversizedMessage, hasOversizedPayload, MAX_CONTENTS_TOTAL_LENGTH, resolveMaxMessageLength } from '../lib/ai/utils.ts';

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

test('hasOversizedPayload should allow payload under the limit', () => {
    const contents = [{ parts: [{ text: 'a'.repeat(100) }] }];
    assert.equal(hasOversizedPayload(contents), false);
});

test('hasOversizedPayload should block payload exceeding MAX_CONTENTS_TOTAL_LENGTH', () => {
    const bigText = 'a'.repeat(MAX_CONTENTS_TOTAL_LENGTH + 1);
    const contents = [{ parts: [{ text: bigText }] }];
    assert.equal(hasOversizedPayload(contents), true);
});

test('hasOversizedPayload should accept payload exactly at the limit', () => {
    // Build a contents array whose serialized JSON length equals MAX_CONTENTS_TOTAL_LENGTH
    const wrapper = '[{"parts":[{"text":"';
    const suffix = '"}]}]';
    const textLength = MAX_CONTENTS_TOTAL_LENGTH - wrapper.length - suffix.length;
    const contents = [{ parts: [{ text: 'a'.repeat(textLength) }] }];
    assert.equal(JSON.stringify(contents).length, MAX_CONTENTS_TOTAL_LENGTH);
    assert.equal(hasOversizedPayload(contents), false);
});
