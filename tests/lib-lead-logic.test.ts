import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeWhatsappNumber,
    maskEmail,
    maskPhone,
    maskName,
    normalizeNullable,
    normalizeUtms,
    normalizeTracking,
} from '../lib/lead-logic.ts';

// ─── normalizeWhatsappNumber ─────────────────────────────────────────────────

test('normalizeWhatsappNumber normalizes a Brazilian number with spaces and dashes', () => {
    assert.equal(normalizeWhatsappNumber(' (11) 98831-4487 '), '+5511988314487');
});

test('normalizeWhatsappNumber normalizes a number already prefixed with +55', () => {
    assert.equal(normalizeWhatsappNumber('+55 (11) 98831-4487'), '+5511988314487');
});

test('normalizeWhatsappNumber normalizes a raw 11-digit number without country code', () => {
    // 11 digits → prepends 55 → 13 digits total → valid
    assert.equal(normalizeWhatsappNumber('11988314487'), '+5511988314487');
});

test('normalizeWhatsappNumber accepts a number starting with country code digits', () => {
    // digits already start with '55', kept as-is
    assert.equal(normalizeWhatsappNumber('5511988314487'), '+5511988314487');
});

test('normalizeWhatsappNumber accepts a non-Brazilian international number', () => {
    // Starts with '+', digits used as-is: 11 digits → valid
    assert.equal(normalizeWhatsappNumber('+12025551234'), '+12025551234');
});

test('normalizeWhatsappNumber returns null for a number with too few digits', () => {
    // 5 raw digits + '55' = 7 digits → below MIN_PHONE_DIGITS (10)
    assert.equal(normalizeWhatsappNumber('12345'), null);
});

test('normalizeWhatsappNumber returns null for a number with too many digits', () => {
    // 16 digits → exceeds MAX_PHONE_DIGITS (15)
    assert.equal(normalizeWhatsappNumber('1234567890123456'), null);
});

test('normalizeWhatsappNumber returns null for non-string input', () => {
    assert.equal(normalizeWhatsappNumber(null), null);
    assert.equal(normalizeWhatsappNumber(undefined), null);
    assert.equal(normalizeWhatsappNumber(11988314487), null);
});

test('normalizeWhatsappNumber returns null for empty string', () => {
    assert.equal(normalizeWhatsappNumber(''), null);
    assert.equal(normalizeWhatsappNumber('   '), null);
});

// ─── maskEmail ───────────────────────────────────────────────────────────────

test('maskEmail masks the local part keeping only first character', () => {
    assert.equal(maskEmail('felipe@example.com'), 'f***@example.com');
});

test('maskEmail returns hidden for malformed email without @', () => {
    assert.equal(maskEmail('notanemail'), 'hidden');
});

// ─── maskPhone ───────────────────────────────────────────────────────────────

test('maskPhone masks middle digits keeping first 3 and last 3', () => {
    assert.equal(maskPhone('+5511988314487'), '+55***487');
});

test('maskPhone returns *** for very short phone', () => {
    assert.equal(maskPhone('123'), '***');
});

// ─── maskName ────────────────────────────────────────────────────────────────

test('maskName keeps only first character', () => {
    assert.equal(maskName('Felipe'), 'F***');
});

test('maskName returns *** for empty string', () => {
    assert.equal(maskName(''), '***');
    assert.equal(maskName('   '), '***');
});

// ─── normalizeNullable with control characters and whitespace ────────────────

test('normalizeNullable trims and returns null for whitespace-only input', () => {
    assert.equal(normalizeNullable('   '), null);
    assert.equal(normalizeNullable('\t\n'), null);
});

test('normalizeNullable escapes HTML entities in the value', () => {
    assert.equal(normalizeNullable('<b>test</b>'), '&lt;b&gt;test&lt;/b&gt;');
});

// ─── normalizeUtms ───────────────────────────────────────────────────────────

test('normalizeUtms extracts standard UTM parameters', () => {
    const result = normalizeUtms({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'trip',
        utm_term: 'rio',
        utm_content: 'ad-1',
    });

    assert.equal(result.utm_source, 'google');
    assert.equal(result.utm_medium, 'cpc');
    assert.equal(result.utm_campaign, 'trip');
    assert.equal(result.utm_term, 'rio');
    assert.equal(result.utm_content, 'ad-1');
});

test('normalizeUtms returns null for absent UTM fields', () => {
    const result = normalizeUtms({});

    assert.equal(result.utm_source, null);
    assert.equal(result.utm_medium, null);
    assert.equal(result.utm_campaign, null);
    assert.equal(result.utm_term, null);
    assert.equal(result.utm_content, null);
});

test('normalizeUtms returns null fields for non-object input', () => {
    const result = normalizeUtms(null);

    assert.equal(result.utm_source, null);
    assert.equal(result.utm_medium, null);
});

// ─── normalizeTracking with null/undefined BANT-like fields ─────────────────

test('normalizeTracking handles null and undefined tracking values without throwing', () => {
    const utms = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };

    const result = normalizeTracking({
        utm_source: null,
        cid: undefined,
        gclid: null,
        fbp: undefined,
    }, utms);

    assert.equal(result.utm_source, null);
    assert.equal(result.cid, null);
    assert.equal(result.gclid, null);
    assert.equal(result.fbp, null);
    assert.equal(result.extras, undefined);
});

test('normalizeTracking sanitizes XSS in tracking keys and values', () => {
    const utms = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };

    const result = normalizeTracking({
        extras: {
            '<script>key</script>': '<img src=x onerror=alert(1)>',
        },
    }, utms);

    const extraKeys = Object.keys(result.extras ?? {});
    assert.ok(extraKeys.every((k) => !k.includes('<')), 'extra keys must be sanitized');
    assert.ok(
        Object.values(result.extras ?? {}).every((v) => !v.includes('<')),
        'extra values must be sanitized',
    );
});

test('normalizeTracking falls back to UTMs for missing tracking UTM fields', () => {
    const utms = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer',
        utm_term: null,
        utm_content: null,
    };

    const result = normalizeTracking({}, utms);

    assert.equal(result.utm_source, 'google');
    assert.equal(result.utm_medium, 'cpc');
    assert.equal(result.utm_campaign, 'summer');
});
