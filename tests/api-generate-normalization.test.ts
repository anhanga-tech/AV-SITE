import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenerateSuccessBody, containsInvalidTextualHandoff, type ModelResponseShape } from '../api/generate.ts';

function buildToolResponse(args: Record<string, unknown>, text = 'Prontinho!'): ModelResponseShape {
    return {
        responseId: 'resp-tool',
        candidates: [
            {
                content: {
                    parts: [
                        { text },
                        {
                            functionCall: {
                                name: 'generate_budget_link',
                                args,
                            },
                        },
                    ],
                },
            },
        ],
    };
}

test('containsInvalidTextualHandoff should detect raw handoff CTA text', () => {
    assert.equal(
        containsInvalidTextualHandoff('Clique aqui para receber seu orçamento personalizado no WhatsApp: https://wa.me/5511999999999'),
        true,
    );
    assert.equal(
        containsInvalidTextualHandoff('Posso te ajudar com datas e orçamento.'),
        false,
    );
});

test('buildGenerateSuccessBody should expose structured handoff from tool response', async () => {
    const body = await buildGenerateSuccessBody(
        buildToolResponse({
            destination: 'Orlando',
            destination_city: 'Orlando',
            destination_region: 'Flórida',
            origin_city: 'São Paulo',
            origin_region: 'SP',
            dates: 'junho de 2026',
            adults: 2,
            need_summary: 'Viagem em família',
            decision_role: 'casal',
            budget_range: 'R$ 20 mil+',
            timeline_window: 'junho de 2026',
            baggage_preference: 'bagagem despachada',
            iata_code: 'MCO',
        }),
        {
            apiKey: 'test-key',
            modelName: 'test-model',
            contents: [],
        },
    );

    assert.equal(body.handoff?.source, 'tool');
    assert.equal(body.handoff?.origin, 'São Paulo, SP');
    assert.equal(body.handoff?.destination, 'Orlando, Flórida');
    assert.equal(body.handoff?.dates, 'junho de 2026');
    assert.equal(body.handoff?.baggagePreference, 'bagagem despachada');
    assert.equal(body.handoff?.iataCode, 'MCO');
});

test('buildGenerateSuccessBody should refuse international handoff without baggage preference', async () => {
    const body = await buildGenerateSuccessBody(
        buildToolResponse({
            destination: 'Paris',
            destination_city: 'Paris',
            destination_region: 'França',
            origin_city: 'São Paulo',
            origin_region: 'SP',
            dates: 'junho de 2026',
            adults: 2,
            trip_scope: 'international',
            need_summary: 'Viagem em casal',
            decision_role: 'casal',
            budget_range: 'R$ 30 mil+',
            timeline_window: 'junho de 2026',
            iata_code: 'CDG',
        }, 'Para finalizarmos, você prefere mala de mão ou bagagem despachada?'),
        {
            apiKey: 'test-key',
            modelName: 'test-model',
            contents: [],
        },
    );

    assert.equal(body.handoff, undefined);
    assert.match(body.text, /preferência de bagagem/i);
});

test('buildGenerateSuccessBody should repair textual handoff into structured payload', async () => {
    const body = await buildGenerateSuccessBody(
        {
            responseId: 'resp-text',
            text: 'Clique aqui para receber seu orçamento personalizado: [WhatsApp](https://wa.me/5511999999999)',
        },
        {
            apiKey: 'test-key',
            modelName: 'test-model',
            contents: [{ role: 'user', parts: [{ text: 'Quero ir para Orlando em junho.' }] }],
            repairModelResponse: async () => buildToolResponse({
                destination: 'Orlando',
                destination_city: 'Orlando',
                destination_region: 'Flórida',
                origin_city: 'Campinas',
                origin_region: 'SP',
                dates: 'junho de 2026',
                adults: 2,
                need_summary: 'Viagem em família',
                decision_role: 'casal',
                budget_range: 'R$ 20 mil+',
                timeline_window: 'junho de 2026',
                baggage_preference: 'bagagem despachada',
                iata_code: 'MCO',
            }),
        },
    );

    assert.equal(body.handoff?.source, 'repair');
    assert.match(body.text, /pré-atendimento está pronto/i);
    assert.doesNotMatch(body.text, /wa\.me/i);
});

test('buildGenerateSuccessBody should handle non-array parts from Gemini response gracefully', async () => {
    // Gemini can return non-array `parts` on certain safety stops
    const malformedResponse: ModelResponseShape = {
        responseId: 'resp-malformed',
        text: 'Posso te ajudar com a viagem.',
        candidates: [
            {
                content: {
                    parts: null as unknown as [],
                },
            },
        ],
    };

    const body = await buildGenerateSuccessBody(malformedResponse, {
        apiKey: 'test-key',
        modelName: 'test-model',
        contents: [],
    });

    assert.equal(typeof body.text, 'string');
    assert.ok(body.text.length > 0, 'should fall back to response.text when parts is non-array');
});

test('buildGenerateSuccessBody should fall back to refinement when textual handoff repair is invalid', async () => {
    const body = await buildGenerateSuccessBody(
        {
            responseId: 'resp-invalid-text',
            text: 'Clique aqui para receber seu orçamento personalizado: https://wa.me/5511999999999',
        },
        {
            apiKey: 'test-key',
            modelName: 'test-model',
            contents: [{ role: 'user', parts: [{ text: 'Quero orçamento.' }] }],
            repairModelResponse: async () => buildToolResponse({
                destination: 'Orlando',
                destination_city: 'Orlando',
                dates: 'junho de 2026',
                adults: 2,
                iata_code: 'MCO',
            }),
        },
    );

    assert.equal(body.handoff, undefined);
    assert.match(body.text, /me confirme/i);
    assert.doesNotMatch(body.text, /wa\.me/i);
});
