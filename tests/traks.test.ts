import test from 'node:test';
import assert from 'node:assert/strict';
import { pushGenerateLeadConversionEvent } from '../utils/generate-lead-analytics.ts';
import {
    trackTraks,
    installTraksWhatsAppClickListener,
} from '../utils/traks.ts';

interface FakeAnchor {
    getAttribute: (name: string) => string | null;
    closest: (selector: string) => FakeAnchor | null;
}

const anchor = (href: string): FakeAnchor => {
    const el: FakeAnchor = {
        getAttribute: (name) => (name === 'href' ? href : null),
        closest: (selector) => (selector === 'a[href]' ? el : null),
    };
    return el;
};

/** DOM mínimo (window + document) para exercitar os utilitários sem jsdom. */
function setupFakeDom(options: { href?: string } = {}) {
    const traksCalls: Array<{ name: string; props?: Record<string, unknown> }> = [];
    let clickHandler: ((event: unknown) => void) | null = null;

    const win = {
        location: new URL(options.href ?? 'https://www.anhanga.tur.br/orlando/'),
        dataLayer: [] as Array<Record<string, unknown>>,
    };
    (win as { traks?: unknown }).traks = (...args: unknown[]) => {
        traksCalls.push({
            name: String(args[0]),
            props: args[1] as Record<string, unknown> | undefined,
        });
    };

    const realWindow = globalThis.window;
    const realDocument = globalThis.document;
    (globalThis as { window?: unknown }).window = win;
    (globalThis as { document?: unknown }).document = {
        addEventListener(_type: string, handler: (event: unknown) => void) {
            clickHandler = handler;
        },
    };

    return {
        win,
        traksCalls,
        dataLayer: win.dataLayer,
        click(target: unknown) {
            clickHandler?.({ target });
        },
        cleanup() {
            (globalThis as { window?: unknown }).window = realWindow;
            (globalThis as { document?: unknown }).document = realDocument;
        },
    };
}

// ─── trackTraks ──────────────────────────────────────────────────────────────

test('trackTraks enfileira evento com nome e props', () => {
    const env = setupFakeDom();
    try {
        trackTraks('quote_request', { destination: 'whatsapp' });
        assert.deepEqual(env.traksCalls, [
            { name: 'quote_request', props: { destination: 'whatsapp' } },
        ]);
    } finally {
        env.cleanup();
    }
});

test('trackTraks é no-op sem window (SSR)', () => {
    const realWindow = globalThis.window;
    (globalThis as { window?: unknown }).window = undefined;
    try {
        assert.doesNotThrow(() => trackTraks('quote_request'));
    } finally {
        (globalThis as { window?: unknown }).window = realWindow;
    }
});

test('trackTraks é no-op quando window.traks não existe', () => {
    const env = setupFakeDom();
    delete (globalThis.window as { traks?: unknown }).traks;
    try {
        assert.doesNotThrow(() => trackTraks('quote_request'));
        assert.equal(env.traksCalls.length, 0);
    } finally {
        env.cleanup();
    }
});

test('trackTraks engole exceção do provedor sem quebrar o fluxo chamador', () => {
    const env = setupFakeDom();
    (globalThis.window as { traks?: unknown }).traks = () => {
        throw new Error('provedor externo quebrou');
    };
    try {
        assert.doesNotThrow(() => trackTraks('whatsapp_click'));
    } finally {
        env.cleanup();
    }
});

// ─── listener global de WhatsApp ─────────────────────────────────────────────

test('listener: dispara em wa.me/api.whatsapp.com com phone, ignora share e outros; idempotente', () => {
    const env = setupFakeDom({ href: 'https://www.anhanga.tur.br/orlando/' });
    try {
        // Instalação múltipla registra o handler apenas uma vez.
        installTraksWhatsAppClickListener();
        installTraksWhatsAppClickListener();
        installTraksWhatsAppClickListener();

        env.click(anchor('https://wa.me/5511955021519?text=oi'));
        assert.equal(env.traksCalls.length, 1);
        assert.equal(env.traksCalls[0].name, 'whatsapp_click');
        assert.deepEqual(env.traksCalls[0].props, { location: '/orlando/' });

        // api.whatsapp.com COM phone = contato da agência.
        env.click(anchor('https://api.whatsapp.com/send?phone=5511955021519&text=oi'));
        assert.equal(env.traksCalls.length, 2);

        // api.whatsapp.com só com text = botão de COMPARTILHAR (não é conversão).
        env.click(anchor('https://api.whatsapp.com/send?text=mira%20isso%20https://x.com'));
        assert.equal(env.traksCalls.length, 2);

        // Links internos e de outras redes ficam de fora.
        env.click(anchor('https://www.anhanga.tur.br/blog'));
        env.click(anchor('/orlando/'));
        env.click(anchor('https://twitter.com/intent/tweet?text=oi'));
        assert.equal(env.traksCalls.length, 2);

        // Hrefs protocol-relative (//wa.me) também são contato.
        env.click(anchor('//wa.me/5511955021519'));
        assert.equal(env.traksCalls.length, 3);
    } finally {
        env.cleanup();
    }
});

// ─── integração: generate_lead → quote_request ──────────────────────────────

test('pushGenerateLeadConversionEvent dispara quote_request no Traks com pathname da rota', () => {
    const env = setupFakeDom({ href: 'https://www.anhanga.tur.br/orlando/' });
    try {
        pushGenerateLeadConversionEvent({
            eventId: 'evt_1',
            destination: 'Porto de Galinhas',
        });

        // Evento GA4/dataLayer segue intacto.
        const dlEvent = env.dataLayer.find((e) => e.event === 'generate_lead');
        assert.ok(dlEvent, 'generate_lead deve seguir no dataLayer');
        assert.equal(dlEvent.destination, 'Porto de Galinhas');

        // Traks recebe conversão SEM texto livre do lead — só a rota.
        assert.deepEqual(env.traksCalls, [
            { name: 'quote_request', props: { location: '/orlando/' } },
        ]);
    } finally {
        env.cleanup();
    }
});
