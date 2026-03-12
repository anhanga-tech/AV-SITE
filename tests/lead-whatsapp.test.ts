import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLeadWhatsAppUrl, type LeadDraft } from '../hooks/useLeadCapture.ts';

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

test('buildLeadWhatsAppUrl should include origin, destination, dates, baggage and tracking ref', () => {
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
    assert.match(message, /Dados: .*utm_source=google/);
    assert.match(message, /Dados: .*utm_medium=cpc/);
    assert.match(message, /Dados: .*gclid=test-gclid/);

    if (originalWindow === undefined) {
        delete (globalThis as typeof globalThis & { window?: typeof globalThis.window }).window;
    } else {
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: originalWindow,
        });
    }

    if (originalDocument === undefined) {
        delete (globalThis as typeof globalThis & { document?: typeof globalThis.document }).document;
    } else {
        Object.defineProperty(globalThis, 'document', {
            configurable: true,
            value: originalDocument,
        });
    }

    if (originalSessionStorage === undefined) {
        delete (globalThis as typeof globalThis & { sessionStorage?: typeof globalThis.sessionStorage }).sessionStorage;
    } else {
        Object.defineProperty(globalThis, 'sessionStorage', {
            configurable: true,
            value: originalSessionStorage,
        });
    }
});
