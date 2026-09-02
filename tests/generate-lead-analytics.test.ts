import test from 'node:test';
import assert from 'node:assert/strict';
import { pushGenerateLeadConversionEvent } from '../utils/generate-lead-analytics.ts';

function withMockWindow(run: (pushed: Record<string, unknown>[]) => void): void {
    const pushed: Record<string, unknown>[] = [];
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
        value: {
            location: { href: 'https://www.anhanga.tur.br/' },
            dataLayer: { push: (event: Record<string, unknown>) => pushed.push(event) },
        },
        configurable: true,
    });

    try {
        run(pushed);
    } finally {
        Object.defineProperty(globalThis, 'window', { value: previousWindow, configurable: true });
    }
}

test('pushGenerateLeadConversionEvent includes a safe destination', () => {
    withMockWindow((pushed) => {
        pushGenerateLeadConversionEvent({
            eventId: 'lead-1',
            destination: 'Quero planejar uma viagem para Orlando',
            utms: { utm_source: 'google' },
            tracking: { cid: '123.456' },
        });

        assert.equal(pushed[0].destination, 'Quero planejar uma viagem para Orlando');
    });
});

// Regressão (achado de review, chatgpt-codex-connector[bot], P1): destination é texto livre
// digitado pelo usuário e podia conter um e-mail/telefone colado sem nenhum filtro antes de
// ir pro dataLayer (generate_lead), que o Zaraz encaminha ao GA4 sem scrubbing.
test('pushGenerateLeadConversionEvent omite destination com formato de e-mail ou telefone', () => {
    withMockWindow((pushed) => {
        pushGenerateLeadConversionEvent({
            eventId: 'lead-2',
            destination: 'meu email é alice@example.com',
            utms: { utm_source: 'google' },
        });

        assert.ok(!('destination' in pushed[0]), 'destination com e-mail não deve ir pro dataLayer');
    });

    withMockWindow((pushed) => {
        pushGenerateLeadConversionEvent({
            eventId: 'lead-3',
            destination: '+5511999999999',
        });

        assert.ok(!('destination' in pushed[0]), 'destination com telefone não deve ir pro dataLayer');
    });
});

test('pushGenerateLeadConversionEvent still pushes the other fields when destination is redacted', () => {
    withMockWindow((pushed) => {
        pushGenerateLeadConversionEvent({
            eventId: 'lead-4',
            destination: 'alice@example.com',
            utms: { utm_source: 'google', utm_medium: 'cpc' },
            tracking: { cid: '123.456', sid: '789' },
        });

        assert.equal(pushed[0].event, 'generate_lead');
        assert.equal(pushed[0].event_id, 'lead-4');
        assert.equal(pushed[0].utm_source, 'google');
        assert.equal(pushed[0].ga_client_id, '123.456');
        assert.equal(pushed[0].ga_session_id, '789');
    });
});

test('pushGenerateLeadConversionEvent tolerates a missing destination', () => {
    withMockWindow((pushed) => {
        pushGenerateLeadConversionEvent({
            eventId: 'lead-5',
            utms: { utm_source: 'google' },
        });

        assert.equal(pushed[0].event, 'generate_lead');
        assert.ok(!('destination' in pushed[0]));
    });
});

test('pushGenerateLeadConversionEvent is a no-op without window.dataLayer', () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true });

    try {
        assert.doesNotThrow(() => {
            pushGenerateLeadConversionEvent({ eventId: 'lead-6', destination: 'Quero viajar' });
        });
    } finally {
        Object.defineProperty(globalThis, 'window', { value: previousWindow, configurable: true });
    }
});
