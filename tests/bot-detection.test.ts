import test from 'node:test';
import assert from 'node:assert/strict';
import {
    detectBot,
    HONEYPOT_FIELD,
    ELAPSED_TIME_FIELD,
    MIN_FORM_ELAPSED_MS,
} from '../lib/bot-detection.ts';

// --- honeypot -----------------------------------------------------------------

test('detectBot flags a filled honeypot as a bot', () => {
    const result = detectBot({ [HONEYPOT_FIELD]: 'http://spam.example', [ELAPSED_TIME_FIELD]: 10_000 });
    assert.deepEqual(result, { bot: true, reason: 'honeypot' });
});

test('detectBot treats an empty/whitespace honeypot as human', () => {
    assert.deepEqual(detectBot({ [HONEYPOT_FIELD]: '' }), { bot: false });
    assert.deepEqual(detectBot({ [HONEYPOT_FIELD]: '   ' }), { bot: false });
});

test('detectBot flags a non-string truthy honeypot value', () => {
    assert.deepEqual(detectBot({ [HONEYPOT_FIELD]: 123 }), { bot: true, reason: 'honeypot' });
});

test('detectBot ignores a missing honeypot field', () => {
    assert.deepEqual(detectBot({ [ELAPSED_TIME_FIELD]: 10_000 }), { bot: false });
});

// --- timing -------------------------------------------------------------------

test('detectBot flags a submit faster than the minimum elapsed window', () => {
    const result = detectBot({ [ELAPSED_TIME_FIELD]: MIN_FORM_ELAPSED_MS - 1 });
    assert.deepEqual(result, { bot: true, reason: 'timing' });
});

test('detectBot allows a submit exactly at the minimum elapsed window', () => {
    assert.deepEqual(detectBot({ [ELAPSED_TIME_FIELD]: MIN_FORM_ELAPSED_MS }), { bot: false });
});

test('detectBot allows a slow, human-paced submit', () => {
    assert.deepEqual(detectBot({ [ELAPSED_TIME_FIELD]: 30_000 }), { bot: false });
});

test('detectBot fails open on a negative elapsed duration (clock oddity)', () => {
    // Cannot mean "too fast", so never block.
    assert.deepEqual(detectBot({ [ELAPSED_TIME_FIELD]: -5_000 }), { bot: false });
});

test('detectBot ignores a non-finite or non-numeric elapsedMs', () => {
    assert.deepEqual(detectBot({ [ELAPSED_TIME_FIELD]: Number.NaN }), { bot: false });
    assert.deepEqual(detectBot({ [ELAPSED_TIME_FIELD]: '123' }), { bot: false });
    assert.deepEqual(detectBot({ [ELAPSED_TIME_FIELD]: null }), { bot: false });
});

// --- honeypot takes precedence + non-object inputs ----------------------------

test('detectBot reports honeypot first when both signals fire', () => {
    const result = detectBot({ [HONEYPOT_FIELD]: 'x', [ELAPSED_TIME_FIELD]: 100 });
    assert.deepEqual(result, { bot: true, reason: 'honeypot' });
});

test('detectBot never blocks on non-object bodies', () => {
    assert.deepEqual(detectBot(null), { bot: false });
    assert.deepEqual(detectBot(undefined), { bot: false });
    assert.deepEqual(detectBot('string'), { bot: false });
    assert.deepEqual(detectBot(42), { bot: false });
});
