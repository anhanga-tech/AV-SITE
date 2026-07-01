import test from 'node:test';
import assert from 'node:assert/strict';
import {
    resolveSourceMedium,
    buildPartnerFields,
    buildLeadFields,
    leadInputFromSubmitLead,
    leadInputFromSubmitContact,
    leadInputFromSubmitQuiz,
    leadInputFromSubmitWaitlist,
    type OdooLeadInput,
} from '../lib/odoo-lead-mapping.ts';
import { REGION_TAG } from '../lib/destination-region.ts';
import type { LeadUtms } from '../types/leadCapture.ts';

const EMPTY_UTMS: LeadUtms = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };

function utms(over: Partial<LeadUtms>): LeadUtms {
    return { ...EMPTY_UTMS, ...over };
}

// --- resolveSourceMedium -----------------------------------------------------

test('resolveSourceMedium — referral signal → Indicação/indicacao (8/6)', () => {
    assert.deepEqual(resolveSourceMedium(EMPTY_UTMS, 'referral'), { source_id: 8, medium_id: 6 });
});

test('resolveSourceMedium — google + cpc → Google Ads/cpc (17/7)', () => {
    assert.deepEqual(resolveSourceMedium(utms({ utm_source: 'google', utm_medium: 'cpc' }), null), { source_id: 17, medium_id: 7 });
});

test('resolveSourceMedium — instagram + paid → Meta Ads/cpc (18/7)', () => {
    assert.deepEqual(resolveSourceMedium(utms({ utm_source: 'instagram', utm_medium: 'paid' }), null), { source_id: 18, medium_id: 7 });
});

test('resolveSourceMedium — quiz signal (no paid utm) → Quiz/organic (16/8)', () => {
    assert.deepEqual(resolveSourceMedium(EMPTY_UTMS, 'quiz'), { source_id: 16, medium_id: 8 });
});

test('resolveSourceMedium — paid utm beats quiz signal (table order)', () => {
    assert.deepEqual(resolveSourceMedium(utms({ utm_source: 'google', utm_medium: 'cpc' }), 'quiz'), { source_id: 17, medium_id: 7 });
});

test('resolveSourceMedium — whatsapp signal → WhatsApp/organic (19/8)', () => {
    assert.deepEqual(resolveSourceMedium(EMPTY_UTMS, 'whatsapp'), { source_id: 19, medium_id: 8 });
});

test('resolveSourceMedium — default → Site/organic (15/8)', () => {
    assert.deepEqual(resolveSourceMedium(utms({ utm_source: 'google', utm_medium: 'organic' }), null), { source_id: 15, medium_id: 8 });
});

// --- buildPartnerFields ------------------------------------------------------

function baseInput(over: Partial<OdooLeadInput>): OdooLeadInput {
    return {
        formType: 'lead',
        createsLead: true,
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        phone: '+5511999990000',
        marketingOptIn: false,
        utms: EMPTY_UTMS,
        originSignal: null,
        ...over,
    };
}

test('buildPartnerFields — maps name/email/phone, omits consent when not opted in', () => {
    const fields = buildPartnerFields(baseInput({}));
    assert.equal(fields.name, 'Ana Silva');
    assert.equal(fields.email, 'ana@example.com');
    assert.equal(fields.phone, '+5511999990000');
    assert.equal('x_lgpd_consent' in fields, false);
    assert.equal('x_perfil_do_viajante' in fields, false);
});

test('buildPartnerFields — writes x_lgpd_consent only when opted in', () => {
    const fields = buildPartnerFields(baseInput({ marketingOptIn: true }));
    assert.equal(fields.x_lgpd_consent, true);
});

test('buildPartnerFields — maps a recognized quiz profileKey to x_perfil_do_viajante', () => {
    const fields = buildPartnerFields(baseInput({ profileKey: 'nomade-de-alma' }));
    assert.equal(fields.x_perfil_do_viajante, 'nomade-de-alma');
});

test('buildPartnerFields — ignores an unrecognized profileKey', () => {
    const fields = buildPartnerFields(baseInput({ profileKey: 'not-a-real-profile' }));
    assert.equal('x_perfil_do_viajante' in fields, false);
});

test('buildPartnerFields — emite category_id com comandos de link (4, id) por tag', () => {
    const fields = buildPartnerFields(
        baseInput({ destinationTagIds: [REGION_TAG.americaNorte, REGION_TAG.caribe] }),
    );
    assert.deepEqual(fields.category_id, [[4, 6], [4, 10]]);
});

test('buildPartnerFields — omite category_id quando não há tag (fallback)', () => {
    assert.equal('category_id' in buildPartnerFields(baseInput({ destinationTagIds: [] })), false);
    assert.equal('category_id' in buildPartnerFields(baseInput({})), false);
});

// --- buildLeadFields ---------------------------------------------------------

test('buildLeadFields — opportunity shape with partner_id and resolved source/medium', () => {
    const fields = buildLeadFields(
        baseInput({ destination: 'Orlando', utms: utms({ utm_source: 'google', utm_medium: 'cpc' }), bantSummary: 'Need: X' }),
        101,
    );
    assert.equal(fields.name, 'Lead Site — Ana Silva (Orlando)');
    assert.equal(fields.type, 'opportunity');
    assert.equal(fields.stage_id, 1);
    assert.equal(fields.team_id, 1);
    assert.equal(fields.partner_id, 101);
    assert.equal(fields.contact_name, 'Ana Silva');
    assert.equal(fields.email_from, 'ana@example.com');
    assert.equal(fields.source_id, 17);
    assert.equal(fields.medium_id, 7);
    assert.match(String(fields.description), /<li>BANT: Need: X<\/li>/);
    assert.match(String(fields.description), /<li>Destino: Orlando<\/li>/);
});

test('buildLeadFields — maps empresa/cargo and referred when present', () => {
    const fields = buildLeadFields(baseInput({ empresa: 'ACME', cargo: 'CTO', referred: 'João' }), 5);
    assert.equal(fields.partner_name, 'ACME');
    assert.equal(fields.function, 'CTO');
    assert.equal(fields.referred, 'João');
});

// --- per-form adapters -------------------------------------------------------

test('leadInputFromSubmitLead — creates a lead, maps marketingOptIn', () => {
    const input = leadInputFromSubmitLead({
        firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com', whatsapp: '+5511999990000',
        bantSummary: 'Need: X', destination: 'Orlando', marketingOptIn: true,
        utms: EMPTY_UTMS, tracking: undefined,
    } as never);
    assert.equal(input.createsLead, true);
    assert.equal(input.marketingOptIn, true);
    assert.equal(input.destination, 'Orlando');
    assert.deepEqual(input.destinationTagIds, [REGION_TAG.americaNorte]);
});

test('leadInputFromSubmitLead — carries empresa/cargo into Odoo lead input', () => {
    const input = leadInputFromSubmitLead({
        firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com', whatsapp: '+5511999990000',
        bantSummary: 'Lead corporativo', destination: 'Corporativo', marketingOptIn: true,
        empresa: 'Acme Viagens', cargo: 'Diretora de Pessoas',
        utms: EMPTY_UTMS, tracking: undefined,
    } as never);
    assert.equal(input.empresa, 'Acme Viagens');
    assert.equal(input.cargo, 'Diretora de Pessoas');
});

test('leadInputFromSubmitLead — referred lead uses referral origin signal', () => {
    const input = leadInputFromSubmitLead({
        firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com', whatsapp: '+5511999990000',
        bantSummary: 'Lead indicado', destination: 'Orlando', marketingOptIn: true,
        referred: 'Maria Silva',
        utms: EMPTY_UTMS, tracking: undefined,
    } as never);
    assert.equal(input.referred, 'Maria Silva');
    assert.equal(input.originSignal, 'referral');
});

test('leadInputFromSubmitLead — destino livre não reconhecido não gera tag (fallback)', () => {
    const input = leadInputFromSubmitLead({
        firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com', whatsapp: '+5511999990000',
        bantSummary: 'Need: X', destination: 'Marte', marketingOptIn: true,
        utms: EMPTY_UTMS, tracking: undefined,
    } as never);
    assert.deepEqual(input.destinationTagIds, []);
});

test('leadInputFromSubmitContact — creates a lead, emailOptIn → marketingOptIn', () => {
    const input = leadInputFromSubmitContact({
        firstName: 'Ana', whatsapp: '+5511999990000', emailOptIn: true,
        utms: EMPTY_UTMS,
    } as never);
    assert.equal(input.createsLead, true);
    assert.equal(input.marketingOptIn, true);
});

test('leadInputFromSubmitQuiz — partner only (no lead), carries profileKey + quiz signal', () => {
    const input = leadInputFromSubmitQuiz({
        firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com',
        profileKey: 'escapista', profileName: 'Escapista', bantSummary: 'Quiz', sourcePage: '/quiz',
        destinos: ['europa', 'asia'], newsletterOptIn: true, utms: EMPTY_UTMS,
    } as never);
    assert.equal(input.createsLead, false);
    assert.equal(input.profileKey, 'escapista');
    assert.equal(input.originSignal, 'quiz');
    assert.equal(input.marketingOptIn, true);
    assert.deepEqual(input.destinationTagIds, [REGION_TAG.europa, REGION_TAG.asia]);
    assert.match(String(input.contextNote), /Destinos: europa, asia/);
});

test('leadInputFromSubmitWaitlist — partner only, splits name, emailOptIn → marketingOptIn', () => {
    const input = leadInputFromSubmitWaitlist({
        name: 'Ana Maria Silva', email: 'ana@example.com', sourcePage: '/lollapalooza',
        emailOptIn: true, utms: EMPTY_UTMS,
    } as never);
    assert.equal(input.createsLead, false);
    assert.equal(input.firstName, 'Ana');
    assert.equal(input.lastName, 'Maria Silva');
    assert.equal(input.marketingOptIn, true);
});
