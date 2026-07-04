import test from 'node:test';
import assert from 'node:assert/strict';
import {
    detectBot,
    HONEYPOT_FIELD,
    RENDERED_AT_FIELD,
    MIN_FORM_ELAPSED_MS,
} from '../lib/bot-detection.ts';

const NOW = 1_700_000_000_000;

// --- honeypot -----------------------------------------------------------------

test('detectBot flags a filled honeypot as a bot', () => {
    const result = detectBot({ [HONEYPOT_FIELD]: 'http://spam.example', [RENDERED_AT_FIELD]: NOW - 10_000 }, NOW);
    assert.deepEqual(result, { bot: true, reason: 'honeypot' });
});

test('detectBot treats an empty/whitespace honeypot as human', () => {
    assert.deepEqual(detectBot({ [HONEYPOT_FIELD]: '' }, NOW), { bot: false });
    assert.deepEqual(detectBot({ [HONEYPOT_FIELD]: '   ' }, NOW), { bot: false });
});

test('detectBot flags a non-string truthy honeypot value', () => {
    assert.deepEqual(detectBot({ [HONEYPOT_FIELD]: 123 }, NOW), { bot: true, reason: 'honeypot' });
});

test('detectBot ignores a missing honeypot field', () => {
    assert.deepEqual(detectBot({ [RENDERED_AT_FIELD]: NOW - 10_000 }, NOW), { bot: false });
});

// --- timing -------------------------------------------------------------------

test('detectBot flags a submit faster than the minimum elapsed window', () => {
    const result = detectBot({ [RENDERED_AT_FIELD]: NOW - (MIN_FORM_ELAPSED_MS - 1) }, NOW);
    assert.deepEqual(result, { bot: true, reason: 'timing' });
});

test('detectBot allows a submit exactly at the minimum elapsed window', () => {
    assert.deepEqual(detectBot({ [RENDERED_AT_FIELD]: NOW - MIN_FORM_ELAPSED_MS }, NOW), { bot: false });
});

test('detectBot allows a slow, human-paced submit', () => {
    assert.deepEqual(detectBot({ [RENDERED_AT_FIELD]: NOW - 30_000 }, NOW), { bot: false });
});

test('detectBot fails open on clock skew (client ahead of the edge)', () => {
    // Negative elapsed: never block, since it cannot mean "too fast".
    assert.deepEqual(detectBot({ [RENDERED_AT_FIELD]: NOW + 5_000 }, NOW), { bot: false });
});

test('detectBot ignores a non-finite or non-numeric renderedAt', () => {
    assert.deepEqual(detectBot({ [RENDERED_AT_FIELD]: Number.NaN }, NOW), { bot: false });
    assert.deepEqual(detectBot({ [RENDERED_AT_FIELD]: '123' }, NOW), { bot: false });
    assert.deepEqual(detectBot({ [RENDERED_AT_FIELD]: null }, NOW), { bot: false });
});

// --- honeypot takes precedence + non-object inputs ----------------------------

test('detectBot reports honeypot first when both signals fire', () => {
    const result = detectBot(
        { [HONEYPOT_FIELD]: 'x', [RENDERED_AT_FIELD]: NOW - 100 },
        NOW,
    );
    assert.deepEqual(result, { bot: true, reason: 'honeypot' });
});

test('detectBot never blocks on non-object bodies', () => {
    assert.deepEqual(detectBot(null, NOW), { bot: false });
    assert.deepEqual(detectBot(undefined, NOW), { bot: false });
    assert.deepEqual(detectBot('string', NOW), { bot: false });
    assert.deepEqual(detectBot(42, NOW), { bot: false });
});
