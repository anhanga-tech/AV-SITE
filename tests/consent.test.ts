import test, { beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';

// --- Mocks de browser APIs ---
const eventsFired: string[] = [];
let store: Record<string, string> = {};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  },
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'dispatchEvent', {
  value: (event: Event) => { eventsFired.push(event.type); return true; },
  configurable: true,
  writable: true,
});

// Importar APÓS configurar os mocks (execução de módulo ocorre no import)
const { getConsent, setConsent, triggerResetBanner } = await import('../lib/consent.ts');

// --- Helpers ---
function clearAll() {
  store = {};
  eventsFired.length = 0;
}

// --- Testes ---
describe('getConsent()', () => {
  beforeEach(clearAll);

  test('retorna null quando chave ausente', () => {
    assert.strictEqual(getConsent(), null);
  });

  test('retorna "marketing" quando valor gravado é "marketing"', () => {
    store['anhanga_cookie_consent'] = 'marketing';
    assert.strictEqual(getConsent(), 'marketing');
  });

  test('retorna "essential" quando valor gravado é "essential"', () => {
    store['anhanga_cookie_consent'] = 'essential';
    assert.strictEqual(getConsent(), 'essential');
  });

  test('retorna null para valor inválido', () => {
    store['anhanga_cookie_consent'] = 'foo';
    assert.strictEqual(getConsent(), null);
  });
});

describe('setConsent("marketing")', () => {
  beforeEach(clearAll);

  test('grava "marketing" no localStorage', () => {
    setConsent('marketing');
    assert.strictEqual(store['anhanga_cookie_consent'], 'marketing');
  });

  test('grava metadados com choice, timestamp e version', () => {
    setConsent('marketing');
    const meta = JSON.parse(store['anhanga_cookie_consent_meta'] ?? '{}');
    assert.strictEqual(meta.choice, 'marketing');
    assert.strictEqual(meta.version, '1');
    assert.ok(meta.timestamp, 'timestamp deve estar presente');
    assert.doesNotThrow(() => new Date(meta.timestamp));
  });

  test('dispara anhanga:marketing-consent', () => {
    setConsent('marketing');
    assert.ok(eventsFired.includes('anhanga:marketing-consent'));
  });

  test('não dispara anhanga:revoke-consent', () => {
    setConsent('marketing');
    assert.ok(!eventsFired.includes('anhanga:revoke-consent'));
  });
});

describe('setConsent("essential") — primeira escolha (anterior era null)', () => {
  beforeEach(clearAll);

  test('grava "essential" no localStorage', () => {
    setConsent('essential');
    assert.strictEqual(store['anhanga_cookie_consent'], 'essential');
  });

  test('não dispara nenhum evento de consentimento', () => {
    setConsent('essential');
    assert.ok(!eventsFired.includes('anhanga:marketing-consent'));
    assert.ok(!eventsFired.includes('anhanga:revoke-consent'));
  });
});

describe('setConsent("essential") — revogação (anterior era "marketing")', () => {
  beforeEach(() => {
    clearAll();
    store['anhanga_cookie_consent'] = 'marketing';
  });

  test('grava "essential" no localStorage', () => {
    setConsent('essential');
    assert.strictEqual(store['anhanga_cookie_consent'], 'essential');
  });

  test('dispara anhanga:revoke-consent', () => {
    setConsent('essential');
    assert.ok(eventsFired.includes('anhanga:revoke-consent'));
  });

  test('não dispara anhanga:marketing-consent', () => {
    setConsent('essential');
    assert.ok(!eventsFired.includes('anhanga:marketing-consent'));
  });
});

describe('triggerResetBanner()', () => {
  beforeEach(clearAll);

  test('dispara anhanga:reset-consent', () => {
    triggerResetBanner();
    assert.ok(eventsFired.includes('anhanga:reset-consent'));
  });

  test('não altera o localStorage', () => {
    store['anhanga_cookie_consent'] = 'marketing';
    triggerResetBanner();
    assert.strictEqual(store['anhanga_cookie_consent'], 'marketing');
  });
});

describe('degradação silenciosa — localStorage indisponível', () => {
  test('getConsent() não lança exceção', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      get() { throw new Error('blocked'); },
      configurable: true,
    });
    assert.doesNotThrow(() => getConsent());
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true });
  });

  test('setConsent() não lança exceção', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      get() { throw new Error('blocked'); },
      configurable: true,
    });
    assert.doesNotThrow(() => setConsent('marketing'));
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true });
  });
});
