import test from 'node:test';
import assert from 'node:assert/strict';
import { getTravelAdvice } from '../services/geminiService.ts';

const originalFetch = global.fetch;

test('chatbot whatsapp message should omit BANT and tracking suffix', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
    });

    global.fetch = async () => new Response(
        JSON.stringify({
            functionCall: {
                name: 'generate_budget_link',
                args: {
                    origin_city: 'Porto Alegre',
                    origin_region: 'RS',
                    destination_city: 'Rio de Janeiro',
                    destination_region: 'RJ',
                    dates: 'próximo mês',
                    baggage_preference: 'Mala de mão',
                    need_summary: 'Viagem de lazer',
                    decision_role: 'não informado',
                    budget_range: 'até R$ 10 mil',
                    timeline_window: 'próximo mês',
                },
            },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

    const response = await getTravelAdvice([{ role: 'user', text: 'teste' }]);

    assert.ok(response.budgetLink, 'budgetLink should be present');

    const link = new URL(response.budgetLink!.url);
    const text = decodeURIComponent(link.searchParams.get('text') || '');

    assert.match(text, /Origem: Porto Alegre, RS/);
    assert.match(text, /Destino: Rio de Janeiro, RJ/);
    assert.match(text, /Datas: próximo mês/);
    assert.match(text, /Bagagem: Mala de mão/);

    assert.doesNotMatch(text, /Need:/);
    assert.doesNotMatch(text, /\|\| Dados:/);
});

test('chatbot whatsapp message should omit baggage line when unavailable', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
    });

    global.fetch = async () => new Response(
        JSON.stringify({
            functionCall: {
                name: 'generate_budget_link',
                args: {
                    origin_city: 'São Paulo',
                    origin_region: 'SP',
                    destination_city: 'Salvador',
                    destination_region: 'BA',
                    dates: 'setembro',
                    need_summary: 'Viagem de lazer',
                    decision_role: 'não informado',
                    budget_range: 'R$ 10-20 mil',
                    timeline_window: 'setembro',
                },
            },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

    const response = await getTravelAdvice([{ role: 'user', text: 'teste' }]);

    assert.ok(response.budgetLink, 'budgetLink should be present');

    const link = new URL(response.budgetLink!.url);
    const text = decodeURIComponent(link.searchParams.get('text') || '');

    assert.match(text, /Origem: São Paulo, SP/);
    assert.match(text, /Destino: Salvador, BA/);
    assert.match(text, /Datas: setembro/);
    assert.doesNotMatch(text, /Bagagem:/);
    assert.doesNotMatch(text, /\|\| Dados:/);
});

test('chatbot should return fallback text when API succeeds without usable content', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
    });

    global.fetch = async () => new Response(
        JSON.stringify({ chips: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

    const response = await getTravelAdvice([{ role: 'user', text: 'teste' }]);

    assert.equal(
        response.text,
        'Não consegui gerar uma resposta agora. Pode reformular sua pergunta e tentar novamente?',
    );
    assert.equal(response.budgetLink, undefined);
});
