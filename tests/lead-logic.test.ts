import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanString, normalizeNullable } from '../lib/lead-logic.ts';

// cleanString

test('cleanString should return empty string for non-string input', () => {
    assert.equal(cleanString(null), '');
    assert.equal(cleanString(42), '');
    assert.equal(cleanString(undefined), '');
});

test('cleanString should escape HTML entities', () => {
    assert.equal(cleanString('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('cleanString should trim whitespace', () => {
    assert.equal(cleanString('  hello  '), 'hello');
});

test('cleanString should truncate strings longer than 10000 chars', () => {
    const long = 'a'.repeat(10001);
    const result = cleanString(long);
    assert.equal(result.length, 10000);
});

test('cleanString should sanitize after truncating, not before (no XSS bypass)', () => {
    // Payload: 9999 "a"s followed by "<script>" — must still be escaped after truncation
    const payload = 'a'.repeat(9999) + '<script>';
    const result = cleanString(payload);
    assert.equal(result.length, 10000);
    assert.ok(result.endsWith('&lt;'), 'truncated tail must still be entity-escaped');
    assert.ok(!result.includes('<'), 'raw < must not survive truncation');
});

// normalizeNullable

test('normalizeNullable should return null for non-string input', () => {
    assert.equal(normalizeNullable(null), null);
    assert.equal(normalizeNullable(42), null);
});

test('normalizeNullable should return null for empty/whitespace-only string', () => {
    assert.equal(normalizeNullable(''), null);
    assert.equal(normalizeNullable('   '), null);
});

test('normalizeNullable should escape HTML entities', () => {
    assert.equal(normalizeNullable('<b>test</b>'), '&lt;b&gt;test&lt;/b&gt;');
});

test('normalizeNullable should respect maxLength after truncation', () => {
    const result = normalizeNullable('a'.repeat(300), 255);
    assert.equal(result?.length, 255);
});

test('normalizeNullable should truncate strings longer than 10000 chars before sanitization', () => {
    const long = 'a'.repeat(10001);
    const result = normalizeNullable(long, 20000);
    assert.equal(result?.length, 10000);
});

test('normalizeNullable should sanitize after truncating (no XSS bypass)', () => {
    const payload = 'a'.repeat(9999) + '<script>';
    const result = normalizeNullable(payload, 20000);
    assert.ok(result !== null);
    assert.ok(!result.includes('<'), 'raw < must not survive truncation');
    assert.ok(result.endsWith('&lt;'), 'truncated tail must still be entity-escaped');
});
