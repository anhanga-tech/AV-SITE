import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isPreparedSubmitLeadRequest,
    extractUtms,
    buildLeadWhatsAppMessage,
    createLeadEventId,
    type LeadDraft,
} from '../hooks/useLeadCapture.ts';
import type { SubmitLeadRequest } from '../types/leadCapture.ts';

function validPayload(overrides?: Partial<SubmitLeadRequest>): SubmitLeadRequest {
    return {
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@example.com',
        whatsapp: '+5511988314487',
        bantSummary: 'Need: praia | Authority: casal | Budget: 15k | Timeline: outubro',
        destination: 'Porto de Galinhas',
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'praia',
            utm_term: null,
            utm_content: null,
        },
        tracking: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'praia',
            utm_term: null,
            utm_content: null,
            cid: null,
            sid: null,
            gclid: null,
            fbclid: null,
            msclkid: null,
            ttclid: null,
            wbraid: null,
            gbraid: null,
            fbc: null,
            fbp: null,
        },
        ...overrides,
    };
}

// ─── isPreparedSubmitLeadRequest ─────────────────────────────────────────────

test('isPreparedSubmitLeadRequest returns true for a complete valid payload', () => {
    assert.equal(isPreparedSubmitLeadRequest(validPayload()), true);
});

test('isPreparedSubmitLeadRequest returns false when email is missing', () => {
    const payload = { ...validPayload(), email: undefined } as unknown as SubmitLeadRequest;
    assert.equal(isPreparedSubmitLeadRequest(payload), false);
});

test('isPreparedSubmitLeadRequest returns false for null', () => {
    assert.equal(isPreparedSubmitLeadRequest(null as unknown as SubmitLeadRequest), false);
});

test('isPreparedSubmitLeadRequest returns false for primitive values', () => {
    assert.equal(isPreparedSubmitLeadRequest(42 as unknown as SubmitLeadRequest), false);
    assert.equal(isPreparedSubmitLeadRequest('string' as unknown as SubmitLeadRequest), false);
});

test('isPreparedSubmitLeadRequest returns false when utms is missing', () => {
    const payload = { ...validPayload(), utms: undefined } as unknown as SubmitLeadRequest;
    assert.equal(isPreparedSubmitLeadRequest(payload), false);
});

test('isPreparedSubmitLeadRequest passes even when optional UTM fields are null', () => {
    const payload = validPayload({
        utms: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
    });
    assert.equal(isPreparedSubmitLeadRequest(payload), true);
});

test('isPreparedSubmitLeadRequest passes without event_id (optional field)', () => {
    const payload = validPayload({ event_id: undefined });
    assert.equal(isPreparedSubmitLeadRequest(payload), true);
});

// ─── extractUtms ─────────────────────────────────────────────────────────────

test('extractUtms extracts UTM fields from a tracking object', () => {
    const tracking = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer',
        utm_term: 'praia',
        utm_content: 'ad-1',
        cid: 'cid-123',
        sid: null,
        gclid: null,
        fbclid: null,
        msclkid: null,
        ttclid: null,
        wbraid: null,
        gbraid: null,
        fbc: null,
        fbp: null,
    };

    const result = extractUtms(tracking);

    assert.equal(result.utm_source, 'google');
    assert.equal(result.utm_medium, 'cpc');
    assert.equal(result.utm_campaign, 'summer');
    assert.equal(result.utm_term, 'praia');
    assert.equal(result.utm_content, 'ad-1');
    assert.equal('cid' in result, false, 'extractUtms should not include non-UTM fields');
});

test('extractUtms preserves null UTM values', () => {
    const tracking = {
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        cid: null,
        sid: null,
        gclid: null,
        fbclid: null,
        msclkid: null,
        ttclid: null,
        wbraid: null,
        gbraid: null,
        fbc: null,
        fbp: null,
    };

    const result = extractUtms(tracking);

    assert.equal(result.utm_source, null);
    assert.equal(result.utm_medium, null);
});

// ─── buildLeadWhatsAppMessage ─────────────────────────────────────────────────

test('buildLeadWhatsAppMessage includes origin, destination, and dates', () => {
    const lead: LeadDraft = {
        firstName: 'Ana',
        lastName: 'Lima',
        email: 'ana@example.com',
        whatsapp: '+5521988001234',
        bantSummary: 'Need: aventura',
        origin: 'Rio de Janeiro',
        destination: 'Chapada dos Veadeiros',
        dates: 'novembro 2026',
        baggagePreference: '',
    };

    const message = buildLeadWhatsAppMessage(lead);

    assert.match(message, /Rio de Janeiro/);
    assert.match(message, /Chapada dos Veadeiros/);
    assert.match(message, /novembro 2026/);
});

test('buildLeadWhatsAppMessage uses fallback text when origin or destination is empty', () => {
    const lead: LeadDraft = {
        firstName: 'Carlos',
        lastName: 'Mota',
        email: '',
        whatsapp: '',
        bantSummary: '',
        origin: '',
        destination: '',
        dates: '',
        baggagePreference: '',
    };

    const message = buildLeadWhatsAppMessage(lead);

    assert.match(message, /A definir/);
});

// ─── createLeadEventId ────────────────────────────────────────────────────────

test('createLeadEventId returns a non-empty string prefixed with lead_', () => {
    const id = createLeadEventId();
    assert.equal(typeof id, 'string');
    assert.match(id, /^lead_/);
    assert.ok(id.length > 5);
});

test('createLeadEventId generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 10 }, () => createLeadEventId()));
    assert.equal(ids.size, 10, 'each call should produce a unique ID');
});
