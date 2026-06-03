# Cookie Consent Banner (CMP) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar banner de consentimento LGPD que bloqueia Mautic e HubSpot até aceite do usuário, integra Google Consent Mode v2, e oferece revogação a qualquer momento.

**Architecture:** `lib/consent.ts` gerencia estado puro em localStorage e dispara CustomEvents. `index.html` lê localStorage antes do React montar para gatekeear scripts de terceiros e configura Consent Mode v2. `CookieConsentBanner.tsx` monta em `AppLayout` ao lado de `ClientFeatures` e escuta eventos para reaparecer. Footers de todas as páginas expõem `triggerResetBanner()`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, `node:test` (unitários), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-06-03-cookie-consent-cmp-design.md`

---

## Chunk 1: `lib/consent.ts` + testes unitários

### Files
- Create: `lib/consent.ts`
- Create: `tests/consent.test.ts`

---

### Task 1: Escrever os testes unitários que vão falhar

**Files:**
- Create: `tests/consent.test.ts`

- [ ] **1.0 Confirmar que o projeto é ESM (pré-requisito para top-level await)**

```bash
grep '"type"' package.json
```

Esperado: `"type": "module"`. Se não aparecer, o `await import(...)` abaixo não funcionará — reportar ao usuário antes de continuar.

- [ ] **1.1 Criar `tests/consent.test.ts` com mocks e todos os casos**

```typescript
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
```

- [ ] **1.2 Verificar que os testes falham (arquivo alvo não existe)**

```bash
pnpm test:regression 2>&1 | grep "consent"
```

Esperado: erro `Cannot find module '../lib/consent.ts'` ou similar.

---

### Task 2: Implementar `lib/consent.ts`

**Files:**
- Create: `lib/consent.ts`

- [ ] **2.1 Criar `lib/consent.ts`**

```typescript
const CHOICE_KEY = 'anhanga_cookie_consent';
const META_KEY = 'anhanga_cookie_consent_meta';
const SCHEMA_VERSION = '1';

export type ConsentChoice = 'marketing' | 'essential';

export function getConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CHOICE_KEY);
    return v === 'marketing' || v === 'essential' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    const previous = localStorage.getItem(CHOICE_KEY);
    localStorage.setItem(CHOICE_KEY, choice);
    localStorage.setItem(
      META_KEY,
      JSON.stringify({ choice, timestamp: new Date().toISOString(), version: SCHEMA_VERSION })
    );
    if (choice === 'marketing') {
      dispatch(new CustomEvent('anhanga:marketing-consent'));
    } else if (previous === 'marketing') {
      dispatch(new Event('anhanga:revoke-consent'));
    }
  } catch {
    // localStorage indisponível (modo privado, storage cheio)
  }
}

export function triggerResetBanner(): void {
  // NÃO toca o localStorage — preserva valor anterior para detecção de transição em setConsent()
  dispatch(new Event('anhanga:reset-consent'));
}

function dispatch(event: Event): void {
  if (typeof window !== 'undefined') window.dispatchEvent(event);
  else if (typeof globalThis.dispatchEvent === 'function') globalThis.dispatchEvent(event);
}
```

- [ ] **2.2 Rodar testes e verificar que passam**

```bash
pnpm test:regression 2>&1 | grep -A 2 "consent"
```

Esperado: todos os casos passam, zero falhas.

- [ ] **2.3 Commit**

```bash
git add lib/consent.ts tests/consent.test.ts
git commit -m "feat(cmp): add lib/consent.ts with unit tests"
```

---

## Chunk 2: `index.html` — Consent Mode v2 + gates

### Files
- Modify: `index.html`
- Modify: `tests/index-third-party-scripts.test.ts`

---

### Task 3: Adicionar bloco Consent Mode v2 no `index.html`

**Files:**
- Modify: `index.html`

O bloco `<script>window.dataLayer = window.dataLayer || [];</script>` já existe. Adicionar o bloco de consent IMEDIATAMENTE APÓS ele e ANTES do `<script type="module" src="/index.tsx">`.

- [ ] **3.1 Inserir bloco gtag consent defaults**

Localizar no `index.html`:
```html
  <script>window.dataLayer = window.dataLayer || [];</script>
  <script type="module" src="/index.tsx"></script>
```

Substituir por:
```html
  <script>window.dataLayer = window.dataLayer || [];</script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    var _consentInit = (function () { try { return localStorage.getItem('anhanga_cookie_consent'); } catch (e) { return null; } })();
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: _consentInit === 'marketing' ? 'granted' : 'denied',
      ad_personalization: _consentInit === 'marketing' ? 'granted' : 'denied',
      ad_user_data: _consentInit === 'marketing' ? 'granted' : 'denied',
      wait_for_update: 2000
    });
  </script>
  <script type="module" src="/index.tsx"></script>
```

> **Importante:** `function gtag()` deve ficar no escopo **global** (fora de qualquer IIFE). Isso garante que os listeners `anhanga:marketing-consent` e `anhanga:revoke-consent`, definidos dentro da IIFE de scripts lazy, consigam chamar `gtag()` via `typeof gtag === 'function'` sem erro de escopo.

---

### Task 4: Adicionar `_consentChoice` e gates na IIFE existente

**Files:**
- Modify: `index.html`

A IIFE começa com `(function () {` e logo tem `var analyticsLoaded = false;`. Fazer duas modificações:

- [ ] **4.1 Adicionar leitura de `_consentChoice` no topo da IIFE**

Localizar o início da IIFE:
```js
    (function () {
      var analyticsLoaded = false;
```

Substituir por:
```js
    (function () {
      var _consentChoice = (function () { try { return localStorage.getItem('anhanga_cookie_consent'); } catch (e) { return null; } })();
      var analyticsLoaded = false;
```

- [ ] **4.2 Adicionar gate em `loadMautic`**

Localizar:
```js
      var loadMautic = function () {
        if (mauticLoaded) return;
```

Substituir por:
```js
      var loadMautic = function () {
        if (_consentChoice !== 'marketing') return;
        if (mauticLoaded) return;
```

- [ ] **4.3 Adicionar gate em `loadHubspot`**

Localizar:
```js
      var loadHubspot = function () {
        if (hubspotLoaded) return;
```

Substituir por:
```js
      var loadHubspot = function () {
        if (_consentChoice !== 'marketing') return;
        if (hubspotLoaded) return;
```

- [ ] **4.4 Adicionar listeners `anhanga:marketing-consent` e `anhanga:revoke-consent` no final da IIFE, antes do `})()`**

Localizar o fechamento da IIFE `    })();` e adicionar os listeners ANTES dele:

```js
      window.addEventListener('anhanga:marketing-consent', function () {
        _consentChoice = 'marketing';
        loadMautic();
        loadHubspot();
        if (typeof gtag === 'function') {
          gtag('consent', 'update', { ad_storage: 'granted', ad_personalization: 'granted', ad_user_data: 'granted' });
        }
      }, { once: true });

      window.addEventListener('anhanga:revoke-consent', function () {
        _consentChoice = 'essential';
        if (typeof gtag === 'function') {
          gtag('consent', 'update', { ad_storage: 'denied', ad_personalization: 'denied', ad_user_data: 'denied' });
        }
        window.location.reload();
      }, { once: true });
```

---

### Task 5: Atualizar `tests/index-third-party-scripts.test.ts`

**Files:**
- Modify: `tests/index-third-party-scripts.test.ts`

- [ ] **5.1 Adicionar asserções de conformidade LGPD no final do arquivo**

Anexar ao final de `tests/index-third-party-scripts.test.ts`:

```typescript
test('index.html configura gtag consent defaults antes da IIFE de scripts lazy', () => {
  const consentBlockIndex = indexHtml.indexOf("gtag('consent', 'default'");
  const iifeIndex = indexHtml.indexOf('var analyticsLoaded');

  assert.ok(consentBlockIndex > -1, 'bloco gtag consent default deve existir');
  assert.ok(iifeIndex > -1, 'IIFE de scripts lazy deve existir');
  assert.ok(consentBlockIndex < iifeIndex, 'consent default deve vir antes da IIFE');

  assert.match(indexHtml, /analytics_storage:\s*'granted'/, 'analytics_storage deve ser granted por padrão (legítimo interesse)');
  assert.match(indexHtml, /ad_storage:.*'denied'/, 'ad_storage deve ser denied por padrão');
  assert.match(indexHtml, /wait_for_update:\s*2000/, 'wait_for_update deve ser 2000ms');
});

test('loadMautic tem gate de consentimento LGPD', () => {
  const loadMauticMatch = indexHtml.match(/var loadMautic\s*=\s*function\s*\(\)\s*\{([\s\S]*?)};/);
  assert.ok(loadMauticMatch, 'loadMautic deve estar definida');
  const body = loadMauticMatch[1];
  assert.match(body, /_consentChoice\s*!==\s*'marketing'/, 'loadMautic deve ter gate de consentimento');
});

test('loadHubspot tem gate de consentimento LGPD', () => {
  const loadHubspotMatch = indexHtml.match(/var loadHubspot\s*=\s*function\s*\(\)\s*\{([\s\S]*?)};/);
  assert.ok(loadHubspotMatch, 'loadHubspot deve estar definida');
  const body = loadHubspotMatch[1];
  assert.match(body, /_consentChoice\s*!==\s*'marketing'/, 'loadHubspot deve ter gate de consentimento');
});

test('index.html tem listener anhanga:marketing-consent', () => {
  assert.match(indexHtml, /anhanga:marketing-consent/, 'listener de aceite deve estar presente');
});

test('index.html tem listener anhanga:revoke-consent com reload', () => {
  assert.match(indexHtml, /anhanga:revoke-consent/, 'listener de revogação deve estar presente');
  const revokeIdx = indexHtml.indexOf('anhanga:revoke-consent');
  const reloadIdx = indexHtml.indexOf('window.location.reload()', revokeIdx);
  assert.ok(reloadIdx > revokeIdx, 'reload deve ocorrer após revoke-consent');
});
```

- [ ] **5.2 Rodar testes**

```bash
pnpm test:regression 2>&1 | grep -E "(consent|Mautic|Hubspot|LGPD|pass|fail)" -i
```

Esperado: todos passam.

- [ ] **5.3 Commit**

```bash
git add index.html tests/index-third-party-scripts.test.ts
git commit -m "feat(cmp): add Consent Mode v2 and marketing script gates to index.html"
```

---

## Chunk 3: React — Banner + App.tsx + Footers

### Files
- Create: `components/CookieConsentBanner.tsx`
- Modify: `App.tsx`
- Modify: `components/Footer.tsx`
- Modify: `components/landings/shared/LandingFooter.tsx`
- Modify: `components/landings/beto-carrero/Footer.tsx`
- Modify: `components/landings/lollapalooza/Footer.tsx`
- Modify: `components/landings/corporativo/CorpFooter.tsx`

---

### Task 6: Criar `CookieConsentBanner.tsx`

**Files:**
- Create: `components/CookieConsentBanner.tsx`

- [ ] **6.1 Criar o componente**

```tsx
import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/lib/consent';

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setVisible(true);

    const handleReset = () => setVisible(true);
    window.addEventListener('anhanga:reset-consent', handleReset);
    return () => window.removeEventListener('anhanga:reset-consent', handleReset);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setConsent('marketing');
    setVisible(false);
  };

  const handleDecline = () => {
    setConsent('essential');
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-brand-dark border-t border-white/10 shadow-lg"
    >
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
          Usamos cookies de marketing (Mautic e HubSpot) para comunicações personalizadas.
          Analytics continua ativo por interesse legítimo —{' '}
          <a
            href="/politica-privacidade#cookies"
            className="underline underline-offset-2 hover:text-brand-yellow transition-colors"
          >
            saiba como se opor em nossa Política de Privacidade
          </a>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
```

> **LGPD:** Ambos os botões têm classes Tailwind idênticas — sem nenhuma distinção de cor. Não alterar isso.

---

### Task 7: Montar o banner em `App.tsx`

**Files:**
- Modify: `App.tsx`

O banner deve ficar no `AppLayout`, ao lado de `ClientFeatures`, para aparecer em **todas** as páginas incluindo landings.

- [ ] **7.1 Adicionar import no topo do `App.tsx`**

```tsx
import CookieConsentBanner from './components/CookieConsentBanner';
```

- [ ] **7.2 Adicionar o banner em `AppLayout`**

Localizar no `AppLayout`:
```tsx
      {includeClientFeatures ? (
        <ClientFeatures />
      ) : null}
```

Substituir por:
```tsx
      {includeClientFeatures ? (
        <ClientFeatures />
      ) : null}
      <ClientOnly>
        <CookieConsentBanner />
      </ClientOnly>
```

> **Por que fora do `if`:** o banner deve aparecer em **todas** as páginas independente de `includeClientFeatures`. Colocar dentro do bloco condicional esconderia o banner em contextos de teste/SSR que passam `includeClientFeatures={false}`.

---

### Task 8: Adicionar "Gerenciar cookies" no `Footer.tsx`

**Files:**
- Modify: `components/Footer.tsx`

- [ ] **8.1 Adicionar import de `triggerResetBanner`**

No topo de `components/Footer.tsx`, adicionar:
```tsx
import { triggerResetBanner } from '@/lib/consent';
```

- [ ] **8.2 Adicionar link na seção de copyright**

Localizar no footer o div com `text-[10px] text-zinc-400 font-bold uppercase`:
```tsx
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2">
                            Conteúdo da equipe Anhangá Viagens
                            {runtimeMetadata ? ` • Última atualização: ${runtimeMetadata.lastUpdatedLabel}` : null}
                        </div>
```

Adicionar APÓS esse div:
```tsx
                        <div className="text-[10px] text-zinc-400 mt-1">
                            <button
                                onClick={triggerResetBanner}
                                className="underline underline-offset-2 hover:text-brand-yellow transition-colors"
                            >
                                Gerenciar cookies
                            </button>
                        </div>
```

---

### Task 9: Adicionar "Gerenciar cookies" nos footers de landing pages

**Files:**
- Modify: `components/landings/shared/LandingFooter.tsx`
- Modify: `components/landings/beto-carrero/Footer.tsx`
- Modify: `components/landings/lollapalooza/Footer.tsx`
- Modify: `components/landings/corporativo/CorpFooter.tsx`

Padrão a aplicar em cada footer: importar `triggerResetBanner` e adicionar o botão "Gerenciar cookies" ao lado dos outros links/textos de rodapé.

- [ ] **9.1 `components/landings/shared/LandingFooter.tsx`**

Adicionar import:
```tsx
import { triggerResetBanner } from '@/lib/consent';
```

Localizar o elemento `<a href="https://www.anhanga.tur.br/"...>` (o link "Ir para o site principal") e adicionar após ele:
```tsx
                <button
                    onClick={triggerResetBanner}
                    className="text-xs text-white/50 hover:text-white transition-colors duration-150 font-medium underline underline-offset-2"
                >
                    Gerenciar cookies
                </button>
```

- [ ] **9.2 `components/landings/beto-carrero/Footer.tsx`**

Adicionar import:
```tsx
import { triggerResetBanner } from '@/lib/consent';
```

Localizar a seção de copyright/CNPJ no footer e adicionar antes do fechamento:
```tsx
        <button
          onClick={triggerResetBanner}
          className="text-xs opacity-60 hover:opacity-100 transition-opacity underline underline-offset-2 mt-2"
        >
          Gerenciar cookies
        </button>
```

- [ ] **9.3 `components/landings/lollapalooza/Footer.tsx`**

Adicionar import:
```tsx
import { triggerResetBanner } from '@/lib/consent';
```

Localizar no final do bloco `border-t border-zinc-800 pt-8`:
```tsx
          <p className="mt-4 text-xs opacity-50">
            Nota: Este site comercializa pacotes de viagem...
          </p>
        </div>
```

Adicionar após o `<p className="mt-4 text-xs opacity-50">`:
```tsx
          <p className="mt-3 text-xs opacity-50">
            <button
              onClick={triggerResetBanner}
              className="underline underline-offset-2 hover:opacity-100 transition-opacity"
            >
              Gerenciar cookies
            </button>
          </p>
```

- [ ] **9.4 `components/landings/corporativo/CorpFooter.tsx`**

`CorpFooter` é um re-export de `LandingFooter`:
```ts
export { LandingFooter as CorpFooter } from '../shared/LandingFooter';
```

O link "Gerenciar cookies" já está incluído pela task 9.1. Nenhuma ação necessária aqui.

- [ ] **9.5 Verificar build sem erros de TypeScript**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **9.6 Commit**

```bash
git add components/CookieConsentBanner.tsx App.tsx components/Footer.tsx \
  components/landings/shared/LandingFooter.tsx \
  components/landings/beto-carrero/Footer.tsx \
  components/landings/lollapalooza/Footer.tsx \
  components/landings/corporativo/CorpFooter.tsx
git commit -m "feat(cmp): add CookieConsentBanner and Gerenciar cookies links"
```

---

## Chunk 4: Testes E2E + atualização do RIPD

### Files
- Create: `tests/e2e/cookie-consent.spec.ts`
- Modify: `docs/ripd-legitimo-interesse.md`

---

### Task 10: Escrever testes Playwright

**Files:**
- Create: `tests/e2e/cookie-consent.spec.ts`

- [ ] **10.1 Criar `tests/e2e/cookie-consent.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

const CHOICE_KEY = 'anhanga_cookie_consent';

test.describe('Cookie Consent Banner (CMP)', () => {

  test.beforeEach(async ({ page }) => {
    // Garantir estado limpo: sem localStorage de consentimento
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), CHOICE_KEY);
  });

  // --- Visibilidade ---

  test('banner aparece na primeira visita', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();
  });

  test('banner tem botões "Aceitar" e "Recusar" com peso visual idêntico', async ({ page }) => {
    await page.goto('/');
    const accept = page.getByRole('button', { name: 'Aceitar' });
    const decline = page.getByRole('button', { name: 'Recusar' });

    await expect(accept).toBeVisible();
    await expect(decline).toBeVisible();

    // Ambos devem ter a mesma classe de border (sem cor primária exclusiva em um deles)
    const acceptClass = await accept.getAttribute('class') ?? '';
    const declineClass = await decline.getAttribute('class') ?? '';
    expect(acceptClass).toEqual(declineClass);
  });

  // --- Aceitar ---

  test('clicar "Aceitar" fecha o banner e salva "marketing" no localStorage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();

    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('marketing');
  });

  test('após aceitar, recarregar não mostra o banner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  test('após aceitar, metadados são gravados com timestamp e version', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    const meta = await page.evaluate(() => {
      const raw = localStorage.getItem('anhanga_cookie_consent_meta');
      return raw ? JSON.parse(raw) : null;
    });
    expect(meta).not.toBeNull();
    expect(meta.version).toBe('1');
    expect(meta.choice).toBe('marketing');
    expect(() => new Date(meta.timestamp)).not.toThrow();
  });

  // --- Recusar ---

  test('clicar "Recusar" fecha o banner e salva "essential" no localStorage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();

    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('essential');
  });

  test('após recusar, recarregar não mostra o banner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  test('recusar não bloqueia GTM/analytics (legítimo interesse)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();

    const hasDataLayer = await page.evaluate(() => Array.isArray(window.dataLayer));
    expect(hasDataLayer).toBe(true);
  });

  test('recusar impede carregamento do Mautic', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();

    // Aguardar possíveis triggers de scroll/idle
    await page.waitForTimeout(500);
    const hasMautic = await page.evaluate(() => typeof window.MauticTrackingObject !== 'undefined');
    expect(hasMautic).toBe(false);
  });

  // --- Link de Política de Privacidade ---

  test('link "Política de Privacidade" aponta para /politica-privacidade#cookies', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('dialog').getByRole('link');
    const href = await link.getAttribute('href');
    expect(href).toBe('/politica-privacidade#cookies');
  });

  // --- Gerenciar cookies (revogação) ---

  test('"Gerenciar cookies" na footer reabre o banner sem limpar localStorage', async ({ page }) => {
    // Aceitar primeiro
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // Clicar em Gerenciar cookies
    await page.getByRole('button', { name: 'Gerenciar cookies' }).click();

    // Banner deve reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();

    // localStorage ainda tem 'marketing' (não foi limpo)
    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('marketing');
  });

  test('revogação: aceitar → gerenciar → recusar dispara reload e bloqueia Mautic', async ({ page }) => {
    // Aceitar
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // Clicar em Gerenciar cookies
    await page.getByRole('button', { name: 'Gerenciar cookies' }).click();

    // Aguardar banner reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();

    // Revogar — aguarda o reload que o listener dispara
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: 'Recusar' }).click(),
    ]);

    // Após o reload, localStorage deve ser 'essential'
    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('essential');

    // Mautic não deve ter carregado
    const hasMautic = await page.evaluate(() => typeof window.MauticTrackingObject !== 'undefined');
    expect(hasMautic).toBe(false);

    // Banner não deve reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  // --- Aceitar com Mautic ---

  test('aceitar carrega Mautic', async ({ page }) => {
    // Interceptar o script do Mautic para confirmar que foi solicitado
    let mauticRequested = false;
    await page.route('**/mtc.js', async (route) => {
      mauticRequested = true;
      await route.fulfill({ status: 200, body: 'window.MauticTrackingObject="mt";' });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // Dar tempo para scripts lazy carregarem
    await page.waitForTimeout(300);

    expect(mauticRequested).toBe(true);
  });
});
```

- [ ] **10.2 Iniciar o dev server e rodar os testes E2E**

```bash
# Terminal 1
pnpm dev

# Terminal 2
pnpm test:e2e tests/e2e/cookie-consent.spec.ts
```

Esperado: todos os testes passam. Se algum falhar por timing, ajustar `waitForTimeout` pontualmente.

---

### Task 11: Atualizar `docs/ripd-legitimo-interesse.md`

**Files:**
- Modify: `docs/ripd-legitimo-interesse.md`

- [ ] **11.1 Atualizar §3.5 — tabela de riscos da Atividade 2**

Localizar a linha da tabela:
```markdown
| Coleta de click IDs antes do consentimento (client-side) | Alta (antes da issue #782) | Médio | Condicionar `initializeTracking()` ao consentimento via banner; repasse de conversões já é server-side via Stape |
```

Substituir por:
```markdown
| Coleta de click IDs antes do consentimento (client-side) | Baixa (pós issue #782) | Baixo | `initializeTracking()` opera sob legítimo interesse (RIPD Atividade 2); repasse de conversões é integralmente server-side via Stape sGTM, sem cookie de terceiros no browser; titular pode exercer direito de oposição via `privacidade@anhanga.tur.br` |
```

- [ ] **11.2 Atualizar §3.6 — salvaguardas pendentes da Atividade 2**

Localizar:
```markdown
- [ ] **Pendente (issue #782):** bloquear `initializeTracking()` antes do consentimento do usuário
```

Substituir por:
```markdown
- [x] **Implementado (issue #782):** `initializeTracking()` opera sob legítimo interesse; banner de cookies bloqueia Mautic e HubSpot; direito de oposição ao tratamento por interesse legítimo disponível via `privacidade@anhanga.tur.br` e documentado em `/politica-privacidade#cookies`
```

- [ ] **11.3 Atualizar o histórico de versões no final do RIPD**

Adicionar linha na tabela de versões:
```markdown
| 1.2 | 2026-06-03 | Revisão pós issue #782: atualização de §3.5 e §3.6 da Atividade 2; `initializeTracking()` mantido sob legítimo interesse; canal de oposição documentado |
```

- [ ] **11.4 Rodar todos os testes de regressão para garantir que nada quebrou**

```bash
pnpm test:regression
```

Esperado: zero falhas.

- [ ] **11.5 Commit final**

```bash
git add tests/e2e/cookie-consent.spec.ts docs/ripd-legitimo-interesse.md
git commit -m "feat(cmp): add E2E tests and update RIPD v1.2 (issue #782)"
```

---

## Checklist final de QA manual

Antes de abrir o PR, verificar manualmente no browser (`pnpm dev`):

- [ ] Banner aparece na homepage em aba anônima (sem localStorage)
- [ ] Botões "Aceitar" e "Recusar" têm aparência visual idêntica
- [ ] Clicar "Aceitar" → banner some → recarregar → banner não reaparece
- [ ] Clicar "Recusar" → banner some → recarregar → banner não reaparece
- [ ] "Gerenciar cookies" na footer → banner reaparece
- [ ] "Gerenciar cookies" → "Recusar" → página recarrega → Mautic não carrega (verificar DevTools → Network)
- [ ] Banner aparece também em `/beto-carrero`, `/lollapalooza`, `/corporativo`
- [ ] Link "Política de Privacidade" no banner leva para `/politica-privacidade#cookies`
- [ ] Console sem erros de JS
