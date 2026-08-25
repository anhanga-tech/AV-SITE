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
    const { setField, submit, submitted, whatsappUrl } = useContactForm({ source: 'test-harness' });
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
        submitted && whatsappUrl
            ? React.createElement('a', { 'data-testid': 'whatsapp-fallback', href: whatsappUrl }, 'Abrir WhatsApp')
            : null,
    );
}

test('useContactForm submit("whatsapp") emite whatsapp_click no Traks', async () => {
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
});

test('useContactForm expõe link de fallback quando o popup do WhatsApp é bloqueado', async () => {
    cleanup();
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => null,
    });

    try {
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
        });
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});
