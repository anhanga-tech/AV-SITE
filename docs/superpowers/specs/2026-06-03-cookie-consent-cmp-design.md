# Design: Banner de Consentimento de Cookies (CMP)

**Data:** 2026-06-03
**Issue:** [#782](https://github.com/felipewilliam2/AV-SITE/issues/782)
**Status:** Aprovado — aguardando implementação
**Base legal:** LGPD Art. 7º, I (consentimento — marketing) e Art. 7º, IX (legítimo interesse — analytics/UTM)
**Referência regulatória:** Resolução CD/ANPD nº 15/2024; RIPD v1.1 (`docs/ripd-legitimo-interesse.md`)

---

## 1. Contexto e problema

O site não possui mecanismo de consentimento prévio para cookies de marketing, em violação do Art. 7º, I da LGPD. Três scripts de terceiros carregam sem opt-in do titular:

- **Mautic** (`mkt.anhanga.tur.br/mtc.js`) — automação de marketing comportamental
- **HubSpot tracking passivo** (`js.hs-scripts.com/50895604.js`) — rastreamento passivo de visitantes
- **Tags de remarketing via GTM** — publicidade direcionada

GA4 (via sGTM Stape) e o rastreamento UTM/click IDs (`initializeTracking()`) são classificados como **legítimo interesse** no RIPD v1.1 e não requerem opt-in, mas o titular tem direito de oposição.

---

## 2. Decisões de design

| Decisão | Escolha | Justificativa |
|---|---|---|
| `initializeTracking()` | Não alterar | Legítimo interesse (RIPD Atividade 2) — não precisa de gate de consentimento |
| Consent Mode v2 | Integrar | Preserva dados modelados do GA4 antes do aceite; `analytics_storage: 'granted'` por padrão |
| Granularidade do banner | 2 botões (sem "Personalizar") | Apenas 1 categoria requer consentimento; granularidade desnecessária |
| Labels dos botões | "Aceitar" / "Recusar" | Evitar a palavra "marketing" nos botões para reduzir aversão; informação está no texto do banner |
| Peso visual dos botões | Idêntico | Resolução ANPD 15/2024 proíbe dark patterns (botão de aceite destacado) |
| Persistência | `localStorage` chave `anhanga_cookie_consent` | Padrão do projeto; sem cookie para persistir consentimento |
| Revogação | Link "Gerenciar cookies" na footer | Art. 8º, §5º — revogação gratuita e facilitada a qualquer momento |

---

## 3. Arquitetura

### 3.1 Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `lib/consent.ts` | Lógica pura: ler/escrever localStorage, disparar `anhanga:marketing-consent`. Sem React, sem efeitos no import. |
| `components/CookieConsentBanner.tsx` | UI do banner. Monta em `AppLayout`. Renderiza `null` se consentimento já registrado. |
| `tests/consent.test.ts` | Testes unitários de `lib/consent.ts` via `node:test`. |
| `tests/e2e/cookie-consent.spec.ts` | Playwright: primeira visita, persistência, revogação, carga condicional de Mautic/HubSpot. |

### 3.2 Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `index.html` | `gtag('consent', 'default', {...})` antes do GTM. Verificação de localStorage no topo do script inline. `loadMautic`/`loadHubspot` com gate de consentimento. Listener `anhanga:marketing-consent`. |
| `App.tsx` | `<CookieConsentBanner />` dentro de `AppLayout`, fora das rotas (aparece em todas as páginas). |
| `components/Footer.tsx` | Link "Gerenciar cookies" que chama `resetConsent()` e força re-mount do banner. |

---

## 4. API de `lib/consent.ts`

```typescript
type ConsentChoice = 'marketing' | 'essential';

// Lê a escolha do localStorage. Retorna null se ausente ou valor inválido.
export function getConsent(): ConsentChoice | null

// Persiste a escolha. Se 'marketing', dispara window.dispatchEvent('anhanga:marketing-consent').
export function setConsent(choice: ConsentChoice): void

// Remove a chave do localStorage (para revogação via "Gerenciar cookies").
export function resetConsent(): void
```

Todas as funções degradam silenciosamente se `localStorage` não estiver disponível (modo privado, storage cheio).

---

## 5. Fluxo de dados

### Primeira visita

```
index.html carrega
  → gtag('consent', 'default', {
        analytics_storage: 'granted',   ← legítimo interesse
        ad_storage: 'denied',
        ad_personalization: 'denied',
        ad_user_data: 'denied'
      })
  → GTM carrega
  → loadMautic() / loadHubspot() verificam localStorage → ausente → no-op
  → initializeTracking() roda normalmente (legítimo interesse)

React monta → CookieConsentBanner lê localStorage → null → exibe banner

Usuário clica "Aceitar"
  → setConsent('marketing')
  → localStorage ← 'marketing'
  → dispatchEvent('anhanga:marketing-consent')
  → index.html listener → loadMautic() + loadHubspot()
  → gtag('consent', 'update', { ad_storage: 'granted', ad_personalization: 'granted', ad_user_data: 'granted' })
  → banner some

Usuário clica "Recusar"
  → setConsent('essential')
  → localStorage ← 'essential'
  → nenhum evento disparado
  → Mautic e HubSpot nunca carregam
  → banner some
```

### Visita de retorno — aceitou marketing

```
index.html carrega
  → lê localStorage → 'marketing'
  → gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'granted', ... })
  → loadMautic() / loadHubspot() passam no gate → carregam nos triggers normais

React monta → CookieConsentBanner → 'marketing' → renderiza null
```

### Visita de retorno — recusou

```
index.html carrega
  → lê localStorage → 'essential'
  → gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ... })
  → loadMautic() / loadHubspot() → 'essential' → no-op

React monta → CookieConsentBanner → 'essential' → renderiza null
```

---

## 6. Design do componente `CookieConsentBanner`

- **Posição:** `fixed bottom-0 left-0 right-0` — aparece sobre o conteúdo sem bloquear scroll
- **Renderização:** `null` se `getConsent() !== null`; estado `visible` controlado por `useEffect` no mount
- **Texto obrigatório (LGPD transparência):**
  > *"Usamos cookies de marketing (Mautic e HubSpot) para comunicações personalizadas. Analytics continua ativo por interesse legítimo. [Política de Privacidade →](/politica-privacidade#cookies)"*
- **Botões:** "Aceitar" e "Recusar" com peso visual idêntico — sem cor de destaque exclusiva em nenhum dos dois
- **Sem auto-fechamento:** o usuário deve escolher ativamente
- **`role="dialog"` `aria-modal="false"` `aria-label="Preferências de cookies"`** para acessibilidade

### Revogação (footer)

Link "Gerenciar cookies" na linha de copyright do `Footer.tsx`. Ao clicar:
1. Chama `resetConsent()`
2. Força re-render do banner via `key` prop em `AppLayout` (incrementa contador no estado de `AppLayout`)

---

## 7. Mudanças em `index.html`

### Antes do bloco GTM existente — adicionar:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  var _consentChoice = (function() {
    try { return localStorage.getItem('anhanga_cookie_consent'); } catch(e) { return null; }
  })();
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: _consentChoice === 'marketing' ? 'granted' : 'denied',
    ad_personalization: _consentChoice === 'marketing' ? 'granted' : 'denied',
    ad_user_data: _consentChoice === 'marketing' ? 'granted' : 'denied',
    wait_for_update: 2000
  });
</script>
```

### No script inline existente — adicionar no topo da IIFE:

```js
var _consentChoice = (function() {
  try { return localStorage.getItem('anhanga_cookie_consent'); } catch(e) { return null; }
})();
```

### `loadMautic` e `loadHubspot` — adicionar gate:

```js
var loadMautic = function() {
  if (_consentChoice !== 'marketing') return;  // gate LGPD
  // ... código existente
};

var loadHubspot = function() {
  if (_consentChoice !== 'marketing') return;  // gate LGPD
  // ... código existente
};
```

### Listener para aceite em tempo real (primeira visita):

```js
window.addEventListener('anhanga:marketing-consent', function() {
  _consentChoice = 'marketing';
  loadMautic();
  loadHubspot();
  if (typeof gtag === 'function') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_personalization: 'granted',
      ad_user_data: 'granted'
    });
  }
}, { once: true });
```

---

## 8. Plano de testes

### `tests/consent.test.ts` (node:test)

| Teste | Comportamento |
|---|---|
| `getConsent()` sem chave | Retorna `null` |
| `getConsent()` com `'marketing'` | Retorna `'marketing'` |
| `getConsent()` com `'essential'` | Retorna `'essential'` |
| `getConsent()` com valor inválido | Retorna `null` |
| `setConsent('marketing')` | Escreve localStorage + dispara `anhanga:marketing-consent` |
| `setConsent('essential')` | Escreve localStorage + **não** dispara evento |
| `resetConsent()` | Remove chave do localStorage |
| `getConsent()` após `resetConsent()` | Retorna `null` |
| localStorage indisponível (throw simulado) | Não lança exceção |

### `tests/e2e/cookie-consent.spec.ts` (Playwright)

| Teste | O que verifica |
|---|---|
| Primeira visita | Banner visível antes de qualquer interação |
| Peso visual dos botões | Nenhum botão tem cor primária que o outro não tenha |
| Clicar "Aceitar" | Banner some + localStorage `=== 'marketing'` |
| Clicar "Recusar" | Banner some + localStorage `=== 'essential'` |
| Recarregar após aceite | Banner não reaparece |
| Recarregar após recusa | Banner não reaparece |
| Link "Política de Privacidade" | Navega para `/politica-privacidade#cookies` |
| "Gerenciar cookies" na footer | Banner reaparece + localStorage limpo |
| Aceitar → Mautic carrega | `window.MauticTrackingObject` definido |
| Recusar → Mautic não carrega | `window.MauticTrackingObject` indefinido |

### `tests/index-third-party-scripts.test.ts` (atualizar)

Adicionar asserção: `loadMautic` e `loadHubspot` são no-ops quando localStorage está ausente ou é `'essential'`.

---

## 9. Conformidade LGPD — checklist

- [x] Base legal documentada (RIPD v1.1 + consentimento para marketing)
- [x] Consentimento livre, informado e inequívoco (Art. 8º)
- [x] Finalidade determinada — Mautic e HubSpot nomeados no banner (Art. 8º, §4º)
- [x] Revogação gratuita e facilitada — link "Gerenciar cookies" na footer (Art. 8º, §5º)
- [x] Sem dark patterns — botões com peso visual idêntico (Resolução ANPD 15/2024)
- [x] Transparência sobre legítimo interesse — mencionado no texto do banner (Art. 6º, VI)
- [x] Consent Mode v2 com `analytics_storage: 'granted'` por padrão (legítimo interesse)
- [x] Scripts bloqueados antes do aceite — gate no `index.html` antes do React montar

---

## 10. Fora do escopo

- `utils/whatsapp.ts` — `initializeTracking()` não é alterado (legítimo interesse)
- Granularidade por categoria no banner — desnecessária com uma única categoria de consentimento
- SaaS CMP externo — descartado (custo, controle, alinhamento ao design system)
