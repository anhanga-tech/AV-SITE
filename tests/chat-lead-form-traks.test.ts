import './helpers/dom-setup.ts';

import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, fireEvent, act, cleanup } from '@testing-library/react';

import { ChatLeadForm } from '../components/ChatLeadForm.tsx';
import type { LeadFinalizeResult } from '../lib/chat-lead-form-logic.ts';
import type { SubmitLeadRequest } from '../types/leadCapture.ts';

/*
  Teste de integração do handoff programático de WhatsApp (reviews P2):
  o fluxo validado do formulário do chatbot abre WhatsApp via window.open
  (não via <a href>), então precisa emitir `whatsapp_click` no Traks
  explicitamente. O componente é montado de verdade (happy-dom +
  testing-library, mesmo tier de ai-research-bar-tracking.test.ts) e
  window.traks é um stub que registra as chamadas.
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

const okFinalize = async () => ({ ok: true as const, odooLeadId: 'test-1' });

function makeProps() {
    return {
        destination: 'Orlando',
        whatsappMessage: 'Olá! Contexto do chatbot.',
        getWhatsAppUrl: () => 'https://wa.me/5511955021519?text=test',
        prepareLeadSubmitPayload: (() => ({})) as unknown as React.ComponentProps<typeof ChatLeadForm>['prepareLeadSubmitPayload'],
        isSubmittingLead: false,
        onFinalizeLead: okFinalize,
    };
}

test('submit validado do ChatLeadForm emite whatsapp_click no Traks', async () => {
    await withTraksStub(async (calls) => {
        const { container } = render(React.createElement(ChatLeadForm, makeProps()));

        // Preenche campos obrigatórios pelos inputs reais do form.
        const set = (id: string, value: string) => {
            const input = container.querySelector(`#${id}`);
            if (!input) throw new Error(`input não encontrado: #${id}`);
            fireEvent.input(input, { target: { value } });
        };
        set('lead-first-name', 'Fulano');
        set('lead-last-name', 'de Tal');
        set('lead-email', 'fulano@test.com');
        set('lead-whatsapp', '11999998888');

        // Aceita LGPD se existir checkbox.
        const lgpd = container.querySelector('input[type="checkbox"]');
        if (lgpd) fireEvent.click(lgpd);

        const submitButton = Array.from(container.querySelectorAll('button'))
            .find((b) => b.textContent?.includes('Salvar e abrir WhatsApp'));
        assert.ok(submitButton, 'botão "Salvar e abrir WhatsApp" deve existir');

        await act(async () => {
            fireEvent.click(submitButton);
            await Promise.resolve();
            await Promise.resolve();
        });
        const handoffs = calls.filter((c) => c.name === 'whatsapp_click');
        assert.ok(handoffs.length >= 1, 'whatsapp_click deve ser emitido no submit validado');
    });
});

test('caminho direto abre o modal de lead e não abre o WhatsApp sem salvar', () => {
    const previousOpen = window.open;
    const modalDetails: Array<{ source?: string; destination?: string; message?: string }> = [];
    let whatsappOpenCalls = 0;
    const onModalOpen = (event: Event) => {
        modalDetails.push((event as CustomEvent<{ source?: string; destination?: string; message?: string }>).detail);
    };

    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => {
            whatsappOpenCalls += 1;
            return ({}) as Window;
        },
    });
    window.addEventListener('open-contact-modal', onModalOpen);

    try {
        const { container } = render(React.createElement(ChatLeadForm, makeProps()));
        const directButton = Array.from(container.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('Preencher contato e continuar'));
        assert.ok(directButton, 'botão alternativo deve existir');

        fireEvent.click(directButton);

        assert.deepEqual(modalDetails, [{
            source: 'chatbot-direct',
            destination: 'Orlando',
            message: 'Olá! Contexto do chatbot.',
        }]);
        assert.equal(whatsappOpenCalls, 0, 'o caminho alternativo não pode abrir o WhatsApp antes do modal');
    } finally {
        window.removeEventListener('open-contact-modal', onModalOpen);
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
    }
});

test('popup bloqueado exibe link de fallback no ChatLeadForm após salvar o lead', async () => {
    cleanup();
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => null,
    });

    try {
        const { container, getByRole } = render(React.createElement(ChatLeadForm, makeProps()));
        const set = (id: string, value: string) => {
            const input = container.querySelector(`#${id}`);
            if (!input) throw new Error(`input não encontrado: #${id}`);
            fireEvent.input(input, { target: { value } });
        };

        set('lead-first-name', 'Fulano');
        set('lead-last-name', 'de Tal');
        set('lead-email', 'fulano@test.com');
        set('lead-whatsapp', '11999998888');
        const lgpd = container.querySelector('input[type="checkbox"]');
        if (lgpd) fireEvent.click(lgpd);

        const submitButton = Array.from(container.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('Salvar e abrir WhatsApp'));
        assert.ok(submitButton, 'botão "Salvar e abrir WhatsApp" deve existir');

        await act(async () => {
            fireEvent.click(submitButton);
            await Promise.resolve();
            await Promise.resolve();
        });

        assert.equal(
            getByRole('link', { name: 'Abrir WhatsApp' }).getAttribute('href'),
            'https://wa.me/5511955021519?text=test',
        );
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});

test('ChatLeadForm preserva eventId ao repetir após falha ambígua do CRM', async () => {
    cleanup();
    const eventIds: string[] = [];
    let attempt = 0;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        prepareLeadSubmitPayload: (_payload, eventId): SubmitLeadRequest => {
            eventIds.push(eventId);
            return {} as SubmitLeadRequest;
        },
        onFinalizeLead: async (): Promise<LeadFinalizeResult> => {
            attempt += 1;
            return attempt === 1
                ? { ok: false, error: 'odoo upstream failed', requestId: 'req-1' }
                : { ok: true };
        },
    };

    const { container } = render(React.createElement(ChatLeadForm, props));
    const set = (id: string, value: string) => {
        const input = container.querySelector(`#${id}`);
        if (!input) throw new Error(`input não encontrado: #${id}`);
        fireEvent.input(input, { target: { value } });
    };
    set('lead-first-name', 'Fulano');
    set('lead-last-name', 'de Tal');
    set('lead-email', 'fulano@test.com');
    set('lead-whatsapp', '11999998888');
    const lgpd = container.querySelector('input[type="checkbox"]');
    if (lgpd) fireEvent.click(lgpd);

    const submitButton = () => {
        const button = Array.from(container.querySelectorAll('button'))
            .find((candidate) => candidate.textContent?.includes('Salvar e abrir WhatsApp'));
        if (!button) throw new Error('botão "Salvar e abrir WhatsApp" não encontrado');
        return button;
    };
    await act(async () => {
        fireEvent.click(submitButton());
        await Promise.resolve();
        await Promise.resolve();
    });
    await act(async () => {
        fireEvent.click(submitButton());
        await Promise.resolve();
        await Promise.resolve();
    });

    assert.equal(eventIds.length, 2);
    assert.equal(eventIds[0], eventIds[1]);
    cleanup();
});
