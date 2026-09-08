import test, { beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';

// --- Mocks de browser APIs ---
interface CapturedToggleEvent {
  detail?: { message?: string };
}
const capturedEvents: CapturedToggleEvent[] = [];

Object.defineProperty(globalThis, 'dispatchEvent', {
  value: (event: Event) => {
    capturedEvents.push({ detail: (event as CustomEvent).detail });
    return true;
  },
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
  capturedEvents.length = 0;
  unregisterAiChatToggleListener();
}

function lastEvent(): CapturedToggleEvent | undefined {
  return capturedEvents[capturedEvents.length - 1];
}

// --- Testes ---
describe('openAiChat() — contrato buffer/drain (AIChat lazy)', () => {
  beforeEach(clearAll);

  test('despacha toggle-ai-chat com a mensagem no detail quando o listener já está registrado', () => {
    registerAiChatToggleListener();
    openAiChat({ message: 'Quero ir para Lisboa' });
    assert.strictEqual(capturedEvents.length, 1);
    assert.strictEqual(lastEvent()?.detail?.message, 'Quero ir para Lisboa');
  });

  test('bufferiza o intent antes de o AIChat montar e drena no registro preservando a mensagem', () => {
    // AIChat lazy ainda não montou: o intent não pode se perder nem ter a mensagem alterada.
    openAiChat({ message: 'Quero ir para Lisboa' });
    assert.strictEqual(capturedEvents.length, 0, 'não despacha antes de registrar');

    registerAiChatToggleListener();
    assert.strictEqual(capturedEvents.length, 1, 'drena na montagem do AIChat');
    assert.strictEqual(lastEvent()?.detail?.message, 'Quero ir para Lisboa', 'mensagem preservada no drain');
  });

  test('sem mensagem, o evento não carrega detail.message', () => {
    registerAiChatToggleListener();
    openAiChat(); // sem message
    assert.strictEqual(capturedEvents.length, 1);
    // CustomEvent sem detail: o listener recebe detail === null (padrão do DOM).
    assert.strictEqual(lastEvent()?.detail?.message, undefined, 'sem message não inclui detail.message');
  });

  test('bufferiza um openAiChat sem mensagem antes do registro e drena sem detail', () => {
    openAiChat(); // sem message, AIChat ainda não montou
    assert.strictEqual(capturedEvents.length, 0);
    registerAiChatToggleListener();
    assert.strictEqual(capturedEvents.length, 1);
    assert.strictEqual(lastEvent()?.detail?.message, undefined, 'drain de intent sem mensagem não inclui detail.message');
  });

  test('após desmontar (unregister), volta a bufferizar em vez de despachar para lugar nenhum', () => {
    registerAiChatToggleListener();
    openAiChat({ message: 'primeiro' });
    assert.strictEqual(capturedEvents.length, 1);
    capturedEvents.length = 0;

    // Navegação para landing desmonta o AIChat → unregister.
    unregisterAiChatToggleListener();
    openAiChat({ message: 'segundo' });
    assert.strictEqual(capturedEvents.length, 0, 'bufferiza após desmontar');

    // Remount → drena com a mensagem correta.
    registerAiChatToggleListener();
    assert.strictEqual(capturedEvents.length, 1, 'drena no remount');
    assert.strictEqual(lastEvent()?.detail?.message, 'segundo', 'mensagem do intent pós-unmount preservada');
  });
});
