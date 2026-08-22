import test from 'node:test';
import assert from 'node:assert/strict';
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
    };
    (win as { traks?: unknown }).traks = (...args: unknown[]) => {
        traksCalls.push({
            name: String(args[0]),
            props: args[1] as Record<string, unknown> | undefined,
        });
    };

    const realWindow = globalThis.window;
    const realDocument = globalThis.document;
    (globalThis as any).window = win;
    (globalThis as any).document = {
        addEventListener(_type: string, handler: (event: unknown) => void) {
            clickHandler = handler;
        },
    };

    return {
        traksCalls,
        click(target: unknown) {
            clickHandler?.({ target });
        },
        cleanup() {
            (globalThis as any).window = realWindow;
            (globalThis as any).document = realDocument;
        },
    };
}

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
    (globalThis as any).window = undefined;
    try {
        assert.doesNotThrow(() => trackTraks('quote_request'));
    } finally {
        (globalThis as any).window = realWindow;
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

test('listener: dispara em wa.me/api.whatsapp.com, ignora outros e é idempotente', () => {
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

        env.click(anchor('https://api.whatsapp.com/send?phone=5511955021519&text=oi'));
        assert.equal(env.traksCalls.length, 2);

        env.click(anchor('https://www.anhanga.tur.br/blog'));
        env.click(anchor('/orlando/'));
        assert.equal(env.traksCalls.length, 2);

        env.click(anchor('//wa.me/5511955021519'));
        assert.equal(env.traksCalls.length, 3);
    } finally {
        env.cleanup();
    }
});
