import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAttributionMetadataConfig, pushConsultoriaBookingCreatedDataLayerEvent } from '../lib/cal-embed.ts';

type MockSessionStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createSessionStorage(): MockSessionStorage {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => { store.set(key, value); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); },
  };
}

function withMockBrowserEnv(search: string, run: () => void): void {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        search,
        hash: '',
        href: `https://www.anhanga.tur.br/consultoria-de-viagem/${search}`,
      },
      dataLayer: [] as Array<Record<string, unknown>>,
    },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { cookie: '' },
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: createSessionStorage(),
  });

  try {
    run();
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: previousSessionStorage });
  }
}

function withMockWindow(href: string, run: (pushed: unknown[]) => void): void {
  const pushed: unknown[] = [];
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { href },
      dataLayer: { push: (event: unknown) => pushed.push(event) },
    },
    configurable: true,
  });

  try {
    run(pushed);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      value: previousWindow,
      configurable: true,
    });
  }
}

test('pushConsultoriaBookingCreatedDataLayerEvent pushes a funnel event and a unified form_submission with the booking uid as event_id', () => {
  withMockWindow('https://www.anhanga.tur.br/consultoria-de-viagem/', (pushed) => {
    pushConsultoriaBookingCreatedDataLayerEvent('cal_booking_abc123');

    assert.equal(pushed.length, 2);
    assert.deepEqual(pushed[0], {
      event: 'consultoria_booking_created',
      event_id: 'cal_booking_abc123',
      page_location: 'https://www.anhanga.tur.br/consultoria-de-viagem/',
    });
    assert.deepEqual(pushed[1], {
      event: 'form_submission',
      form_type: 'consultoria_booking',
      form_id: 'cal_booking_abc123',
      page_location: 'https://www.anhanga.tur.br/consultoria-de-viagem/',
    });
  });
});

// Ordem importa: utils/whatsapp.ts guarda um cache em memória a nível de
// módulo (cachedTrackingObject) que sobrevive entre testes deste arquivo (o
// runner do node:test isola por arquivo, não por teste). Este caso "vazio"
// roda ANTES do caso populado abaixo para não herdar o cache que ele preenche.
test('buildAttributionMetadataConfig returns an empty object when there is no tracking data to propagate', () => {
  withMockBrowserEnv('', () => {
    assert.deepEqual(buildAttributionMetadataConfig(), {});
  });
});

test('buildAttributionMetadataConfig maps captured UTMs/click IDs into Cal.com metadata[key] config entries', () => {
  withMockBrowserEnv('?utm_source=google&utm_medium=cpc&utm_campaign=consultoria&gclid=test-gclid', () => {
    const config = buildAttributionMetadataConfig();

    assert.deepEqual(config, {
      'metadata[utm_source]': 'google',
      'metadata[utm_medium]': 'cpc',
      'metadata[utm_campaign]': 'consultoria',
      'metadata[gclid]': 'test-gclid',
    });
  });
});

test('pushConsultoriaBookingCreatedDataLayerEvent is a no-op without window.dataLayer', () => {
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    value: { location: { href: 'https://www.anhanga.tur.br/' } },
    configurable: true,
  });

  try {
    assert.doesNotThrow(() => pushConsultoriaBookingCreatedDataLayerEvent('cal_booking_abc123'));
  } finally {
    Object.defineProperty(globalThis, 'window', {
      value: previousWindow,
      configurable: true,
    });
  }
});
