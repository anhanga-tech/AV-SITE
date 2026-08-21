import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildLeadWhatsAppMessage,
    buildLeadWhatsAppUrl,
    createLeadEventId,
    pushGenerateLeadDataLayerEvent,
    type LeadDraft,
} from '../hooks/useLeadCapture.ts';
import { getTrackingDataObject } from '../utils/whatsapp.ts';

type MockWindow = {
    location: {
        search: string;
        hash: string;
        href: string;
    };
    dataLayer: Array<Record<string, unknown>>;
};

type MockSessionStorage = {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
};

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalSessionStorage = globalThis.sessionStorage;

function restoreBrowserGlobals() {
    if (originalWindow === undefined) {
        delete (globalThis as { window?: typeof globalThis.window }).window;
    } else {
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: originalWindow,
        });
    }

    if (originalDocument === undefined) {
        delete (globalThis as { document?: typeof globalThis.document }).document;
    } else {
        Object.defineProperty(globalThis, 'document', {
            configurable: true,
            value: originalDocument,
        });
    }

    if (originalSessionStorage === undefined) {
        delete (globalThis as { sessionStorage?: typeof globalThis.sessionStorage }).sessionStorage;
    } else {
        Object.defineProperty(globalThis, 'sessionStorage', {
            configurable: true,
            value: originalSessionStorage,
        });
    }
}

function createSessionStorage(): MockSessionStorage {
    const store = new Map<string, string>();

    return {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => {
            store.set(key, value);
        },
        removeItem: (key) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
    };
}

test('buildLeadWhatsAppUrl should include lead details but never the tracking identifiers', () => {
    const mockWindow: MockWindow = {
        location: {
            search: '?utm_source=google&utm_medium=cpc&gclid=test-gclid',
            hash: '',
            href: 'https://www.anhanga.tur.br/?utm_source=google&utm_medium=cpc&gclid=test-gclid',
        },
        dataLayer: [],
    };

    const sessionStorage = createSessionStorage();

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: mockWindow,
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            cookie: '',
        },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: sessionStorage,
    });

    const draft: LeadDraft = {
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia',
        origin: 'São Paulo, SP',
        destination: 'Orlando, Flórida',
        dates: 'Julho de 2026',
        baggagePreference: '1 mala despachada',
    };

    const url = new URL(buildLeadWhatsAppUrl(draft));
    const message = url.searchParams.get('text') || '';

    assert.match(message, /Origem: São Paulo, SP/);
    assert.match(message, /Destino: Orlando, Flórida/);
    assert.match(message, /Datas: Julho de 2026/);
    assert.match(message, /Bagagem: 1 mala despachada/);

    // O tracking capturado nesta fixture (utm_source=google, gclid=test-gclid) segue para o
    // Odoo via /api/submit-lead; ele não pode aparecer na mensagem, que a pessoa envia pelo
    // WhatsApp. Ver docs/compliance/ripd-legitimo-interesse.md §3.1 "Limite de propagação".
    assert.doesNotMatch(message, /Dados:/);
    assert.doesNotMatch(message, /utm_source|utm_medium|gclid/);

    restoreBrowserGlobals();
});

test('getTrackingDataObject should capture referral ref from URL params', () => {
    const mockWindow: MockWindow = {
        location: {
            search: '?ref=Maria%20Silva',
            hash: '',
            href: 'https://www.anhanga.tur.br/?ref=Maria%20Silva',
        },
        dataLayer: [],
    };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: mockWindow,
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { cookie: '' },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: createSessionStorage(),
    });

    const tracking = getTrackingDataObject();

    assert.equal(tracking?.ref, 'Maria Silva');

    restoreBrowserGlobals();
});

test('getTrackingDataObject should mark tracking_data Secure on HTTPS and SameSite=Lax', () => {
    const cookieWrites: string[] = [];
    const mockWindow: MockWindow & { location: { protocol: string } } = {
        location: {
            protocol: 'https:',
            search: '?utm_source=security-test',
            hash: '',
            href: 'https://www.anhanga.tur.br/?utm_source=security-test',
        },
        dataLayer: [],
    };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: mockWindow,
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            readyState: 'complete',
            get cookie() {
                return '';
            },
            set cookie(value: string) {
                cookieWrites.push(value);
            },
        },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: createSessionStorage(),
    });

    getTrackingDataObject();

    const trackingCookie = cookieWrites.find((value) => value.startsWith('tracking_data='));
    assert.ok(trackingCookie, 'tracking_data should be persisted as a cookie');
    assert.match(trackingCookie, /;SameSite=Lax(?:;|$)/);
    assert.match(trackingCookie, /;Secure(?:;|$)/);

    restoreBrowserGlobals();
});

test('getTrackingDataObject should omit Secure for local HTTP while retaining SameSite=Lax', () => {
    const cookieWrites: string[] = [];
    const mockWindow: MockWindow & { location: { protocol: string } } = {
        location: {
            protocol: 'http:',
            search: '?utm_source=local-test',
            hash: '',
            href: 'http://localhost:4175/?utm_source=local-test',
        },
        dataLayer: [],
    };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: mockWindow,
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            readyState: 'complete',
            get cookie() {
                return '';
            },
            set cookie(value: string) {
                cookieWrites.push(value);
            },
        },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: createSessionStorage(),
    });

    getTrackingDataObject();

    const trackingCookie = cookieWrites.find((value) => value.startsWith('tracking_data='));
    assert.ok(trackingCookie, 'tracking_data should be persisted as a cookie');
    assert.match(trackingCookie, /;SameSite=Lax(?:;|$)/);
    assert.doesNotMatch(trackingCookie, /;Secure(?:;|$)/);

    restoreBrowserGlobals();
});

test('pushGenerateLeadDataLayerEvent should use provided formType for form_submission event', () => {
    const mockWindow: MockWindow = {
        location: {
            search: '',
            hash: '',
            href: 'https://www.anhanga.tur.br/',
        },
        dataLayer: [],
    };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: mockWindow,
    });

    const payload = {
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
        event_id: 'lead_form_type_test',
        bantSummary: 'Testing formType',
        destination: 'Nowhere',
        utms: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
        tracking: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
    };

    // Default formType
    pushGenerateLeadDataLayerEvent(payload);
    const submissionEvent1 = mockWindow.dataLayer.find(e => e.event === 'form_submission');
    assert.equal(submissionEvent1?.form_type, 'ai_chatbot_lead');

    // Custom formType
    pushGenerateLeadDataLayerEvent(payload, 'event_lead');
    const submissionEvent2 = mockWindow.dataLayer.filter(e => e.event === 'form_submission')[1];
    assert.equal(submissionEvent2?.form_type, 'event_lead');

    restoreBrowserGlobals();
});

test('createLeadEventId should generate a lead-prefixed event id', () => {
    const eventId = createLeadEventId();

    assert.match(eventId, /^lead_(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+_[a-z0-9]{6})$/);
});

test('pushGenerateLeadDataLayerEvent should push generate_lead with tracking fields', () => {
    const mockWindow: MockWindow = {
        location: {
            search: '',
            hash: '',
            href: 'https://www.anhanga.tur.br/',
        },
        dataLayer: [],
    };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: mockWindow,
    });

    pushGenerateLeadDataLayerEvent(
        {
            firstName: 'Felipe',
            lastName: 'William',
            email: 'felipe@example.com',
            whatsapp: '+5511988314487',
            event_id: 'lead_123456_test01',
            bantSummary: 'Need: Praia',
            destination: 'Rio de Janeiro',
            utms: {
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'rio',
                utm_term: null,
                utm_content: null,
            },
            tracking: {
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'rio',
                utm_term: null,
                utm_content: null,
                cid: 'cid-123',
                sid: 'sid-456',
            },
        },
    );

    assert.deepEqual(mockWindow.dataLayer[0], {
        event: 'generate_lead',
        event_id: 'lead_123456_test01',
        destination: 'Rio de Janeiro',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'rio',
        ga_client_id: 'cid-123',
        ga_session_id: 'sid-456',
    });

    restoreBrowserGlobals();
});

const baseDraft: Omit<LeadDraft, 'email'> = {
    firstName: 'Felipe',
    lastName: 'William',
    whatsapp: '+5511988314487',
    bantSummary: 'Need: Praia',
    origin: 'São Paulo, SP',
    destination: 'Orlando, Flórida',
    dates: 'Julho de 2026',
    baggagePreference: '',
};

test('buildLeadWhatsAppMessage includes email line when email is present', () => {
    const message = buildLeadWhatsAppMessage({ ...baseDraft, email: 'felipe@example.com' });

    assert.match(message, /📧 E-mail: felipe@example\.com/);
});

test('buildLeadWhatsAppMessage omits email line when email is empty', () => {
    const message = buildLeadWhatsAppMessage({ ...baseDraft, email: '' });

    assert.doesNotMatch(message, /E-mail:/);
});

test('buildLeadWhatsAppMessage never includes the lead whatsapp number', () => {
    const message = buildLeadWhatsAppMessage({
        ...baseDraft,
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
    });

    assert.doesNotMatch(message, /\+5511988314487/);
    assert.doesNotMatch(message, /WhatsApp:/i);
});
