import test from 'node:test';
import assert from 'node:assert/strict';
import { extractUtms, normalizeLeadTracking } from '../lib/tracking-normalization.ts';

// Regression coverage for issue #1148: lead/contact/quiz/waitlist capture hooks
// each carried their own copy of this attribution-shaping logic and had
// drifted (useContactForm sanitized via cleanString; the other three only
// trimmed). This is the one shared, pure contract all four now consume —
// table-driven so every supported identifier and edge case is explicit.

test('normalizeLeadTracking projects every known key into the LeadTracking shape', () => {
    const tracking = normalizeLeadTracking({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer',
        utm_term: 'praia',
        utm_content: 'ad-1',
        cid: 'ga-cid-1',
        sid: 'ga-sid-1',
        gclid: 'g-click-1',
        fbclid: 'fb-click-1',
        msclkid: 'ms-click-1',
        ttclid: 'tt-click-1',
        wbraid: 'wb-1',
        gbraid: 'gb-1',
        fbc: 'fb.1.111.aaa',
        fbp: 'fb.1.222.bbb',
    });

    assert.deepEqual(tracking, {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer',
        utm_term: 'praia',
        utm_content: 'ad-1',
        cid: 'ga-cid-1',
        sid: 'ga-sid-1',
        gclid: 'g-click-1',
        fbclid: 'fb-click-1',
        msclkid: 'ms-click-1',
        ttclid: 'tt-click-1',
        wbraid: 'wb-1',
        gbraid: 'gb-1',
        fbc: 'fb.1.111.aaa',
        fbp: 'fb.1.222.bbb',
        extras: undefined,
    });
});

test('normalizeLeadTracking treats null/undefined/empty source as all-absent', () => {
    for (const source of [null, undefined, {}]) {
        const tracking = normalizeLeadTracking(source);
        assert.equal(tracking.utm_source, null);
        assert.equal(tracking.gclid, null);
        assert.equal(tracking.extras, undefined);
    }
});

test('normalizeLeadTracking trims whitespace and treats whitespace-only values as absent', () => {
    const tracking = normalizeLeadTracking({
        utm_source: '  instagram  ',
        utm_medium: '   ',
        gclid: '\t\n',
    });

    assert.equal(tracking.utm_source, 'instagram');
    assert.equal(tracking.utm_medium, null, 'whitespace-only value normalizes to null');
    assert.equal(tracking.gclid, null);
});

test('normalizeLeadTracking bucket unknown keys into extras, dropping blank ones', () => {
    const tracking = normalizeLeadTracking({
        ref: 'Maria Silva',
        hsa_acc: '12345',
        hsa_cam: '67890',
        empty_extra: '   ',
    });

    assert.deepEqual(tracking.extras, {
        ref: 'Maria Silva',
        hsa_acc: '12345',
        hsa_cam: '67890',
    });
});

test('normalizeLeadTracking omits extras entirely when there are no unknown keys', () => {
    const tracking = normalizeLeadTracking({ utm_source: 'google' });
    assert.equal(tracking.extras, undefined);
});

test('normalizeLeadTracking escapes < and > (XSS-adjacent characters) in any field, known or extra', () => {
    const tracking = normalizeLeadTracking({
        utm_source: '<script>alert(1)</script>',
        ref: '<b>bold</b>',
    });

    assert.equal(tracking.utm_source, '&lt;script&gt;alert(1)&lt;/script&gt;');
    assert.equal(tracking.extras?.ref, '&lt;b&gt;bold&lt;/b&gt;');
});

test('normalizeLeadTracking bounds abusively long values to 10000 chars (shared with lib/lead-logic cleanString)', () => {
    const longValue = 'a'.repeat(20000);
    const tracking = normalizeLeadTracking({ utm_campaign: longValue, weird_extra_key: longValue });

    assert.equal(tracking.utm_campaign?.length, 10000);
    assert.equal(tracking.extras?.weird_extra_key.length, 10000);
});

test('normalizeLeadTracking ignores non-string values on both known and unknown keys', () => {
    const tracking = normalizeLeadTracking({
        utm_source: 42 as unknown as string,
        gclid: null as unknown as string,
        weird: { nested: true } as unknown as string,
    });

    assert.equal(tracking.utm_source, null);
    assert.equal(tracking.gclid, null);
    assert.equal(tracking.extras, undefined);
});

test('extractUtms projects only the 5 UTM fields, preserving null', () => {
    const tracking = normalizeLeadTracking({ utm_source: 'google', cid: 'ga-1' });
    const utms = extractUtms(tracking);

    assert.deepEqual(utms, {
        utm_source: 'google',
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
    });
    assert.equal('cid' in utms, false, 'extractUtms must not leak non-UTM fields');
});
