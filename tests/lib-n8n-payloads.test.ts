import test from 'node:test';
import assert from 'node:assert/strict';
import type { SubmitLeadRequest } from '../types/leadCapture.ts';
import type { SubmitContactRequest } from '../types/contactCapture.ts';
import type { SubmitWaitlistRequest } from '../types/waitlist.ts';
import type { SubmitQuizRequest } from '../types/quiz.ts';
import {
    buildN8nLeadPayload,
    buildN8nContactPayload,
    buildN8nWaitlistPayload,
    buildN8nQuizPayload,
} from '../lib/n8n-payloads.ts';

const BASE_UTMS = {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'verao-2026',
    utm_term: 'praia',
    utm_content: 'anuncio-1',
};

const LEAD_PAYLOAD: SubmitLeadRequest = {
    firstName: 'Maria',
    lastName: 'Silva',
    email: 'maria@example.com',
    whatsapp: '+5511999999999',
    utms: BASE_UTMS,
    bantSummary: 'BANT: orçamento confirmado, decisora, viagem em set/2026',
    destination: 'Orlando',
};

test('buildN8nLeadPayload — source e requestId no shape de topo', () => {
    const result = buildN8nLeadPayload(LEAD_PAYLOAD, 'req-lead-1');
    assert.equal(result.source, 'submit-lead');
    assert.equal(result.requestId, 'req-lead-1');
    assert.ok(result.meta);
    assert.match(result.meta.receivedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('buildN8nLeadPayload — eventId é null quando event_id ausente', () => {
    const result = buildN8nLeadPayload(LEAD_PAYLOAD, 'req-lead-2');
    assert.equal(result.lead.eventId, null);
});

test('buildN8nLeadPayload — eventId ecoa o valor quando event_id presente', () => {
    const result = buildN8nLeadPayload({ ...LEAD_PAYLOAD, event_id: 'evt-123' }, 'req-lead-3');
    assert.equal(result.lead.eventId, 'evt-123');
});

test('buildN8nLeadPayload — bantSummary e destination são repassados intactos', () => {
    const result = buildN8nLeadPayload(LEAD_PAYLOAD, 'req-lead-4');
    assert.equal(result.lead.bantSummary, LEAD_PAYLOAD.bantSummary);
    assert.equal(result.lead.destination, LEAD_PAYLOAD.destination);
});

test('buildN8nLeadPayload — meta.clientIpAddress é null quando context vazio', () => {
    const result = buildN8nLeadPayload(LEAD_PAYLOAD, 'req-lead-5');
    assert.equal(result.meta.clientIpAddress, null);
    assert.equal(result.meta.clientUserAgent, null);
});

test('buildN8nLeadPayload — meta.clientIpAddress ecoa o IP quando context fornece string não-vazia', () => {
    const result = buildN8nLeadPayload(LEAD_PAYLOAD, 'req-lead-6', {
        clientIpAddress: '203.0.113.10',
        clientUserAgent: 'Mozilla/5.0',
    });
    assert.equal(result.meta.clientIpAddress, '203.0.113.10');
    assert.equal(result.meta.clientUserAgent, 'Mozilla/5.0');
});

test('buildN8nLeadPayload — meta.clientIpAddress é null quando context fornece apenas whitespace', () => {
    const result = buildN8nLeadPayload(LEAD_PAYLOAD, 'req-lead-7', {
        clientIpAddress: '   ',
        clientUserAgent: '   ',
    });
    assert.equal(result.meta.clientIpAddress, null);
    assert.equal(result.meta.clientUserAgent, null);
});

test('buildN8nLeadPayload — utms são repassados intactos e extras default é vazio', () => {
    const result = buildN8nLeadPayload(LEAD_PAYLOAD, 'req-lead-8');
    assert.deepEqual(result.utms, BASE_UTMS);
    assert.ok(result.tracking);
    assert.deepEqual(result.tracking.extras, {});
});

const CONTACT_PAYLOAD: SubmitContactRequest = {
    firstName: 'João',
    lastName: 'Pereira',
    whatsapp: '+5511988888888',
    email: 'joao@example.com',
    emailOptIn: true,
    utms: BASE_UTMS,
};

test('buildN8nContactPayload — source correto no shape de topo', () => {
    const result = buildN8nContactPayload(CONTACT_PAYLOAD, 'req-contact-1');
    assert.equal(result.source, 'submit-contact');
    assert.equal(result.requestId, 'req-contact-1');
});

test('buildN8nContactPayload — fallback de UTM usa payload.tracking quando definido', () => {
    const payload: SubmitContactRequest = {
        ...CONTACT_PAYLOAD,
        tracking: {
            utm_source: 'meta',
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
    };
    const result = buildN8nContactPayload(payload, 'req-contact-2');
    assert.equal(result.tracking.utm_source, 'meta');
});

test('buildN8nContactPayload — fallback de UTM usa payload.utms quando tracking ausente', () => {
    const result = buildN8nContactPayload(CONTACT_PAYLOAD, 'req-contact-3');
    assert.equal(result.tracking.utm_source, BASE_UTMS.utm_source);
});

test('buildN8nContactPayload — click ID vazio/whitespace é repassado sem normalização (toNullableTrackingValue só trata undefined/null)', () => {
    const payload: SubmitContactRequest = {
        ...CONTACT_PAYLOAD,
        tracking: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
            gclid: '',
            fbclid: '   ',
        },
    };
    const result = buildN8nContactPayload(payload, 'req-contact-4');
    assert.equal(result.tracking.gclid, '');
    assert.equal(result.tracking.fbclid, '   ');
});

test('buildN8nContactPayload — click ID válido ecoa o valor', () => {
    const payload: SubmitContactRequest = {
        ...CONTACT_PAYLOAD,
        tracking: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
            gclid: 'abc123',
        },
    };
    const result = buildN8nContactPayload(payload, 'req-contact-5');
    assert.equal(result.tracking.gclid, 'abc123');
});

test('buildN8nContactPayload — tracking.extras é {} quando payload.tracking.extras ausente', () => {
    const result = buildN8nContactPayload(CONTACT_PAYLOAD, 'req-contact-6');
    assert.deepEqual(result.tracking.extras, {});
});

test('buildN8nContactPayload — campos opcionais são null quando ausentes', () => {
    const { lastName: _omitLast, email: _omitEmail, ...minimalPayload } = CONTACT_PAYLOAD;
    const payload: SubmitContactRequest = { ...minimalPayload };
    const result = buildN8nContactPayload(payload, 'req-contact-7');
    assert.ok(result.contact);
    assert.equal(result.contact.lastName, null);
    assert.equal(result.contact.email, null);
    assert.equal(result.contact.eventId, null);
    assert.equal(result.contact.ctaSource, null);
    assert.equal(result.contact.destination, null);
});

const WAITLIST_PAYLOAD: SubmitWaitlistRequest = {
    name: 'Ana Souza',
    email: 'ana@example.com',
    sourcePage: '/lollapalooza',
    utms: BASE_UTMS,
};

test('buildN8nWaitlistPayload — source correto no shape de topo', () => {
    const result = buildN8nWaitlistPayload(WAITLIST_PAYLOAD, 'req-waitlist-1');
    assert.equal(result.source, 'submit-waitlist');
    assert.equal(result.requestId, 'req-waitlist-1');
});

test('buildN8nWaitlistPayload — mapeia name, email e sourcePage', () => {
    const result = buildN8nWaitlistPayload(WAITLIST_PAYLOAD, 'req-waitlist-2');
    assert.equal(result.waitlist.name, WAITLIST_PAYLOAD.name);
    assert.equal(result.waitlist.email, WAITLIST_PAYLOAD.email);
    assert.equal(result.waitlist.sourcePage, WAITLIST_PAYLOAD.sourcePage);
});

const QUIZ_PAYLOAD: SubmitQuizRequest = {
    firstName: 'Carlos',
    lastName: 'Mendes',
    email: 'carlos@example.com',
    profileKey: 'aventureiro',
    profileName: 'Aventureiro',
    bantSummary: 'Quiz Anhangá · Perfil: Aventureiro',
    sourcePage: '/quiz',
    destinos: ['europa', 'latam'],
    utms: BASE_UTMS,
};

test('buildN8nQuizPayload — source correto no shape de topo', () => {
    const result = buildN8nQuizPayload(QUIZ_PAYLOAD, 'req-quiz-1');
    assert.equal(result.source, 'submit-quiz');
    assert.equal(result.requestId, 'req-quiz-1');
});

test('buildN8nQuizPayload — mapeia profileKey, profileName e destinos, e aplica defaults para opcionais ausentes', () => {
    const result = buildN8nQuizPayload(QUIZ_PAYLOAD, 'req-quiz-2');
    assert.ok(result.quiz);
    assert.equal(result.quiz.profileKey, QUIZ_PAYLOAD.profileKey);
    assert.equal(result.quiz.profileName, QUIZ_PAYLOAD.profileName);
    assert.deepEqual(result.quiz.destinos, ['europa', 'latam']);
    assert.equal(result.quiz.whatsapp, null);
    assert.equal(result.quiz.skipped, false);
    assert.equal(result.quiz.newsletterOptIn, false);
});
