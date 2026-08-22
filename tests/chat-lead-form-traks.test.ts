import './helpers/dom-setup.ts';

import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, fireEvent } from '@testing-library/react';

import { ChatLeadForm } from '../components/ChatLeadForm.tsx';

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

        fireEvent.click(submitButton);
        // O handoff é síncrono no click handler (antes do await do finalize).
        await Promise.resolve();
        const handoffs = calls.filter((c) => c.name === 'whatsapp_click');
        assert.ok(handoffs.length >= 1, 'whatsapp_click deve ser emitido no submit validado');
    });
});
