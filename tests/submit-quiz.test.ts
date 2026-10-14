import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuizPayload, deriveQuizLeadName } from '../lib/quiz-logic.ts';
import quizHandler from '../api/submit-quiz.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';

const BASE_PAYLOAD = {
    firstName: 'Maria',
    lastName: 'Silva',
    email: 'maria@example.com',
    profileKey: 'escapista',
    profileName: 'Escapista',
    bantSummary: 'Quiz Anhangá · Perfil: Escapista · destino=europa',
    sourcePage: '/quiz',
    utms: { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null },
};

// --- deriveQuizLeadName — split single "nome" field into first/last name ------

test('deriveQuizLeadName — sobrenome explícito é preservado (prefill via URL)', () => {
    assert.deepEqual(deriveQuizLeadName('João', 'Silva'), { firstName: 'João', lastName: 'Silva' });
});

test('deriveQuizLeadName — nome completo no campo único deriva o sobrenome', () => {
    assert.deepEqual(deriveQuizLeadName('João Silva', ''), { firstName: 'João', lastName: 'Silva' });
});

test('deriveQuizLeadName — sobrenome tem precedência sobre o nome completo', () => {
    assert.deepEqual(deriveQuizLeadName('João Silva', 'Souza'), { firstName: 'João', lastName: 'Souza' });
});

test('deriveQuizLeadName — nome com múltiplos sobrenomes junta o restante', () => {
    assert.deepEqual(
        deriveQuizLeadName('  Ana   Maria de Souza  ', ''),
        { firstName: 'Ana', lastName: 'Maria de Souza' },
    );
});

test('deriveQuizLeadName — só primeiro nome resulta em sobrenome vazio', () => {
    assert.deepEqual(deriveQuizLeadName('João', ''), { firstName: 'João', lastName: '' });
});

test('deriveQuizLeadName — nome vazio usa o fallback "Viajante"', () => {
    assert.deepEqual(deriveQuizLeadName('   ', '  '), { firstName: 'Viajante', lastName: '' });
});

// --- validateQuizPayload (lib/quiz-logic) — unchanged by the Odoo cut-over ----

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

test('validateQuizPayload — destinos limitado a 10 elementos', () => {
    const destinos = Array.from({ length: 15 }, (_, i) => `destino-${i}`);
    const result = validateQuizPayload({ ...BASE_PAYLOAD, destinos });
    assert.ok(result.valid);
    assert.equal(result.data.destinos?.length, 10);
});

test('validateQuizPayload — lastName ausente resulta em string vazia', () => {
    const { lastName: _omit, ...withoutLast } = BASE_PAYLOAD;
    const result = validateQuizPayload(withoutLast);
    assert.ok(result.valid);
    assert.equal(result.data.lastName, '');
});

test('validateQuizPayload — newsletterOptIn true é preservado', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, newsletterOptIn: true });
    assert.ok(result.valid);
    assert.equal(result.data.newsletterOptIn, true);
});

test('validateQuizPayload — newsletterOptIn com valor não-boolean resulta em false', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, newsletterOptIn: 'sim' });
    assert.ok(result.valid);
    assert.equal(result.data.newsletterOptIn, false);
});

test('validateQuizPayload — whatsapp mascarado é normalizado para E.164', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, whatsapp: '(11) 99999-9999' });
    assert.ok(result.valid);
    assert.equal(result.data.whatsapp, '+5511999999999');
});

test('validateQuizPayload — whatsapp inválido (poucos dígitos) resulta em undefined', () => {
    const result = validateQuizPayload({ ...BASE_PAYLOAD, whatsapp: '123' });
    assert.ok(result.valid);
    assert.equal(result.data.whatsapp, undefined);
});

test('validateQuizPayload — sanitiza destinos contra XSS', () => {
    const result = validateQuizPayload({
        ...BASE_PAYLOAD,
        destinos: ['<script>alert("xss")</script>', 'Orlando <img src=x onerror=alert(1)>'],
    });
    assert.ok(result.valid);
    assert.deepEqual(result.data.destinos, [
        '&lt;script&gt;alert("xss")&lt;/script&gt;',
        'Orlando &lt;img src=x onerror=alert(1)&gt;',
    ]);
});

// --- handler integration (Odoo) — quiz is ToFu: partner only, no crm.lead ----

const originalFetch = global.fetch;

function buildRequest(body: Record<string, unknown>): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    return new Request('http://localhost/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': `10.1.0.${ipSuffix}` },
        body: JSON.stringify(body),
    });
}

test('submit-quiz upserts a partner with x_perfil_do_viajante and creates NO crm.lead', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const res = await quizHandler(buildRequest({ ...BASE_PAYLOAD, newsletterOptIn: true, destinos: ['europa'] }));
    assert.equal(res.status, 200);

    assert.equal(mock.createdLead(), false);
    const partner = mock.partnerFields()!;
    assert.equal(partner.email, 'maria@example.com');
    assert.equal(partner.x_perfil_do_viajante, 'escapista');
    assert.equal(partner.x_lgpd_consent, true);
});

test('submit-quiz maps Odoo failures to ODOO_ERROR', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    setOdooEnv();
    global.fetch = createOdooMock({ failStatus: 503 }).fetch;

    const res = await quizHandler(buildRequest({ ...BASE_PAYLOAD }));
    assert.equal(res.status, 503);
    assert.equal((await res.json()).code, 'ODOO_ERROR');
});
