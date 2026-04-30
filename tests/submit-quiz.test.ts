import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuizPayload } from '../lib/quiz-logic.ts';
import { buildN8nQuizPayload } from '../lib/n8n-payloads.ts';

const BASE_PAYLOAD = {
    firstName: 'Maria',
    email: 'maria@example.com',
    profileKey: 'aventureiro',
    profileName: 'Aventureiro',
    bantSummary: 'Quiz Anhangá · Perfil: Aventureiro · destino=europa',
    sourcePage: '/quiz',
    utms: {
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
    },
};

test('validateQuizPayload — destinos preenchidos são normalizados e incluídos', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, destinos: ['europa', 'latam'] });
    assert.ok(result.valid);
    assert.deepEqual(result.data.destinos, ['europa', 'latam']);
});

test('validateQuizPayload — destinos ausente resulta em array vazio', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD });
    assert.ok(result.valid);
    assert.deepEqual(result.data.destinos, []);
});

test('validateQuizPayload — destinos com valores não-string são filtrados', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, destinos: ['europa', 42, null, 'latam', true] });
    assert.ok(result.valid);
    assert.deepEqual(result.data.destinos, ['europa', 'latam']);
});

test('validateQuizPayload — destinos limitado a 10 elementos', () => {
    const destinos = Array.from({ length: 15 }, (_, i) => `destino-${i}`);
    const result = validateQuizPayload({ ...BASE_PAYLOAD, destinos });
    assert.ok(result.valid);
    assert.equal(result.data.destinos?.length, 10);
});

test('buildN8nQuizPayload — inclui destinos no payload do n8n', () => {
    const payload = { ...BASE_PAYLOAD, destinos: ['europa', 'latam'], tracking: undefined };
    const n8n = buildN8nQuizPayload(payload, 'req-123');
    assert.deepEqual(n8n.quiz.destinos, ['europa', 'latam']);
});

test('buildN8nQuizPayload — destinos ausente resulta em array vazio no payload n8n', () => {
    const payload = { ...BASE_PAYLOAD, tracking: undefined };
    const n8n = buildN8nQuizPayload(payload, 'req-456');
    assert.deepEqual(n8n.quiz.destinos, []);
});
