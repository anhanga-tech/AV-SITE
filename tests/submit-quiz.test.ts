import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuizPayload } from '../lib/quiz-logic.ts';
import { buildN8nQuizPayload } from '../lib/n8n-payloads.ts';

const BASE_PAYLOAD = {
    firstName: 'Maria',
    lastName: 'Silva',
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

test('validateQuizPayload — destinos com espaços são normalizados com trim', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, destinos: ['  europa  ', ' latam'] });
    assert.ok(result.valid);
    assert.deepEqual(result.data.destinos, ['europa', 'latam']);
});

test('validateQuizPayload — destinos com strings vazias após trim são removidos', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, destinos: ['europa', '   ', 'latam'] });
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

test('validateQuizPayload — lastName é incluído no resultado', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD });
    assert.ok(result.valid);
    assert.equal(result.data.lastName, 'Silva');
});

test('validateQuizPayload — lastName ausente resulta em string vazia', () => {
    const { lastName: _omit, ...withoutLast } = BASE_PAYLOAD;
    const result = validateQuizPayload(withoutLast);
    assert.ok(result.valid);
    assert.equal(result.data.lastName, '');
});

test('buildN8nQuizPayload — inclui lastName no payload do n8n', () => {
    const payload = { ...BASE_PAYLOAD, tracking: undefined };
    const n8n = buildN8nQuizPayload(payload, 'req-789');
    assert.equal(n8n.quiz.lastName, 'Silva');
});

test('validateQuizPayload — newsletterOptIn true é preservado', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, newsletterOptIn: true });
    assert.ok(result.valid);
    assert.equal(result.data.newsletterOptIn, true);
});

test('validateQuizPayload — newsletterOptIn ausente resulta em false', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD });
    assert.ok(result.valid);
    assert.equal(result.data.newsletterOptIn, false);
});

test('validateQuizPayload — newsletterOptIn com valor não-boolean resulta em false', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, newsletterOptIn: 'sim' });
    assert.ok(result.valid);
    assert.equal(result.data.newsletterOptIn, false);
});

test('buildN8nQuizPayload — inclui newsletterOptIn no payload do n8n', () => {
    const payload = { ...BASE_PAYLOAD, newsletterOptIn: true, tracking: undefined };
    const n8n = buildN8nQuizPayload(payload, 'req-nl-1');
    assert.equal(n8n.quiz.newsletterOptIn, true);
});

test('buildN8nQuizPayload — newsletterOptIn ausente resulta em false no payload n8n', () => {
    const payload = { ...BASE_PAYLOAD, tracking: undefined };
    const n8n = buildN8nQuizPayload(payload, 'req-nl-2');
    assert.equal(n8n.quiz.newsletterOptIn, false);
});

test('validateQuizPayload — sanitiza destinos contra XSS', () => {
    const payload = {
        ...BASE_PAYLOAD,
        destinos: ['<script>alert("xss")</script>', 'Orlando <img src=x onerror=alert(1)>'],
    };
    const result = validateQuizPayload(payload);
    assert.ok(result.valid);
    assert.deepEqual(result.data.destinos, [
        '&lt;script&gt;alert("xss")&lt;/script&gt;',
        'Orlando &lt;img src=x onerror=alert(1)&gt;',
    ]);
});
