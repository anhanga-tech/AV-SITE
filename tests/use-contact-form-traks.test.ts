import './helpers/dom-setup.ts';

import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, fireEvent, act, cleanup } from '@testing-library/react';

import { useContactForm } from '../hooks/useContactForm.ts';

/*
  Cobertura do handoff programático de WhatsApp em useContactForm (review P2,
  mesma lacuna já coberta para ChatLeadForm em tests/chat-lead-form-traks.test.ts):
  o path `action === 'whatsapp'` do modal de contato abre o WhatsApp via
  `window.open` e chama `trackTraksWhatsAppHandoff()` explicitamente, então
  precisa de um teste de integração que exercite o hook de verdade (não só a
  função isolada em utils/traks.ts).
*/

type TraksCall = { name: string; props?: Record<string, unknown> };

function withTraksStub(run: (calls: TraksCall[]) => Promise<void> | void) {
    const calls: TraksCall[] = [];
    const previous = (window as { traks?: unknown }).traks;
    (window as { traks?: unknown }).traks = (...args: unknown[]) => {
        calls.push({ name: String(args[0]), props: args[1] as Record<string, unknown> | undefined });
    };
    return Promise.resolve(run(calls)).finally(() => {
        if (previous === undefined) {
            delete (window as { traks?: unknown }).traks;
        } else {
            (window as { traks?: unknown }).traks = previous;
        }
    });
}

function withFetchStub(run: () => Promise<void> | void) {
    const previous = globalThis.fetch;
    globalThis.fetch = (async () =>
        new Response(JSON.stringify({ ok: true, odooLeadId: 'test-1' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })) as typeof fetch;
    return Promise.resolve(run()).finally(() => {
        globalThis.fetch = previous;
    });
}

function Harness() {
    const { setField, submit, reset, submitted, whatsappUrl } = useContactForm({ source: 'test-harness' });
    return React.createElement(
        'div',
        null,
        React.createElement('button', {
            'data-testid': 'fill',
            onClick: () => {
                setField('firstName', 'Fulano');
                setField('whatsapp', '11999998888');
            },
        }),
        React.createElement('button', {
            'data-testid': 'submit-whatsapp',
            onClick: () => {
                void submit('whatsapp');
            },
        }),
        React.createElement('button', {
            'data-testid': 'edit-name',
            onClick: () => {
                setField('firstName', 'Cicrano');
            },
        }),
        React.createElement('button', {
            'data-testid': 'reset',
            onClick: () => {
                reset();
            },
        }),
        submitted && whatsappUrl
            ? React.createElement('a', { 'data-testid': 'whatsapp-fallback', href: whatsappUrl }, 'Abrir WhatsApp')
            : null,
    );
}

test('useContactForm submit("whatsapp") emite whatsapp_click no Traks', async () => {
    // happy-dom's window.open() exposes `opener` as a getter-only accessor,
    // which throws on assignment in strict-mode ESM — unlike real browsers,
    // where `window.opener = null` is a spec-defined no-throw setter. Mock a
    // plain object here so the test exercises the "real browser" path rather
    // than that DOM-emulation gap.
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => ({
            closed: false,
            close() {},
            location: { href: '' },
            opener: 'writable',
        }),
    });

    try {
        await withTraksStub(async (calls) => {
            await withFetchStub(async () => {
                const { getByTestId } = render(React.createElement(Harness));

                act(() => {
                    fireEvent.click(getByTestId('fill'));
                });
                await act(async () => {
                    fireEvent.click(getByTestId('submit-whatsapp'));
                    await Promise.resolve();
                    await Promise.resolve();
                });

                const handoffs = calls.filter((c) => c.name === 'whatsapp_click');
                assert.ok(handoffs.length >= 1, 'whatsapp_click deve ser emitido no submit("whatsapp")');
            });
        });
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
    }
});

test('useContactForm expõe link de fallback quando o popup do WhatsApp é bloqueado, sem contar whatsapp_click duas vezes', async () => {
    cleanup();
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => null,
    });

    try {
        await withTraksStub(async (calls) => {
            await withFetchStub(async () => {
                const { getByTestId } = render(React.createElement(Harness));

                act(() => {
                    fireEvent.click(getByTestId('fill'));
                });
                await act(async () => {
                    fireEvent.click(getByTestId('submit-whatsapp'));
                    await Promise.resolve();
                    await Promise.resolve();
                });

                assert.equal(
                    getByTestId('whatsapp-fallback').getAttribute('href'),
                    'https://wa.me/5511955021519?text=Ol%C3%A1!%20Meu%20nome%20%C3%A9%20Fulano.%20Gostaria%20de%20saber%20mais%20sobre%20viagens.',
                );
                // O popup nunca navegou de fato — o listener global de cliques em
                // <a href="wa.me/..."> (utils/traks.ts) é quem deve contar o
                // clique, se o visitante usar o link de fallback. Contar aqui
                // também duplicaria a conversão.
                const handoffs = calls.filter((c) => c.name === 'whatsapp_click');
                assert.equal(handoffs.length, 0, 'whatsapp_click não deve ser emitido quando o popup é bloqueado');
            });
        });
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});

test('useContactForm preserva eventId ao repetir após erro 5xx ambíguo', async () => {
    cleanup();
    const previousFetch = globalThis.fetch;
    const requestBodies: Array<{ eventId?: string }> = [];
    let attempt = 0;
    globalThis.fetch = (async (_input, init) => {
        requestBodies.push(JSON.parse(String(init?.body)) as { eventId?: string });
        attempt += 1;
        const ok = attempt > 1;
        return new Response(JSON.stringify(ok
            ? { ok: true, odooLeadId: 'test-1' }
            : { ok: false, code: 'ODOO_ERROR', error: 'odoo upstream failed' }), {
            status: ok ? 200 : 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }) as typeof fetch;

    try {
        const { getByTestId } = render(React.createElement(Harness));
        act(() => {
            fireEvent.click(getByTestId('fill'));
        });
        await act(async () => {
            fireEvent.click(getByTestId('submit-whatsapp'));
            await Promise.resolve();
            await Promise.resolve();
        });
        await act(async () => {
            fireEvent.click(getByTestId('submit-whatsapp'));
            await Promise.resolve();
            await Promise.resolve();
        });

        assert.equal(requestBodies.length, 2);
        assert.ok(requestBodies[0].eventId);
        assert.equal(requestBodies[0].eventId, requestBodies[1].eventId);
    } finally {
        globalThis.fetch = previousFetch;
        cleanup();
    }
});

test('useContactForm gera novo eventId se um campo for editado após falha (não reenvia dados corrigidos com id antigo)', async () => {
    cleanup();
    const previousFetch = globalThis.fetch;
    const requestBodies: Array<{ eventId?: string }> = [];
    let attempt = 0;
    globalThis.fetch = (async (_input, init) => {
        requestBodies.push(JSON.parse(String(init?.body)) as { eventId?: string });
        attempt += 1;
        const ok = attempt > 1;
        return new Response(JSON.stringify(ok
            ? { ok: true, odooLeadId: 'test-1' }
            : { ok: false, code: 'ODOO_ERROR', error: 'odoo upstream failed' }), {
            status: ok ? 200 : 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }) as typeof fetch;

    try {
        const { getByTestId } = render(React.createElement(Harness));
        act(() => {
            fireEvent.click(getByTestId('fill'));
        });
        await act(async () => {
            fireEvent.click(getByTestId('submit-whatsapp'));
            await Promise.resolve();
            await Promise.resolve();
        });

        // Visitor corrects a field after the failed attempt — the retained
        // retry key must not be reused for the changed data.
        act(() => {
            fireEvent.click(getByTestId('edit-name'));
        });

        await act(async () => {
            fireEvent.click(getByTestId('submit-whatsapp'));
            await Promise.resolve();
            await Promise.resolve();
        });

        assert.equal(requestBodies.length, 2);
        assert.ok(requestBodies[0].eventId);
        assert.notEqual(
            requestBodies[0].eventId,
            requestBodies[1].eventId,
            'editar um campo após a falha deve gerar um novo eventId',
        );
    } finally {
        globalThis.fetch = previousFetch;
        cleanup();
    }
});

test('useContactForm reset() fecha a aba reservada imediatamente, sem esperar a requisição pendente terminar', async () => {
    cleanup();
    const previousFetch = globalThis.fetch;
    let closedCount = 0;
    let navigatedTo: string | null = null;
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => ({
            closed: false,
            close() { closedCount += 1; },
            location: { set href(v: string) { navigatedTo = v; } },
            opener: null,
        }),
    });
    // Simula uma requisição travada (nunca resolve) — só assim dá pra provar
    // que o cancelamento não depende do fetch eventualmente terminar.
    globalThis.fetch = (() => new Promise(() => { /* never resolves */ })) as typeof fetch;

    try {
        const { getByTestId } = render(React.createElement(Harness));
        act(() => {
            fireEvent.click(getByTestId('fill'));
        });
        act(() => {
            fireEvent.click(getByTestId('submit-whatsapp'));
        });
        await Promise.resolve();

        assert.equal(closedCount, 0, 'a aba ainda não deve ter sido fechada enquanto a requisição está pendente');

        // Visitor closes the modal while /api/submit-contact is still hanging.
        act(() => {
            fireEvent.click(getByTestId('reset'));
        });

        assert.equal(navigatedTo, null, 'nunca deve navegar para o WhatsApp de uma submissão descartada');
        assert.equal(closedCount, 1, 'reset() deve fechar a aba reservada imediatamente, sem esperar o fetch travado');
    } finally {
        globalThis.fetch = previousFetch;
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});

test('desmontar o componente que usa useContactForm fecha a aba reservada (ex.: navegação SPA para fora da home)', async () => {
    cleanup();
    const previousFetch = globalThis.fetch;
    let closedCount = 0;
    let navigatedTo: string | null = null;
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => ({
            closed: false,
            close() { closedCount += 1; },
            location: { set href(v: string) { navigatedTo = v; } },
            opener: null,
        }),
    });
    // Requisição travada — só assim dá pra provar que o cancelamento não
    // depende do fetch eventualmente terminar.
    globalThis.fetch = (() => new Promise(() => { /* never resolves */ })) as typeof fetch;

    try {
        const { getByTestId, unmount } = render(React.createElement(Harness));
        act(() => {
            fireEvent.click(getByTestId('fill'));
        });
        act(() => {
            fireEvent.click(getByTestId('submit-whatsapp'));
        });
        await Promise.resolve();

        assert.equal(closedCount, 0, 'a aba ainda não deve ter sido fechada enquanto a requisição está pendente');

        // Visitor navigates away via SPA routing (e.g. CtaBody's page
        // unmounts) without ever calling reset() explicitly.
        unmount();

        assert.equal(navigatedTo, null, 'nunca deve navegar para o WhatsApp de uma submissão abandonada');
        assert.equal(closedCount, 1, 'o unmount deve fechar a aba reservada, sem esperar o fetch travado');
    } finally {
        globalThis.fetch = previousFetch;
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});
