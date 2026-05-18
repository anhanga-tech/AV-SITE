import test from 'node:test';
import assert from 'node:assert/strict';
import { SubmitNpsBodySchema } from '../lib/schemas/submit-nps.ts';

const VALID = {
    firstname: 'João',
    email: 'joao@example.com',
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

test('rejeita email inválido', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, email: 'nao-e-email' });
    assert.equal(result.success, false);
});

test('rejeita email acima de 254 chars', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, email: 'a'.repeat(245) + '@example.com' });
    assert.equal(result.success, false);
});

test('rejeita firstname vazio', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, firstname: '' });
    assert.equal(result.success, false);
});

test('rejeita firstname acima de 100 chars', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, firstname: 'a'.repeat(101) });
    assert.equal(result.success, false);
});

test('rejeita reason vazia', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, reason: '' });
    assert.equal(result.success, false);
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

test('rejeita whitespace-only firstname', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, firstname: '   ' });
    assert.equal(result.success, false);
});

test('rejeita whitespace-only reason', () => {
    const result = SubmitNpsBodySchema.safeParse({ ...VALID, reason: '   ' });
    assert.equal(result.success, false);
});
