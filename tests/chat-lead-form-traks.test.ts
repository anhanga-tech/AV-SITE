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
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
    }
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

test('popup bloqueado exibe link de fallback no ChatLeadForm após salvar o lead, sem contar whatsapp_click duas vezes', async () => {
    cleanup();
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => null,
    });

    try {
        await withTraksStub(async (calls) => {
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
            // O popup nunca navegou de fato — o listener global de cliques em
            // <a href="wa.me/..."> (utils/traks.ts) é quem deve contar o clique,
            // se o visitante usar o link de fallback. Contar aqui também
            // duplicaria a conversão.
            const handoffs = calls.filter((c) => c.name === 'whatsapp_click');
            assert.equal(handoffs.length, 0, 'whatsapp_click não deve ser emitido quando o popup é bloqueado');
        });
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});

test('ChatLeadForm bloqueia reenvio depois de confirmado (evita lead duplicado)', async () => {
    cleanup();
    let finalizeCalls = 0;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        onFinalizeLead: async (): Promise<LeadFinalizeResult> => {
            finalizeCalls += 1;
            return { ok: true };
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
    assert.equal(finalizeCalls, 1);
    assert.equal(submitButton().hasAttribute('disabled'), true, 'botão deve ficar desabilitado após o sucesso');

    // Um segundo clique (ex.: o visitante ignora o link de fallback e clica
    // de novo no botão principal) não pode reenviar o mesmo lead.
    fireEvent.click(submitButton());
    await Promise.resolve();
    assert.equal(finalizeCalls, 1, 'onFinalizeLead não deve ser chamado de novo após o sucesso');
    cleanup();
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

test('ChatLeadForm gera novo eventId se um campo for editado após falha (não reenvia dados corrigidos com id antigo)', async () => {
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

    // Visitor corrects the phone number after the failed attempt.
    set('lead-whatsapp', '11988887777');

    await act(async () => {
        fireEvent.click(submitButton());
        await Promise.resolve();
        await Promise.resolve();
    });

    assert.equal(eventIds.length, 2);
    assert.notEqual(eventIds[0], eventIds[1], 'editar um campo após a falha deve gerar um novo eventId');
    cleanup();
});

test('generate_lead só é disparado após confirmação do CRM, uma única vez mesmo com retry', async () => {
    cleanup();
    const previousDataLayer = window.dataLayer;
    window.dataLayer = [];
    let attempt = 0;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        onFinalizeLead: async (): Promise<LeadFinalizeResult> => {
            attempt += 1;
            return attempt === 1
                ? { ok: false, error: 'odoo upstream failed', requestId: 'req-1' }
                : { ok: true };
        },
    };

    try {
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
        const generateLeadEvents = () =>
            (window.dataLayer ?? []).filter(
                (entry) => entry && typeof entry === 'object' && 'event' in entry && entry.event === 'generate_lead',
            );

        await act(async () => {
            fireEvent.click(submitButton());
            await Promise.resolve();
            await Promise.resolve();
        });
        assert.equal(generateLeadEvents().length, 0, 'não deve reportar conversão numa submissão que falhou');

        await act(async () => {
            fireEvent.click(submitButton());
            await Promise.resolve();
            await Promise.resolve();
        });
        assert.equal(generateLeadEvents().length, 1, 'deve reportar a conversão uma única vez, após o retry bem-sucedido');
    } finally {
        window.dataLayer = previousDataLayer;
        cleanup();
    }
});

test('fechar o drawer do chat durante o envio pendente cancela o handoff mas ainda reporta a conversão confirmada', async () => {
    cleanup();
    const previousDataLayer = window.dataLayer;
    window.dataLayer = [];
    let resolveFinalize: ((result: LeadFinalizeResult) => void) | null = null;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        isOpen: true,
        onFinalizeLead: () => new Promise<LeadFinalizeResult>((resolve) => { resolveFinalize = resolve; }),
    };

    let closedCount = 0;
    let navigatedTo: string | null = null;
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => {
            let closed = false;
            return {
                get closed() { return closed; },
                close() {
                    closed = true;
                    closedCount += 1;
                },
                location: { set href(v: string) { navigatedTo = v; } },
                opener: null,
            };
        },
    });

    try {
        const { container, rerender, getByRole } = render(React.createElement(ChatLeadForm, props));
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

        fireEvent.click(submitButton);
        await Promise.resolve();
        assert.ok(resolveFinalize, 'onFinalizeLead deve ter sido chamado e estar pendente');

        // Visitor closes the chat drawer while the CRM request is still in flight.
        rerender(React.createElement(ChatLeadForm, { ...props, isOpen: false }));

        await act(async () => {
            resolveFinalize?.({ ok: true });
            await Promise.resolve();
            await Promise.resolve();
        });

        assert.equal(navigatedTo, null, 'não deve navegar para o WhatsApp depois do dismiss');
        assert.equal(closedCount, 1, 'a aba reservada deve ser fechada, não deixada em branco');
        // O lead foi confirmado pelo CRM de verdade — a conversão não pode
        // desaparecer do dataLayer só porque o drawer foi fechado antes da
        // resposta chegar.
        const generateLeadEvents = (window.dataLayer ?? []).filter(
            (entry) => entry && typeof entry === 'object' && 'event' in entry && entry.event === 'generate_lead',
        );
        assert.equal(generateLeadEvents.length, 1, 'generate_lead deve disparar mesmo com o drawer fechado');
        const submitSuccessEvents = (window.dataLayer ?? []).filter(
            (entry) => entry && typeof entry === 'object' && 'event' in entry && entry.event === 'submit_success',
        );
        assert.equal(submitSuccessEvents.length, 1, 'submit_success deve disparar mesmo com o drawer fechado');
        // Reabrindo o drawer, o visitante precisa ver que o lead foi salvo e
        // ter como continuar — não um formulário travado sem explicação.
        assert.equal(
            getByRole('link', { name: 'Abrir WhatsApp' }).getAttribute('href'),
            'https://wa.me/5511955021519?text=test',
        );
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        window.dataLayer = previousDataLayer;
        cleanup();
    }
});

test('fechar o drawer cancela a aba reservada imediatamente, sem esperar a resposta do CRM', async () => {
    cleanup();
    let resolveFinalize: ((result: LeadFinalizeResult) => void) | null = null;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        isOpen: true,
        onFinalizeLead: () => new Promise<LeadFinalizeResult>((resolve) => { resolveFinalize = resolve; }),
    };

    let closedCount = 0;
    let navigatedTo: string | null = null;
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => {
            let closed = false;
            return {
                get closed() { return closed; },
                close() {
                    closed = true;
                    closedCount += 1;
                },
                location: { set href(v: string) { navigatedTo = v; } },
                opener: null,
            };
        },
    });

    try {
        const { container, rerender } = render(React.createElement(ChatLeadForm, props));
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

        fireEvent.click(submitButton);
        await Promise.resolve();
        assert.ok(resolveFinalize, 'onFinalizeLead deve ter sido chamado e estar pendente');

        // Visitor closes the drawer — the CRM request is still pending and
        // could be slow or hung. The tab must close right away, not wait
        // for that request to eventually settle.
        rerender(React.createElement(ChatLeadForm, { ...props, isOpen: false }));

        assert.equal(closedCount, 1, 'a aba deve ser fechada assim que o drawer fecha, antes da resposta do CRM');
        assert.equal(navigatedTo, null);

        // The request eventually resolving afterward must not reopen/renavigate anything.
        await act(async () => {
            resolveFinalize?.({ ok: true });
            await Promise.resolve();
            await Promise.resolve();
        });
        assert.equal(closedCount, 1, 'não deve tentar fechar/reservar de novo quando a resposta chega depois');
        assert.equal(navigatedTo, null);
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});

test('reabrir o drawer não desfaz uma dispensa ocorrida durante o envio pendente', async () => {
    cleanup();
    let resolveFinalize: ((result: LeadFinalizeResult) => void) | null = null;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        isOpen: true,
        onFinalizeLead: () => new Promise<LeadFinalizeResult>((resolve) => { resolveFinalize = resolve; }),
    };

    let closedCount = 0;
    let navigatedTo: string | null = null;
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => {
            let closed = false;
            return {
                get closed() { return closed; },
                close() {
                    closed = true;
                    closedCount += 1;
                },
                location: { set href(v: string) { navigatedTo = v; } },
                opener: null,
            };
        },
    });

    try {
        const { container, rerender } = render(React.createElement(ChatLeadForm, props));
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

        fireEvent.click(submitButton);
        await Promise.resolve();
        assert.ok(resolveFinalize, 'onFinalizeLead deve ter sido chamado e estar pendente');

        // Visitor closes the drawer, then reopens it — via the always-mounted
        // trigger — before the CRM request resolves.
        rerender(React.createElement(ChatLeadForm, { ...props, isOpen: false }));
        rerender(React.createElement(ChatLeadForm, { ...props, isOpen: true }));

        await act(async () => {
            resolveFinalize?.({ ok: true });
            await Promise.resolve();
            await Promise.resolve();
        });

        assert.equal(navigatedTo, null, 'a dispensa durante o envio deve continuar valendo mesmo reabrindo o drawer');
        assert.equal(closedCount, 1, 'a aba reservada deve ser fechada, não deixada em branco');
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});

test('ChatLeadForm fecha a aba reservada se onFinalizeLead lançar exceção (não deixa aba em branco)', async () => {
    cleanup();
    let closedCount = 0;
    let navigatedTo: string | null = null;
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => {
            let closed = false;
            return {
                get closed() { return closed; },
                close() {
                    closed = true;
                    closedCount += 1;
                },
                location: { set href(v: string) { navigatedTo = v; } },
                opener: null,
            };
        },
    });

    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        onFinalizeLead: async (): Promise<LeadFinalizeResult> => {
            throw new Error('rejeição inesperada');
        },
    };

    try {
        const { container, getByRole } = render(React.createElement(ChatLeadForm, props));
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

        assert.equal(navigatedTo, null, 'não deve navegar para o WhatsApp quando onFinalizeLead lança');
        assert.equal(closedCount, 1, 'a aba reservada deve ser fechada, não deixada em branco');
        assert.equal(
            getByRole('alert').textContent,
            'Não foi possível salvar seu contato. Tente novamente.',
        );
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        cleanup();
    }
});

test('campos do ChatLeadForm ficam desabilitados durante o envio (edição não pode ficar presa depois do sucesso)', async () => {
    cleanup();
    let resolveFinalize: ((result: LeadFinalizeResult) => void) | null = null;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        onFinalizeLead: () => new Promise<LeadFinalizeResult>((resolve) => { resolveFinalize = resolve; }),
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

    const submitButton = Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent?.includes('Salvar e abrir WhatsApp'));
    assert.ok(submitButton, 'botão "Salvar e abrir WhatsApp" deve existir');

    fireEvent.click(submitButton);
    await Promise.resolve();
    assert.ok(resolveFinalize, 'onFinalizeLead deve ter sido chamado e estar pendente');

    const firstNameInput = container.querySelector('#lead-first-name') as HTMLInputElement;
    assert.equal(firstNameInput.disabled, true, 'campos devem ficar desabilitados enquanto o envio está pendente');

    await act(async () => {
        resolveFinalize?.({ ok: true });
        await Promise.resolve();
        await Promise.resolve();
    });

    assert.equal(firstNameInput.disabled, true, 'campos continuam desabilitados após o sucesso (evita editar dados já enviados)');
    cleanup();
});

test('desmontar o ChatLeadForm durante o envio pendente fecha a aba reservada', async () => {
    cleanup();
    const previousDataLayer = window.dataLayer;
    window.dataLayer = [];
    let resolveFinalize: ((result: LeadFinalizeResult) => void) | null = null;
    const props: React.ComponentProps<typeof ChatLeadForm> = {
        ...makeProps(),
        onFinalizeLead: () => new Promise<LeadFinalizeResult>((resolve) => { resolveFinalize = resolve; }),
    };

    let closedCount = 0;
    let navigatedTo: string | null = null;
    const previousOpen = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => {
            let closed = false;
            return {
                get closed() { return closed; },
                close() {
                    closed = true;
                    closedCount += 1;
                },
                location: { set href(v: string) { navigatedTo = v; } },
                opener: null,
            };
        },
    });

    try {
        const { container, unmount } = render(React.createElement(ChatLeadForm, props));
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

        fireEvent.click(submitButton);
        await Promise.resolve();
        assert.ok(resolveFinalize, 'onFinalizeLead deve ter sido chamado e estar pendente');

        // Visitor navigates away entirely — e.g. to a landing route where
        // App.tsx doesn't render <AIChat> — unmounting the whole chat while
        // the CRM request is still pending.
        unmount();

        await act(async () => {
            resolveFinalize?.({ ok: true });
            await Promise.resolve();
            await Promise.resolve();
        });

        assert.equal(navigatedTo, null, 'não deve navegar para o WhatsApp depois do componente desmontar');
        assert.equal(closedCount, 1, 'a aba reservada deve ser fechada no unmount, não deixada em branco');
        // A conversão é real (o CRM confirmou) e deve continuar sendo
        // reportada mesmo com o componente desmontado — mas o evento de
        // handoff do WhatsApp não deve disparar para um "sucesso" que
        // ninguém vai ver nem navegar (não há mais UI para mostrar o link
        // de fallback).
        const generateLeadEvents = (window.dataLayer ?? []).filter(
            (entry) => entry && typeof entry === 'object' && 'event' in entry && entry.event === 'generate_lead',
        );
        assert.equal(generateLeadEvents.length, 1, 'generate_lead deve disparar mesmo com o componente desmontado');
        const submitSuccessEvents = (window.dataLayer ?? []).filter(
            (entry) => entry && typeof entry === 'object' && 'event' in entry && entry.event === 'submit_success',
        );
        assert.equal(submitSuccessEvents.length, 1, 'submit_success deve disparar mesmo com o componente desmontado');
        const whatsappOpenedEvents = (window.dataLayer ?? []).filter(
            (entry) => entry && typeof entry === 'object' && 'event' in entry && entry.event === 'whatsapp_opened',
        );
        assert.equal(
            whatsappOpenedEvents.length,
            0,
            'whatsapp_opened não deve disparar para um handoff já abandonado pelo unmount',
        );
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previousOpen,
        });
        window.dataLayer = previousDataLayer;
        cleanup();
    }
});
