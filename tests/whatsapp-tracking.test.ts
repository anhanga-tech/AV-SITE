import test from 'node:test';
import assert from 'node:assert/strict';
import { getWhatsAppLink, getTrackingDataObject } from '../utils/whatsapp.ts';

const WHATSAPP_BASE = 'https://wa.me/5511955021519';

function decodeMessageFrom(url: string): string {
    const part = url.split('?text=')[1];
    return decodeURIComponent(part ?? '');
}

test('getWhatsAppLink returns URL with correct WhatsApp number', () => {
    const url = getWhatsAppLink('Olá');
    assert.ok(url.startsWith(WHATSAPP_BASE + '?text='));
});

test('getWhatsAppLink URL-encodes the message', () => {
    const url = getWhatsAppLink('Olá, quero saber mais!');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Olá, quero saber mais!');
});

test('getWhatsAppLink strips || Dados: suffix from message', () => {
    const url = getWhatsAppLink('Olá || Dados: utm_source=google, utm_medium=cpc');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Olá');
});

test('getWhatsAppLink strips [ref: suffix from message', () => {
    const url = getWhatsAppLink('Mensagem [ref: abc123]');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem');
});

test('getWhatsAppLink strips both suffixes when both are present (priority to || Dados:)', () => {
    const url = getWhatsAppLink('Texto || Dados: x=1 [ref: abc]');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Texto');
});

test('getWhatsAppLink trims trailing whitespace after stripping suffix', () => {
    const url = getWhatsAppLink('Mensagem   ');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem');
});

test('getWhatsAppLink never appends tracking data to the message', () => {
    const url = getWhatsAppLink('Mensagem simples');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem simples');
    assert.ok(!decoded.includes('|| Dados:'));
});

test('getWhatsAppLink with empty message returns URL with empty text', () => {
    const url = getWhatsAppLink('');
    assert.ok(url.startsWith(WHATSAPP_BASE + '?text='));
});

test('getWhatsAppLink handles message with special characters', () => {
    const msg = 'Viagem: São Paulo → Orlando (2 adultos)';
    const url = getWhatsAppLink(msg);
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, msg);
});

test('getTrackingDataObject returns null in Node.js environment (no window)', () => {
    const result = getTrackingDataObject();
    assert.equal(result, null);
});

// Regression: identifiers (cid/sid/gclid/fbclid) used to be appended to the message body, which
// meant the user sent them as WhatsApp content — outside the retention declared in the RIPD.
// They reach Odoo through /api/submit-* instead. This asserts the message stays clean even when
// tracking data is available to capture.
test('getWhatsAppLink omits identifiers even when tracking data is available', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            dataLayer: [],
            location: {
                search: '?utm_source=instagram&gclid=Cj0KTEST',
                hash: '',
                href: 'https://example.com/?utm_source=instagram&gclid=Cj0KTEST',
            },
        },
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { cookie: '_ga=GA1.1.1234567890.1699887766' },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {} },
    });

    try {
        // Proves the fixture is real: this data is captured and does reach the Odoo payloads.
        const tracking = getTrackingDataObject();
        assert.equal(tracking?.gclid, 'Cj0KTEST');

        const decoded = decodeMessageFrom(getWhatsAppLink('Quero planejar uma viagem'));
        assert.equal(decoded, 'Quero planejar uma viagem');
        for (const identifier of ['gclid', 'Cj0KTEST', 'cid', '1234567890', '|| Dados:', '[ref:']) {
            assert.ok(!decoded.includes(identifier), `mensagem não deve conter "${identifier}"`);
        }
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else Reflect.deleteProperty(globalThis, 'window');
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
        else Reflect.deleteProperty(globalThis, 'document');
        if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
        else Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
});

// Regressão (achado de review, chatgpt-codex-connector[bot]): nada carrega o gtag.js real do
// Google desde a migração pro Zaraz (Stape/GTM removidos), então um visitante sem o cookie
// _ga legado nunca teria ga_client_id — quebrando a correlação de conversão no GA4. Confirma
// que getGA4ClientId gera e persiste seu próprio ID quando não existe nenhum _ga.
test('getTrackingDataObject gera um cid próprio quando não existe cookie _ga (visitante novo)', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

    // Jar real (chave -> valor), não uma única string: captureTrackingDataObject grava
    // dois cookies distintos (anhanga_ga_cid e tracking_data) na mesma chamada, e um
    // mock de slot único faz o segundo write sobrescrever o primeiro antes da asserção.
    const cookieJar: Record<string, string> = {};
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            dataLayer: [],
            location: { search: '', hash: '', href: 'https://example.com/' },
        },
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            get cookie() {
                return Object.entries(cookieJar).map(([name, value]) => `${name}=${value}`).join('; ');
            },
            set cookie(value: string) {
                const [pair] = value.split(';');
                const separatorIndex = pair.indexOf('=');
                if (separatorIndex <= 0) return;
                cookieJar[pair.slice(0, separatorIndex)] = pair.slice(separatorIndex + 1);
            },
        },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {} },
    });

    try {
        const tracking = getTrackingDataObject();
        assert.ok(tracking?.cid, 'cid deve ser gerado mesmo sem cookie _ga');
        assert.match(tracking!.cid, /^\d+\.\d+$/, 'cid gerado deve seguir o formato número.timestamp');
        assert.ok('anhanga_ga_cid' in cookieJar, 'o cid gerado deve ser persistido em cookie próprio');
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else Reflect.deleteProperty(globalThis, 'window');
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
        else Reflect.deleteProperty(globalThis, 'document');
        if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
        else Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
});
