import test from 'node:test';
import assert from 'node:assert/strict';
import { NpsInviteTokenSchema, SubmitNpsBodySchema } from '../lib/schemas/submit-nps.ts';

// Identity (firstname/email) is no longer part of the wire-format body —
// it's derived server-side from the verified invitation token (issue #1137).
// See tests/submit-nps.test.ts for token verification and tests/nps-invite.test.ts
// for the signing/verification module itself. The token isn't in the body
// either — it travels in the HttpOnly invite cookie (issue #1666) and is
// shape-checked on its own by NpsInviteTokenSchema.
const VALID = {
    score: 9,
    reason: 'Ótimo atendimento',
    highlight: 'A viagem ao Japão',
};

test('aceita payload válido completo', () => {
    const result = SubmitNpsBodySchema.safeParse(VALID);
    assert.equal(result.success, true);
});

test('aceita payload sem highlight (usa default vazio)', () => {
    const { highlight: _h, ...without } = VALID;
    const result = SubmitNpsBodySchema.safeParse(without);
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.highlight, '');
    }
});

test('aceita score = 0', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, score: 0 });
    assert.equal(result.success, true);
});

test('aceita score = 10', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, score: 10 });
    assert.equal(result.success, true);
});

test('rejeita score negativo', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, score: -1 });
    assert.equal(result.success, false);
});

test('rejeita score acima de 10', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, score: 11 });
    assert.equal(result.success, false);
});

test('rejeita score não inteiro', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, score: 7.5 });
    assert.equal(result.success, false);
});

test('rejeita score como string', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, score: '9' });
    assert.equal(result.success, false);
});

test('o corpo não carrega o token: um token enviado no body é descartado', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, token: 'opaque-signed-token-value' });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal('token' in result.data, false);
    }
});

test('token do cookie: aceita valor opaco', () => {
    assert.equal(NpsInviteTokenSchema.safeParse('opaque.signed-token').success, true);
});

test('token do cookie: rejeita vazio ou só espaços', () => {
    assert.equal(NpsInviteTokenSchema.safeParse('').success, false);
    assert.equal(NpsInviteTokenSchema.safeParse('   ').success, false);
});

test('token do cookie: rejeita acima de 4096 chars', () => {
    assert.equal(NpsInviteTokenSchema.safeParse('a'.repeat(4097)).success, false);
});

test('aceita reason vazia e normaliza para string vazia', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, reason: '' });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.reason, '');
    }
});

test('rejeita reason acima de 2000 chars', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, reason: 'a'.repeat(2001) });
    assert.equal(result.success, false);
});

test('rejeita highlight acima de 2000 chars', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, highlight: 'a'.repeat(2001) });
    assert.equal(result.success, false);
});

test('rejeita payload ausente', () => {
    const result = SubmitNpsBodySchema.safeParse(undefined);
    assert.equal(result.success, false);
});

test('rejeita payload não-objeto', () => {
    const result = SubmitNpsBodySchema.safeParse('string');
    assert.equal(result.success, false);
});

test('aceita whitespace-only reason e normaliza para string vazia', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, reason: '   ' });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.reason, '');
    }
});

test('escapa angle brackets em reason (sanitização de fronteira)', () => {
    const result = SubmitNpsBodySchema.safeParse({
        ...VALID,
        reason: '<script>alert(1)</script>',
    });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.reason, '&lt;script&gt;alert(1)&lt;/script&gt;');
        assert.equal(result.data.reason.includes('<'), false);
        assert.equal(result.data.reason.includes('>'), false);
    }
});

test('escapa angle brackets em highlight', () => {
    const result = SubmitNpsBodySchema.safeParse({
        ...VALID,
        highlight: 'Japão <img src=x onerror=alert(1)>',
    });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.highlight.includes('<'), false);
        assert.equal(result.data.highlight.includes('>'), false);
    }
});
