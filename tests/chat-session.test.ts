import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MAX_CHAT_MESSAGES,
    buildHandoffData,
    canSendMessage,
    getAssistantPresentation,
    getInitialChatPhase,
    resolvePhaseOnAssistantResponse,
    resolvePhaseOnLeadSubmit,
    resolvePhaseOnUserSend,
} from '../hooks/useChatSession.ts';

test('canSendMessage should enforce 50-message limit', () => {
    assert.equal(canSendMessage(MAX_CHAT_MESSAGES - 1, false), true);
    assert.equal(canSendMessage(MAX_CHAT_MESSAGES, false), false);
});

test('canSendMessage should block while loading', () => {
    assert.equal(canSendMessage(1, true), false);
});

test('getAssistantPresentation should strip structured chips and expose options', () => {
    const responseText = 'Quantos adultos viajarão?\n[CHIPS: 1 | 2 | 3 | 4+]';

    const presentation = getAssistantPresentation(responseText);

    assert.equal(presentation.cleanText, 'Quantos adultos viajarão?');
    assert.deepEqual(presentation.chips, ['1', '2', '3', '4+']);
});

test('buildHandoffData should create pending handoff payload from budget link', () => {
    const handoff = buildHandoffData({
        budgetLink: {
            origin: 'São Paulo, SP',
            destination: 'Rio de Janeiro, RJ',
            dates: 'setembro',
            baggagePreference: 'Mala de mão',
            url: 'https://wa.me/551152833309?text=teste',
            bantSummary: 'Need: lazer',
        },
    });

    assert.ok(handoff);
    assert.equal(handoff?.destination, 'Rio de Janeiro, RJ');
    assert.equal(handoff?.whatsappUrl, 'https://wa.me/551152833309?text=teste');
});

test('chat phase transitions should follow input -> conversation -> lead-form -> handoff', () => {
    const initial = getInitialChatPhase('input');
    const afterSend = resolvePhaseOnUserSend(initial);
    const afterTool = resolvePhaseOnAssistantResponse(true);
    const afterLeadSubmit = resolvePhaseOnLeadSubmit();

    assert.equal(initial, 'input');
    assert.equal(afterSend, 'conversation');
    assert.equal(afterTool, 'lead-form');
    assert.equal(afterLeadSubmit, 'handoff');
});

test('reset should return to configured initial phase', () => {
    const heroInitial = getInitialChatPhase('input');
    const widgetInitial = getInitialChatPhase('conversation');

    assert.equal(heroInitial, 'input');
    assert.equal(widgetInitial, 'conversation');
});
