import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWaitlistPayload } from '../lib/waitlist-logic.ts';

const VALID_BASE = {
    name: 'Ana Maria',
    email: 'ana@example.com',
    sourcePage: '/lollapalooza',
    utms: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'lolla2027',
        utm_term: null,
        utm_content: null,
    },
};

test('validateWaitlistPayload rejects null payload', () => {
    const result = validateWaitlistPayload(null);
    assert.equal(result.valid, false);
});

test('validateWaitlistPayload rejects non-object payload', () => {
    const result = validateWaitlistPayload('not an object');
    assert.equal(result.valid, false);
});

test('validateWaitlistPayload rejects missing name', () => {
    const { name: _omit, ...without } = VALID_BASE;
    const result = validateWaitlistPayload(without);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'Campos obrigatórios ausentes.');
});

test('validateWaitlistPayload rejects empty name', () => {
    const result = validateWaitlistPayload({ ...VALID_BASE, name: '   ' });
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'Campos obrigatórios ausentes.');
});

test('validateWaitlistPayload rejects missing email', () => {
    const { email: _omit, ...without } = VALID_BASE;
    const result = validateWaitlistPayload(without);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'Campos obrigatórios ausentes.');
});

test('validateWaitlistPayload rejects missing sourcePage', () => {
    const { sourcePage: _omit, ...without } = VALID_BASE;
    const result = validateWaitlistPayload(without);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'Campos obrigatórios ausentes.');
});

test('validateWaitlistPayload rejects invalid email format', () => {
    const result = validateWaitlistPayload({ ...VALID_BASE, email: 'not-an-email' });
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.error, 'Email inválido.');
});

test('validateWaitlistPayload rejects email without domain', () => {
    const result = validateWaitlistPayload({ ...VALID_BASE, email: 'ana@' });
    assert.equal(result.valid, false);
});

test('validateWaitlistPayload lowercases email', () => {
    const result = validateWaitlistPayload({ ...VALID_BASE, email: 'ANA@EXAMPLE.COM' });
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.data.email, 'ana@example.com');
});

test('validateWaitlistPayload trims whitespace from name', () => {
    const result = validateWaitlistPayload({ ...VALID_BASE, name: '  Ana Maria  ' });
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.data.name, 'Ana Maria');
});

test('validateWaitlistPayload trims whitespace from email before lowercasing', () => {
    const result = validateWaitlistPayload({ ...VALID_BASE, email: '  ANA@example.com  ' });
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.data.email, 'ana@example.com');
});

test('validateWaitlistPayload extracts UTM fields', () => {
    const result = validateWaitlistPayload(VALID_BASE);
    assert.equal(result.valid, true);
    if (result.valid) {
        assert.equal(result.data.utms.utm_source, 'google');
        assert.equal(result.data.utms.utm_medium, 'cpc');
        assert.equal(result.data.utms.utm_campaign, 'lolla2027');
    }
});

test('validateWaitlistPayload returns correct shape on happy path', () => {
    const result = validateWaitlistPayload(VALID_BASE);
    assert.equal(result.valid, true);
    if (result.valid) {
        assert.equal(result.data.name, 'Ana Maria');
        assert.equal(result.data.email, 'ana@example.com');
        assert.equal(result.data.sourcePage, '/lollapalooza');
        assert.ok('utms' in result.data);
        assert.ok('tracking' in result.data);
    }
});

test('validateWaitlistPayload handles missing utms gracefully', () => {
    const { utms: _omit, ...without } = VALID_BASE;
    const result = validateWaitlistPayload(without);
    assert.equal(result.valid, true);
    if (result.valid) {
        assert.equal(result.data.utms.utm_source, null);
        assert.equal(result.data.utms.utm_medium, null);
    }
});

test('validateWaitlistPayload name is capped at 160 characters', () => {
    const longName = 'A'.repeat(200);
    const result = validateWaitlistPayload({ ...VALID_BASE, name: longName });
    assert.equal(result.valid, true);
    if (result.valid) assert.equal(result.data.name.length, 160);
});
