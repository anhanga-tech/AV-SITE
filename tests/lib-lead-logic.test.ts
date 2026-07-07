import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeWhatsappNumber,
    maskEmail,
    maskPhone,
    maskName,
    cleanString,
    splitFullName,
    normalizeNullable,
    normalizeUtms,
    normalizeTracking,
} from '../lib/lead-logic.ts';

// ─── splitFullName ────────────────────────────────────────────────────────────

test('splitFullName preserva um sobrenome explícito quando fornecido', () => {
    assert.deepEqual(splitFullName('João', 'Silva'), { firstName: 'João', lastName: 'Silva' });
});

test('splitFullName deriva o sobrenome do nome completo quando não há explícito', () => {
    assert.deepEqual(splitFullName('Maria Silva'), { firstName: 'Maria', lastName: 'Silva' });
});

test('splitFullName junta os tokens restantes como sobrenome', () => {
    assert.deepEqual(splitFullName('Ana Maria de Souza'), { firstName: 'Ana', lastName: 'Maria de Souza' });
});

test('splitFullName dá precedência ao sobrenome explícito sobre o nome completo', () => {
    assert.deepEqual(splitFullName('João Silva', 'Souza'), { firstName: 'João', lastName: 'Souza' });
});

test('splitFullName colapsa espaços múltiplos e faz trim', () => {
    assert.deepEqual(splitFullName('  João   Pedro  ', ''), { firstName: 'João', lastName: 'Pedro' });
});

test('splitFullName com só o primeiro nome resulta em sobrenome vazio', () => {
    assert.deepEqual(splitFullName('João', ''), { firstName: 'João', lastName: '' });
});

test('splitFullName com nome vazio não inventa nome (sem fallback)', () => {
    assert.deepEqual(splitFullName('   ', '  '), { firstName: '', lastName: '' });
});

// ─── cleanString ──────────────────────────────────────────────────────────────

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
    assert.equal(result, 'a'.repeat(10000));
});

test('cleanString should sanitize after truncating, not before (no XSS bypass)', () => {
    // Payload: 9999 "a"s followed by "<script>" — must still be escaped after truncation.
    // Truncation happens first (to 10000 chars), then sanitization runs on the truncated
    // string. A "<" at the truncation boundary becomes "&lt;" (4 chars), so the final
    // length may slightly exceed 10000 by up to 3 chars (worst case: one entity expansion).
    const payload = 'a'.repeat(9999) + '<script>';
    const result = cleanString(payload);
    assert.ok(result.length <= 10004, `result grew unexpectedly: ${result.length}`);
    assert.ok(result.endsWith('&lt;'), 'truncated tail must still be entity-escaped');
    assert.ok(!result.includes('<'), 'raw < must not survive truncation');
});

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

test('normalizeWhatsappNumber returns null for implausibly long input before regex runs', () => {
    // Guards the raw-length cap (MAX_PHONE_RAW_LENGTH): an unbounded string must
    // be rejected up front so no regex pass runs over it (DoS hardening). This is
    // the shared chokepoint that also protects submit-contact and submit-quiz.
    assert.equal(normalizeWhatsappNumber('+55' + '9'.repeat(4000)), null);
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

test('normalizeNullable should return null for non-string input', () => {
    assert.equal(normalizeNullable(null), null);
    assert.equal(normalizeNullable(42), null);
});

test('normalizeNullable should respect maxLength after truncation', () => {
    const result = normalizeNullable('a'.repeat(300), 255);
    assert.ok(result);
    assert.equal(result, 'a'.repeat(255));
});

test('normalizeNullable should truncate strings longer than 10000 chars before sanitization', () => {
    const long = 'a'.repeat(10001);
    const result = normalizeNullable(long, 20000);
    assert.ok(result);
    assert.equal(result, 'a'.repeat(10000));
});

test('normalizeNullable should sanitize after truncating (no XSS bypass)', () => {
    const payload = 'a'.repeat(9999) + '<script>';
    const result = normalizeNullable(payload, 20000);
    assert.ok(result !== null);
    assert.ok(!result.includes('<'), 'raw < must not survive truncation');
    assert.ok(result.endsWith('&lt;'), 'truncated tail must still be entity-escaped');
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

test('normalizeTracking caps extras at 15 keys even for large unbounded objects', () => {
    const utms = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };

    const extras: Record<string, string> = {};
    for (let i = 0; i < 5000; i += 1) {
        extras[`extra_${i}`] = `value_${i}`;
    }

    const result = normalizeTracking({ extras }, utms);

    assert.equal(Object.keys(result.extras ?? {}).length, 15, 'extras must be capped at 15 entries');
});

test('normalizeTracking caps extras drawn from top-level unknown keys too', () => {
    const utms = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };

    const source: Record<string, unknown> = {};
    for (let i = 0; i < 5000; i += 1) {
        source[`custom_${i}`] = `value_${i}`;
    }

    const result = normalizeTracking(source, utms);

    assert.equal(Object.keys(result.extras ?? {}).length, 15, 'top-level extras must be capped at 15 entries');
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
