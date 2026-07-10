import test from 'node:test';
import assert from 'node:assert/strict';
import { createNpsInviteToken, verifyNpsInviteToken } from '../lib/nps-invite.ts';

const SECRET = 'a-test-secret';

test('createNpsInviteToken + verifyNpsInviteToken round-trips a valid invitation', async () => {
    const token = await createNpsInviteToken({ email: 'ana@example.com', firstname: 'Ana' }, SECRET);
    const result = await verifyNpsInviteToken(token, SECRET);

    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.payload.email, 'ana@example.com');
    assert.equal(result.payload.firstname, 'Ana');
    assert.ok(result.payload.exp > Date.now());
    assert.ok(result.payload.jti.length > 0);
});

test('createNpsInviteToken normalizes email to lowercase and trims firstname', async () => {
    const token = await createNpsInviteToken({ email: '  Ana@EXAMPLE.com  ', firstname: '  Ana Silva  ' }, SECRET);
    const result = await verifyNpsInviteToken(token, SECRET);

    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.payload.email, 'ana@example.com');
    assert.equal(result.payload.firstname, 'Ana Silva');
});

test('verifyNpsInviteToken rejects a token signed with a different secret', async () => {
    const token = await createNpsInviteToken({ email: 'ana@example.com', firstname: 'Ana' }, SECRET);
    const result = await verifyNpsInviteToken(token, 'a-different-secret');

    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.reason, 'signature_mismatch');
});

test('verifyNpsInviteToken rejects an altered payload even with a correct-looking signature', async () => {
    const token = await createNpsInviteToken({ email: 'ana@example.com', firstname: 'Ana' }, SECRET);
    const [payloadB64, signature] = token.split('.');
    // Flip a character in the payload without re-signing.
    const tampered = `${payloadB64.slice(0, -1)}${payloadB64.slice(-1) === 'a' ? 'b' : 'a'}.${signature}`;

    const result = await verifyNpsInviteToken(tampered, SECRET);
    assert.equal(result.valid, false);
});

test('verifyNpsInviteToken rejects an expired token', async () => {
    const token = await createNpsInviteToken({ email: 'ana@example.com', firstname: 'Ana', expiresInMs: -1000 }, SECRET);
    const result = await verifyNpsInviteToken(token, SECRET);

    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.reason, 'expired');
});

test('verifyNpsInviteToken rejects a malformed token (wrong shape)', async () => {
    for (const malformed of ['', 'no-dot-separator', 'a.b.c', '.', 'a.']) {
        const result = await verifyNpsInviteToken(malformed, SECRET);
        assert.equal(result.valid, false, `expected "${malformed}" to be rejected`);
    }
});

test('verifyNpsInviteToken rejects a payload missing required fields', async () => {
    const encoder = new TextEncoder();
    const fakePayload = btoa(String.fromCharCode(...encoder.encode(JSON.stringify({ email: 'ana@example.com' }))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = await verifyNpsInviteToken(`${fakePayload}.somesignature`, SECRET);

    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.reason, 'malformed');
});

test('each created token has a distinct jti', async () => {
    const tokenA = await createNpsInviteToken({ email: 'ana@example.com', firstname: 'Ana' }, SECRET);
    const tokenB = await createNpsInviteToken({ email: 'ana@example.com', firstname: 'Ana' }, SECRET);

    const resultA = await verifyNpsInviteToken(tokenA, SECRET);
    const resultB = await verifyNpsInviteToken(tokenB, SECRET);
    assert.equal(resultA.valid, true);
    assert.equal(resultB.valid, true);
    if (!resultA.valid || !resultB.valid) return;
    assert.notEqual(resultA.payload.jti, resultB.payload.jti);
});
