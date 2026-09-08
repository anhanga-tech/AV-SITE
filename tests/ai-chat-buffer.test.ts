import test, { beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';

// --- Mocks de browser APIs ---
const eventsFired: string[] = [];

Object.defineProperty(globalThis, 'dispatchEvent', {
  value: (event: Event) => { eventsFired.push(event.type); return true; },
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
  writable: true,
});

// Importar APÓS configurar os mocks (execução de módulo ocorre no import)
const { openAiChat, registerAiChatToggleListener, unregisterAiChatToggleListener } = await import('../utils/aiChat.ts');

// --- Helpers ---
function clearAll() {
  eventsFired.length = 0;
  unregisterAiChatToggleListener();
}

// --- Testes ---
describe('openAiChat() — contrato buffer/drain (AIChat lazy)', () => {
  beforeEach(clearAll);

  test('despacha toggle-ai-chat quando o listener do AIChat já está registrado', () => {
    registerAiChatToggleListener();
    openAiChat({ message: 'Quero ir para Lisboa' });
    assert.ok(eventsFired.includes('toggle-ai-chat'));
  });

  test('bufferiza o intent antes de o AIChat montar e drena no registro', () => {
    // AIChat lazy ainda não montou: o intent não pode se perder.
    openAiChat({ message: 'Quero ir para Lisboa' });
    assert.ok(!eventsFired.includes('toggle-ai-chat'), 'não despacha antes de registrar');
    registerAiChatToggleListener();
    assert.ok(eventsFired.includes('toggle-ai-chat'), 'drena na montagem do AIChat');
  });

  test('sem mensagem, o drain dispara o evento sem detail', () => {
    openAiChat(); // sem message
    registerAiChatToggleListener();
    assert.ok(eventsFired.includes('toggle-ai-chat'));
  });

  test('após desmontar (unregister), volta a bufferizar em vez de despachar para lugar nenhum', () => {
    registerAiChatToggleListener();
    openAiChat({ message: 'primeiro' });
    assert.ok(eventsFired.includes('toggle-ai-chat'));
    eventsFired.length = 0;

    // Navegação para landing desmonta o AIChat → unregister.
    unregisterAiChatToggleListener();
    openAiChat({ message: 'segundo' });
    assert.ok(!eventsFired.includes('toggle-ai-chat'), 'bufferiza após desmontar');

    // Remount → drena.
    registerAiChatToggleListener();
    assert.ok(eventsFired.includes('toggle-ai-chat'), 'drena no remount');
  });
});
