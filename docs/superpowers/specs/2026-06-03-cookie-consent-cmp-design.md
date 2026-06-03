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

GA4 (via sGTM Stape) e o rastreamento UTM/click IDs (`initializeTracking()`) são classificados como **legítimo interesse** no RIPD v1.1 e não requerem opt-in, mas o titular tem direito de oposição (Art. 18).

### Relação com o RIPD v1.1

O RIPD v1.1 lista como pendência da issue #782 "bloquear `initializeTracking()` antes do consentimento". Esta implementação **revisa essa pendência**: a decisão de produto é que analytics e UTM são tratados por legítimo interesse e não serão gatekeados pelo banner. O RIPD v1.1 deverá ser atualizado na mesma PR para:

1. Remover "bloquear `initializeTracking()`" das pendências da **Atividade 2** (único local onde o item existe — §3.6, linha do RIPD).
2. Substituir a salvaguarda "opt-out via banner de cookies" pela descrição real: **direito de oposição ao legítimo interesse exercido via `privacidade@anhanga.tur.br` ou pelo opt-out do GA4 documentado em `/politica-privacidade#cookies`**.

---

## 2. Decisões de design

| Decisão | Escolha | Justificativa |
|---|---|---|
| `initializeTracking()` | Não alterar | Legítimo interesse (RIPD Atividade 2) — sem gate de consentimento |
| Consent Mode v2 | Integrar | Preserva dados modelados do GA4; `analytics_storage: 'granted'` por padrão |
| Granularidade do banner | 2 botões (sem "Personalizar") | Apenas 1 categoria requer consentimento |
| Labels dos botões | "Aceitar" / "Recusar" | Evitar "marketing" nos botões para reduzir aversão; informação está no texto |
| Peso visual dos botões | Idêntico | Resolução ANPD 15/2024 proíbe dark patterns |
| Persistência | `localStorage` chave `anhanga_cookie_consent` (choice) + `anhanga_cookie_consent_meta` (JSON com timestamp e versão) | Chave simples para o script inline no `index.html`; metadados separados para auditabilidade (Art. 8º, §1º) |
| Revogação na sessão | `gtag('consent', 'update', {...denied})` + `window.location.reload()` | Garante que scripts já carregados sejam descarregados; cumpre Art. 8º, §5º com efeito imediato |
| Canal de revogação UI | Footer chama `triggerResetBanner()` → dispara `anhanga:reset-consent` sem tocar localStorage; banner escuta e reaparece | Preserva valor anterior para detecção de transição em `setConsent()`; evita prop-drilling |
| Footers com "Gerenciar cookies" | `Footer.tsx` (site principal) + footers de landing pages (`/beto-carrero`, `/lollapalooza`, etc.) | Revogação disponível em todas as páginas onde o banner aparece |

---

## 3. Arquitetura

### 3.1 Arquivos novos

| Arquivo | Responsabilidade |
|---|---|
| `lib/consent.ts` | Lógica pura: ler/escrever localStorage, disparar eventos. Sem React, sem efeitos no import. |
| `components/CookieConsentBanner.tsx` | UI do banner. Monta em `AppLayout`. Renderiza `null` se consentimento já registrado. |
| `tests/consent.test.ts` | Testes unitários de `lib/consent.ts` via `node:test`. |
| `tests/e2e/cookie-consent.spec.ts` | Playwright: primeira visita, persistência, revogação, carga condicional de Mautic/HubSpot. |

### 3.2 Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `index.html` | Bloco `gtag('consent', 'default', {...})` antes da IIFE de carregamento lazy. Leitura de localStorage no topo da IIFE. Gate em `loadMautic`/`loadHubspot`. Listeners `anhanga:marketing-consent` e `anhanga:revoke-consent`. |
| `App.tsx` | `<CookieConsentBanner />` adicionado em `AppLayout` ao nível de `<ClientFeatures />` (não dentro de `MainSiteShell`), para que renderize em todas as páginas incluindo landing pages. |
| `components/Footer.tsx` | Link "Gerenciar cookies" que dispara `anhanga:reset-consent`. |
| Footers de landing pages | Mesmo link "Gerenciar cookies" — todas as landings com footer próprio. |
| `docs/ripd-legitimo-interesse.md` | Atualizar pendências das Atividades 1 e 2 conforme descrito na Seção 1. |

---

## 4. API de `lib/consent.ts`

```typescript
type ConsentChoice = 'marketing' | 'essential';

// Lê a escolha do localStorage. Retorna null se ausente ou valor inválido.
export function getConsent(): ConsentChoice | null

// Persiste a escolha no localStorage.
// Grava 'anhanga_cookie_consent' = choice (string simples, lida pelo index.html).
// Grava 'anhanga_cookie_consent_meta' = JSON { choice, timestamp: ISO8601, version: '1' } (auditoria Art. 8º §1º).
// Se choice === 'marketing': dispara window.dispatchEvent(new CustomEvent('anhanga:marketing-consent')).
// Se choice === 'essential' E o valor anterior era 'marketing' (revogação):
//   dispara window.dispatchEvent(new Event('anhanga:revoke-consent')).
//   O listener no index.html faz gtag denied + window.location.reload().
// Se choice === 'essential' E o valor anterior era null (primeira escolha):
//   nenhum evento adicional — nenhum script foi carregado, sem necessidade de reload.
export function setConsent(choice: ConsentChoice): void

// Dispara apenas window.dispatchEvent(new Event('anhanga:reset-consent')).
// NÃO limpa o localStorage — mantém o valor anterior ('marketing' | 'essential')
// para que setConsent() detecte a transição corretamente quando o usuário fizer nova escolha.
// Usado pelo Footer para reabrir o banner sem perder o estado.
export function triggerResetBanner(): void
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
  → localStorage ← 'marketing' + metadados { timestamp, version }
  → dispatchEvent('anhanga:marketing-consent')
  → index.html listener → loadMautic() + loadHubspot()
  → gtag('consent', 'update', { ad_storage: 'granted', ad_personalization: 'granted', ad_user_data: 'granted' })
  → banner some

Usuário clica "Recusar"
  → setConsent('essential')
  → localStorage ← 'essential' + metadados { timestamp, version }
  → nenhum evento de marketing disparado
  → Mautic e HubSpot nunca carregam na sessão
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
  → loadMautic() / loadHubspot() → gate bloqueia → no-op

React monta → CookieConsentBanner → 'essential' → renderiza null
```

### Revogação (usuário que havia aceito clica "Gerenciar cookies")

```
Footer chama triggerResetBanner()
  → dispatchEvent('anhanga:reset-consent')
  → localStorage permanece 'marketing'  ← estado preservado para detectar transição
  → CookieConsentBanner escuta o evento → exibe banner novamente

Usuário clica "Recusar"
  → setConsent('essential')
  → lê valor anterior do localStorage → 'marketing'  ← transição detectada
  → localStorage ← 'essential' + metadados
  → dispatchEvent('anhanga:revoke-consent')
  → index.html listener → gtag('consent', 'update', { ad_storage: 'denied', ... })
  → window.location.reload()
    → no reload: localStorage = 'essential' → Mautic/HubSpot bloqueados desde o início

Usuário clica "Aceitar" (mudou de ideia)
  → setConsent('marketing')
  → valor anterior já era 'marketing' → nenhuma mudança de estado → nenhum reload
  → banner some
```

---

## 6. Design do componente `CookieConsentBanner`

- **Posição:** `fixed bottom-0 left-0 right-0` — aparece sobre o conteúdo sem bloquear scroll
- **Estado:** `visible: boolean`, iniciado como `false`; `useEffect` no mount define `true` se `getConsent() === null`; também escuta `anhanga:reset-consent` para voltar a `true`
- **Texto obrigatório (LGPD transparência):**
  > *"Usamos cookies de marketing (Mautic e HubSpot) para comunicações personalizadas. Analytics continua ativo por interesse legítimo — saiba como se opor em nossa [Política de Privacidade](/politica-privacidade#cookies)."*
- **Botões:** "Aceitar" e "Recusar" com peso visual idêntico — sem cor de destaque exclusiva em nenhum dos dois
- **Sem auto-fechamento:** o usuário deve escolher ativamente
- **`role="dialog"` `aria-modal="false"` `aria-label="Preferências de cookies"`** para acessibilidade

### Revogação (footers)

Link "Gerenciar cookies" na linha de copyright de **todos os footers** (site principal e landing pages). Ao clicar: `triggerResetBanner()` — dispara `anhanga:reset-consent` **sem limpar o localStorage**, preservando o valor anterior para que `setConsent()` detecte a transição corretamente. O banner escuta o evento e volta a exibir sem prop-drilling.

---

## 7. Mudanças em `index.html`

### Bloco a adicionar antes da IIFE de carregamento lazy de scripts:

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

### Na IIFE existente — adicionar no topo:

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

### Listener para aceite em primeira visita:

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

### Listener para revogação em sessão:

```js
window.addEventListener('anhanga:revoke-consent', function() {
  _consentChoice = 'essential';
  if (typeof gtag === 'function') {
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_personalization: 'denied',
      ad_user_data: 'denied'
    });
  }
  // Scripts já injetados no DOM não podem ser descarregados dinamicamente.
  // O reload garante estado limpo na próxima carga.
  window.location.reload();
}, { once: true });
```

> **Nota:** `setConsent('essential')` dispara `anhanga:revoke-consent` apenas quando o valor anterior no localStorage era `'marketing'` (transição de revogação). No fluxo de primeira escolha "Recusar" (valor anterior = `null`), nenhum evento de revogação é disparado e nenhum reload ocorre, pois nenhum script de marketing foi carregado.

---

## 8. Plano de testes

### `tests/consent.test.ts` (node:test)

| Teste | Comportamento |
|---|---|
| `getConsent()` sem chave | Retorna `null` |
| `getConsent()` com `'marketing'` | Retorna `'marketing'` |
| `getConsent()` com `'essential'` | Retorna `'essential'` |
| `getConsent()` com valor inválido | Retorna `null` |
| `setConsent('marketing')` | Escreve localStorage + dispara `anhanga:marketing-consent` + grava metadados com timestamp e version |
| `setConsent('essential')` quando anterior é `null` | Escreve localStorage + não dispara nenhum evento extra |
| `setConsent('essential')` quando anterior é `'marketing'` | Escreve localStorage + dispara `anhanga:revoke-consent` |
| `triggerResetBanner()` | Dispara `anhanga:reset-consent`; localStorage **não é alterado** |
| localStorage indisponível (throw simulado) | Não lança exceção |

### `tests/e2e/cookie-consent.spec.ts` (Playwright)

| Teste | O que verifica |
|---|---|
| Primeira visita | Banner visível antes de qualquer interação |
| Peso visual dos botões | Nenhum botão tem cor primária que o outro não tenha |
| Clicar "Aceitar" | Banner some + localStorage `=== 'marketing'` + metadados gravados |
| Clicar "Recusar" | Banner some + localStorage `=== 'essential'` |
| Recarregar após aceite | Banner não reaparece |
| Recarregar após recusa | Banner não reaparece |
| Recusar → analytics continua ativo | GTM ainda carregou; `window.dataLayer` existe (legítimo interesse não bloqueado) |
| Link "Política de Privacidade" | Navega para `/politica-privacidade#cookies` |
| "Gerenciar cookies" na footer | Banner reaparece + localStorage **mantém** valor anterior |
| Revogação: aceitar → gerenciar → recusar | `anhanga:revoke-consent` disparado + `window.location.reload()`; após reload Mautic não carrega |
| Aceitar → Mautic carrega | `window.MauticTrackingObject` definido |
| Recusar → Mautic não carrega | `window.MauticTrackingObject` indefinido |

### `tests/index-third-party-scripts.test.ts` (atualizar)

Adicionar asserção: `loadMautic` e `loadHubspot` são no-ops quando localStorage está ausente ou é `'essential'`.

---

## 9. Conformidade LGPD — checklist

- [x] Base legal documentada (RIPD v1.1 + consentimento para marketing)
- [x] Consentimento livre, informado e inequívoco (Art. 8º)
- [x] Finalidade determinada — Mautic e HubSpot nomeados no banner (Art. 8º, §4º)
- [x] Ônus da prova no controlador — metadados gravados com timestamp e versão (Art. 8º, §1º)
- [x] Revogação gratuita e facilitada com efeito imediato via reload (Art. 8º, §5º)
- [x] Sem dark patterns — botões com peso visual idêntico (Resolução ANPD 15/2024)
- [x] Transparência sobre legítimo interesse — mencionado no texto do banner com link de oposição (Art. 6º, VI)
- [x] Direito de oposição ao legítimo interesse — canal declarado na Política de Privacidade (`/politica-privacidade#cookies`) e via `privacidade@anhanga.tur.br` (Art. 18)
- [x] Consent Mode v2 com `analytics_storage: 'granted'` por padrão (legítimo interesse)
- [x] Scripts bloqueados antes do aceite — gate no `index.html` antes do React montar
- [x] RIPD v1.1 atualizado na mesma PR para refletir decisão sobre `initializeTracking()` e canal real de oposição

---

## 10. Fora do escopo

- `utils/whatsapp.ts` — `initializeTracking()` não é alterado (legítimo interesse)
- Granularidade por categoria no banner — desnecessária com uma única categoria de consentimento
- SaaS CMP externo — descartado (custo, controle, alinhamento ao design system)
