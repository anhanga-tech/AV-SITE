# Migração de tags: Stape (sGTM) → Cloudflare Zaraz

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o Stape (server-side GTM, desativado em 31/08/2026 por exceder o limite do plano gratuito) pelo Cloudflare Zaraz para GA4, Meta Conversions API e TikTok Events API — **CAPI-only**, sem pixel client-side Meta/TikTok — preservando o gate de consentimento LGPD que a arquitetura híbrida de jul/2026 (issue #1261) estabeleceu.

**Architecture:** Habilitar Zaraz na zone `anhanga.tur.br`. Ativar o **Data Layer Compatibility Mode** do Zaraz para reaproveitar os ~16 pontos de `window.dataLayer.push()` já existentes no código sem reescrevê-los — o Zaraz traduz `dataLayer.push({event, ...campos})` para `zaraz.track(event, campos)` automaticamente. Configurar os três Managed Components nativos verificados no spike de 2026-09-01 (código-fonte lido diretamente em `github.com/managed-components/*`, não só a doc prosa):

- **GA4**: precisa de `hideOriginalIP: true` explícito nas settings do tool — o componente manda o IP real do usuário por padrão (`_uip: client.ip`), o que reverte a salvaguarda "IP stripping via sGTM Stape" declarada no RIPD v1.1.
- **Meta (`Facebook Pixel` tool)**: confirmado como **server-only** — chama `graph.facebook.com/.../events` direto do edge, sem injetar `fbq`/`connect.facebook.net` no navegador. Faz hashing SHA-256 automático de `em/ph/fn/ln/db/ge/ct/st/zp` e aceita `event_id` externo pra dedup (não relevante aqui já que não há pixel de navegador pra deduplicar contra).
- **TikTok tool**: mesmo padrão — server-only, `business-api.tiktok.com/.../event/track/`, hash SHA-256 de email/phone/external_id.

Consent Management do Zaraz é **por purposes**, mas o default é **fail-OPEN**: um tool sem purpose atribuída dispara sem nenhum gate (o oposto do Consent Mode v2 atual, que é fail-closed). Toda tag de marketing (Meta, TikTok) precisa de purpose explícita, e isso precisa de teste automatizado que impeça regressão silenciosa.

`lib/conversions/{google,meta}.ts` e `api/purchase-dispatch.ts` (conversões offline Odoo → Ads/Meta, disparadas pelo pipeline n8n/Odoo, não pelo navegador) **não fazem parte desta migração** — nunca passaram pelo Stape/GTM.

**Tech Stack:** Cloudflare Zaraz (dashboard + Managed Components nativos), TypeScript `node:test`, Playwright, Google Analytics 4, Meta Conversions API, TikTok Events API.

## Global Constraints

- Rollout em paralelo — o Stape/GTM continuam ativos em produção até o Zaraz estar validado; nunca remover os dois ao mesmo tempo sem uma janela de comparação.
- `lib/conversions/{google,meta}.ts` e `api/purchase-dispatch.ts` ficam fora de escopo — não tocar.
- Nenhum access token (Meta, TikTok, GA4 API secret) pode entrar no Git, no chat, em screenshots ou em comentários de issue/PR. O usuário digita os tokens direto no dashboard Zaraz; o agente não seleciona, copia nem lê esses valores.
- **CAPI-only confirmado com o usuário (2026-09-01)**: não recriar pixel client-side Meta/TikTok via tool "Custom HTML". Se isso mudar depois, é uma decisão nova, não um ajuste deste plano.
- `hideOriginalIP: true` é obrigatório na tool GA4 — sem isso, o corte introduz uma regressão de LGPD que hoje não existe (RIPD v1.1, salvaguarda de IP stripping).
- Toda tag de marketing (Meta, TikTok) precisa de purpose de consentimento explícita no Zaraz antes de qualquer publicação — auditar isso é um passo obrigatório, não op­cional, dado o default fail-open.
- Google Ads Customer Match (RIPD Atividade 4) já depende de segmento Mautic, que foi removido do código em 01/09/2026 (PR #1564) — esse fluxo já está órfão **independente** desta migração. Fora de escopo aqui; registrar como achado separado (issue própria), não misturar com o corte do Stape.
- Antes de qualquer evento real de teste, disparar um evento sintético primeiro. Lead real exige confirmação explícita do usuário porque cria registro no Odoo.
- Rollback: se qualquer critério de validação falhar, manter Stape ativo e não prosseguir para o corte (Task 7).
- **Achado da Task 1 (01/09/2026):** o **Google Tag Gateway** (produto separado do Zaraz — proxy first-party do `gtag.js`/GTM real, roda no navegador) estava **ativo** na zone `anhanga.tur.br`, configurado pro mesmo container `GTM-T2KGS86G` que o Stape carrega. Config antiga, não fazia parte de nenhum plano documentado. Causava rejeição do cookie `_ga_QDBT5PM4KP` por domínio inválido (lógica de cálculo de domínio do próprio Google, não do Zaraz) e potencialmente hits duplicados no GA4 (Tag Gateway + Stape rodando em paralelo, sem ninguém ter decidido isso). Desligado em 01/09/2026 com autorização do usuário. Se o volume de eventos no GA4 mudar visivelmente na Task 6 (paralelo), essa desativação é a causa mais provável — não um problema do Zaraz.

---

## File and Configuration Map

| Superfície | Responsabilidade |
|---|---|
| Zaraz dashboard (zone `anhanga.tur.br`) | Managed Components (GA4, Meta, TikTok), Consent Management (purposes), Data Layer Compatibility Mode |
| `index.html` | Ponte de consentimento (`addAnhangaConsentListener`) ganha um segundo assinante que chama a Consent API do Zaraz; loader do Stape (`load.sst.anhanga.tur.br`) removido só na Task 7 |
| `utils/generate-lead-analytics.ts`, `hooks/useLeadCapture.ts`, `hooks/useContactForm.ts`, `hooks/useQuizCapture.ts`, `hooks/useWaitlistCapture.ts`, `utils/whatsapp.ts`, `utils/formAnalytics.ts`, `utils/linksTracking.ts`, `utils/aiResearchTracking.ts`, `lib/cal-embed.ts`, `pages/landings/CorporativoLanding.tsx` | Os ~16 pontos de `window.dataLayer.push()` que o Data Layer Compatibility Mode precisa consumir sem reescrita — auditar payloads aninhados antes de confiar neles |
| `tests/index-third-party-scripts.test.ts` | Contrato estático: Stape presente durante o paralelo, ausente após o corte |
| `tests/e2e/cookie-consent.spec.ts` | Contrato comportamental do gate de consentimento (Zaraz) |
| `docs/compliance/ripd-legitimo-interesse.md` | Trocar Stape OÜ por Cloudflare como operador de tag-management; nova versão |
| GitHub issue (a criar) | Evidências, janela de comparação, decisão de corte |

---

### Task 1: Habilitar Zaraz e validar o Data Layer Compatibility Mode

**Files:**
- Configure: Zaraz dashboard, zone `anhanga.tur.br`
- Verify: os 16 call sites de `window.dataLayer.push()` listados no mapa acima

**Interfaces:**
- Consumes: `window.dataLayer.push({event, ...campos})` já existente.
- Produces: eventos Zaraz equivalentes via tradução automática (`zaraz.track(event, campos)`).

- [x] **Step 1: Habilitar Zaraz na zone sem nenhum tool configurado** (já estava ativo antes deste plano)

Em **Zaraz → Settings**, habilitar o produto na zone. Nenhum Managed Component configurado ainda — esse passo só liga o coletor de eventos no edge.

Expected: Zaraz aparece como ativo no dashboard; nenhum tráfego de terceiros muda ainda (nenhum tool configurado = nenhuma tag disparando).

- [x] **Step 2: Auditar os 16 payloads de `dataLayer.push` por objetos aninhados** (concluído 01/09/2026)

O Data Layer Compatibility Mode extrai a chave `event` como nome do evento Zaraz e passa o resto como `eventProperties` — mas valores aninhados (ex.: `{ consent: { facebook: true } }`) ficam inacessíveis nesse modo. Rodar:

```bash
rg -n "dataLayer\.push\(" utils/ hooks/ lib/ pages/ -A 8
```

Para cada call site, confirmar que o objeto passado é **plano** (sem objetos aninhados como valor de uma chave) e que sempre inclui a chave `event`. Casos suspeitos a checar com atenção: `utils/formAnalytics.ts:100` (`dataLayer.push(safePayload(input))` — payload dinâmico, confirmar que `safePayload` nunca aninha) e `lib/cal-embed.ts:70,76`.

Expected: lista de call sites com payload plano confirmado, ou lista de exceções que precisarão de `zaraz.track()` explícito em vez de depender do compat mode. Resultado: todos os 16 são planos, todos têm `event` — nenhuma exceção.

- [x] **Step 3: Habilitar o Data Layer Compatibility Mode** (concluído 01/09/2026)

Achado: a rota `Zaraz → Settings` da doc oficial está desatualizada — o painel real fica em **Web tag management → Tag setup → Settings** (dashboard migrou de zone-level pra "Tag Management" em fev/2025). Junto com o compat mode, também ligado o **Single Page Application support** (necessário — o site é SPA via React Router, sem isso só o load inicial contaria como pageview).

- [x] **Step 4: Validar tradução em ambiente de teste** (concluído 01/09/2026)

```js
window.dataLayer.push({ event: 'zaraz_spike_test', foo: 'bar' });
```

Confirmado ao vivo: request `POST /cdn-cgi/zaraz/t` (200) disparada a cada `dataLayer.push`. Tradução funcionando.

---

### Task 2: Configurar o tool GA4 com IP stripping

**Files:**
- Configure: Zaraz dashboard → Tools → Google Analytics 4

**Interfaces:**
- Consumes: eventos `page_view` automáticos do Zaraz + eventos custom via compat mode.
- Produces: hits no GA4 Measurement Protocol sem o IP real do usuário.

- [ ] **Step 1: Adicionar o tool GA4**

Measurement ID e API secret: o usuário digita direto no dashboard (não copiar/colar via agente). Confirmar o nome exato dos campos na tela — o spike não teve acesso ao dashboard ao vivo, só ao código-fonte do component.

Concluído 01/09/2026 — Measurement ID `G-QDBT5PM4KP`. Campos reais na tela: "Hide Originating IP Address" (Privacy) e "Google Analytics Audiences" (Advanced) — deixado desligado por decisão consciente (ver Step 2). Também habilitadas "Track all pageviews" e "Track all other events" (necessárias pro compat mode alimentar a tool); "Track all ecommerce events" deixado desligado (site não tem ecommerce).

- [x] **Step 2: Setar `hideOriginalIP: true`** (concluído 01/09/2026)

Nas settings do tool (não no payload por evento), setar a flag equivalente a `hideOriginalIP`. Esse é o item não-negociável do plano — sem ele, o GA4 recebe `_uip` com o IP real do visitante. Campo real na tela: **"Hide Originating IP Address"**, texto de confirmação: "This will prevent sending the visitor IP address to Google Analytics 4".

- [x] **Step 3: Validar no GA4** (concluído 01/09/2026 — via Realtime, não DebugView)

Disparado evento sintético (`zaraz_ga4_debugview_test_3`) com `zaraz.debug()` ativo. `GA4 → Admin → DebugView` não mostrou nenhum debug device — a "Debug key" do Zaraz é provavelmente um log interno dele, não repassa `debug_mode` ao Measurement Protocol. **`GA4 → Relatórios → Tempo real` mostrou o tráfego do Zaraz normalmente** — confirma que o pipeline navegador → Zaraz → GA4 entrega de ponta a ponta, que é o que este step precisava provar.

Not verified (limitação conhecida, não bloqueante): não há como confirmar visualmente pelo GA4 que `hideOriginalIP` está de fato suprimindo o IP — o Google não expõe IP bruto em relatório nenhum, por design. A validação desse ponto se apoia na config do tool + no código-fonte lido no spike (`_uip` condicional a `hideOriginalIP`), não em prova visual.

---

### Task 3: Consent Management — purposes e ponte com o banner atual

**Files:**
- Configure: Zaraz dashboard → Consent Management
- Modify: `index.html` (bridge de consentimento)
- Modify: `tests/index-third-party-scripts.test.ts`, `tests/e2e/cookie-consent.spec.ts`

**Interfaces:**
- Consumes: `window.addAnhangaConsentListener`, eventos DOM `anhanga:marketing-consent` / `anhanga:revoke-consent` (já existentes, ver `[[mautic-hubspot-removal]]` para o estado atual do arquivo).
- Produces: `zaraz.consent.set()` chamado com o mesmo estado que hoje alimenta `updateConsentState` do GTM.

- [x] **Step 1: Criar as purposes no dashboard** (concluído 01/09/2026 — revisado do original)

**Correção ao texto original deste step:** só a purpose `marketing` foi criada (Meta + TikTok, Tasks 4/5). O GA4 **não** ganhou purpose — hoje ele dispara mesmo com "Recusar" (legítimo interesse, ver teste `recusar não bloqueia GTM/analytics`); no Zaraz, tool sem purpose dispara sem gate (fail-open), que é exatamente esse comportamento. Dar ao GA4 uma purpose "analytics" restringiria a coleta em relação a hoje — não era o objetivo.

- [x] **Step 2: Adicionar o segundo assinante da ponte de consentimento em `index.html`** (concluído 01/09/2026)

API confirmada (lida em `github.com/imviidx/fake-cloudflare-zaraz-consent`, mock que espelha a API real — a doc oficial da Cloudflare não documenta a assinatura): `window.zaraz.consent.set({ purposeId: boolean, ... })`, aceita objeto com múltiplas purposes. Implementado com guarda defensiva (`if (window.zaraz && window.zaraz.consent)`) já que o script do Zaraz carrega assíncrono e pode não estar pronto no momento do clique.

`updateConsentState`/`gtag` não existiam mais no `index.html` atual (o arquivo já tinha evoluído desde o plano de jul/2026) — não havia nada a manter em paralelo além do `dataLayer.push` existente.

- [x] **Step 3: Teste estático — Zaraz consent API chamada nos dois listeners** (concluído 01/09/2026)

Adicionado em `tests/index-third-party-scripts.test.ts` (assinatura + ordem: Zaraz antes de `notifyConsentListeners`) e em `tests/e2e/cookie-consent.spec.ts` (stub de `window.zaraz.consent.set` via `addInitScript`, já que `window.zaraz` só existe em produção — não roda no dev server do Playwright). **Não executado** neste sandbox (sem Node) — revisão manual só.

- [ ] **Step 4: Teste — nenhum tool de marketing sem purpose**

Não há como testar isso via `node:test` contra o dashboard Zaraz diretamente. Documentar como checklist manual neste plano (Step 1 acima) e, se o Zaraz expuser a config via API (ver `zaraz/reference` na doc oficial), avaliar um script de auditoria (`scripts/`) que roda contra a config exportada antes de cada publicação — decisão a tomar quando a Task 4/5 estiverem configuradas e houver uma config real pra inspecionar.

---

### Task 4: Configurar o tool Meta (Conversions API, CAPI-only)

**Files:**
- Configure: Zaraz dashboard → Tools → Facebook Pixel
- Verify: `utils/generate-lead-analytics.ts:11-30` (`pushGenerateLeadConversionEvent`, fonte do evento `generate_lead` com `event_id`)

**Interfaces:**
- Consumes: evento `generate_lead` (via compat mode) com `event_id`, `destination`, UTMs.
- Produces: chamada server-side a `graph.facebook.com/.../events` com `em/ph/fn/ln` hasheados quando disponíveis.

- [ ] **Step 1: Adicionar o tool "Facebook Pixel"**

Pixel ID e access token: usuário digita direto no dashboard. Gate: purpose `marketing` (Task 3).

- [ ] **Step 2: Mapear `generate_lead` pro standard event `Lead`**

Confirmar no dashboard como o tool mapeia nomes de evento custom pra standard events do Meta (`Lead`). Se não houver mapeamento automático, pode ser necessário ajustar o nome do evento na origem (`utils/generate-lead-analytics.ts`) ou usar uma configuração do tool — decidir com base no que o dashboard expõe, não assumir.

- [ ] **Step 3: Confirmar quais campos de PII o evento `generate_lead` hoje carrega**

`pushGenerateLeadConversionEvent` não envia `email`/`phone`/`nome` hoje — só `destination`, UTMs e `ga_client_id`/`ga_session_id`. Isso significa **sem PII pro Advanced Matching hoje**, então o hashing SHA-256 do tool não tem o que hashear neste evento específico. Documentar essa lacuna: se o objetivo é paridade de match quality com a Meta CAPI tag do GTM server (que usava outro pipeline de dados — ver Task 5 do plano `2026-07-23-sgtm-hybrid-consent.md`, que também não adicionava email/telefone manualmente na primeira fase), então CAPI-only aqui já reflete o que existia antes. Não expandir o payload nesta migração — é fora de escopo (mudaria o que é coletado, não só onde é enviado).

- [ ] **Step 4: Validar payload no Zaraz Preview/Debug**

Disparar um `generate_lead` sintético (mesmo padrão do plano anterior: `event_id` claramente marcado como teste) e confirmar no Meta Events Manager (Test Events, com Test Event Code temporário) que o evento `Lead` chega server-side.

Expected: evento visível no Events Manager, sem PII inesperada, sem token exposto em nenhum log/print.

---

### Task 5: Configurar o tool TikTok (Events API)

**Files:**
- Configure: Zaraz dashboard → Tools → TikTok

**Interfaces:**
- Consumes: mesmo evento `generate_lead`.
- Produces: chamada server-side a `business-api.tiktok.com/.../event/track/`.

- [ ] **Step 1: Adicionar o tool TikTok**

Pixel Code e access token: usuário digita direto. Gate: purpose `marketing`.

- [ ] **Step 2: Mapear `generate_lead` pro standard event equivalente**

Mesma ressalva da Task 4 — confirmar mapeamento no dashboard, e que não há PII adicional sendo enviada além do que já existe hoje.

- [ ] **Step 3: Validar payload no TikTok Events Manager**

Mesmo processo da Task 4 Step 4, usando o Test Event Code do TikTok.

---

### Task 6: Rodar em paralelo com o Stape e comparar

**Files:**
- Observe: GA4, Meta Events Manager, TikTok Events Manager (Zaraz vs. Stape)
- Browser routes: `/`, `/blog/agencia-de-viagens-confiavel-cadastur/`, `/beto-carrero/`

**Interfaces:**
- Consumes: Tasks 1–5 configuradas e publicadas (Zaraz), Stape ainda ativo (não removido).
- Produces: evidência de paridade antes do corte.

- [ ] **Step 1: Confirmar que Stape e Zaraz disparam simultaneamente**

Ambos os sistemas devem estar ativos ao mesmo tempo nesta fase — Stape não foi removido do `index.html` ainda. Confirmar no Network que os dois conjuntos de requests aparecem (`sst.anhanga.tur.br` e os endpoints Zaraz).

- [ ] **Step 2: Testar os três estados de consentimento nas três rotas**

Repetir o roteiro do plano anterior (Task 7 de `2026-07-23-sgtm-hybrid-consent.md`): sem escolha, recusa, aceite. Confirmar que o gate de purposes do Zaraz bloqueia Meta/TikTok exatamente como o Consent Mode do GTM bloqueia hoje.

- [ ] **Step 3: Monitorar por 3–7 dias**

Comparar volume de eventos GA4/Meta Lead/TikTok Lead entre os dois pipelines (Stape vs. Zaraz) na mesma janela. Esperado: contagens próximas (não idênticas — bloqueadores de anúncio no navegador afetam pixels de formas diferentes de chamadas server-side, mas aqui ambos os caminhos de Meta/TikTok já são server-side em ambos os sistemas, então a paridade esperada é alta).

- [ ] **Step 4: Decidir go/no-go pro corte**

Critério de sucesso: contagens de evento em paridade razoável, nenhum vazamento de IP real no GA4 (Task 2), nenhum tool de marketing disparando sem consentimento (Task 3). Se algum critério falhar, não prosseguir pra Task 7 — manter os dois sistemas em paralelo e investigar.

---

### Task 7: Corte — desativar o Stape

**Files:**
- Modify: `index.html` (remover `loadGtm`/loader do Stape)
- Modify: `tests/index-third-party-scripts.test.ts` (testes que hoje esperam `load.sst.anhanga.tur.br`/`sst.anhanga.tur.br` presentes)
- Modify: `docs/compliance/ripd-legitimo-interesse.md` (nova versão — Cloudflare Zaraz substitui Stape OÜ como operador)
- Modify: `docs/performance-third-party-scripts.md`, `README.md`, `.claude/CLAUDE.md`, `.env.example` (referências a Stape/sGTM)

**Interfaces:**
- Consumes: decisão go do Task 6.
- Produces: `index.html` sem nenhuma dependência do Stape.

- [ ] **Step 1: Remover o loader do Stape de `index.html`**

Seguir o mesmo padrão usado pra remover o loader do Mautic (ver `[[mautic-hubspot-removal]]`): remover `loadGtm`, a variável `gtmLoaded` e a chamada em `loadAnalytics`. Confirmar se algum outro ponto do arquivo referencia `sst.anhanga.tur.br`/`load.sst.anhanga.tur.br` (dns-prefetch no `<head>`) e remover também.

- [ ] **Step 2: Atualizar os testes estáticos**

`tests/index-third-party-scripts.test.ts` tem testes que hoje **exigem** presença de `load.sst.anhanga.tur.br`/`sst.anhanga.tur.br` (dns-prefetch, ausência de preconnect ocioso). Inverter essas asserções ou removê-las, e adicionar um teste `doesNotMatch` equivalente ao que foi feito pro Mautic/HubSpot.

- [ ] **Step 3: Rodar a suíte completa**

```bash
pnpm test:regression
pnpm exec playwright test tests/e2e/cookie-consent.spec.ts
pnpm typecheck
pnpm lint:changed
pnpm run build
```

Expected: todos os comandos com exit code 0.

- [ ] **Step 4: Atualizar RIPD, docs e desativar/cancelar o Stape**

Nova versão do RIPD trocando Stape OÜ por Cloudflare como operador de tag-management (mesmo padrão da v1.8 que removeu HubSpot/Mautic). Atualizar `docs/performance-third-party-scripts.md`, `README.md`, `.claude/CLAUDE.md`, `.env.example` onde mencionam Stape/sGTM. Cancelar/desativar a conta Stape só depois do deploy confirmado em produção.

- [ ] **Step 5: Monitorar por 3–7 dias pós-corte**

Mesmo checklist da Task 6 Step 3, agora sem o Stape como comparação — confirmar que os números do Zaraz sozinho continuam estáveis (sem o paralelo, não há mais baseline simultânea).

---

## Execution References

- [Cloudflare Zaraz docs](https://developers.cloudflare.com/zaraz/)
- [Zaraz Consent Management](https://developers.cloudflare.com/zaraz/consent-management/)
- [Zaraz Data Layer Compatibility Mode](https://developers.cloudflare.com/zaraz/advanced/datalayer-compatibility/)
- [Zaraz Custom Managed Components](https://developers.cloudflare.com/zaraz/advanced/load-custom-managed-component/)
- [`managed-components/facebook-pixel` (fonte lida no spike de 2026-09-01)](https://github.com/managed-components/facebook-pixel)
- [`managed-components/tiktok` (fonte lida no spike de 2026-09-01)](https://github.com/managed-components/tiktok)
- [`managed-components/google-analytics-4` (fonte lida no spike de 2026-09-01)](https://github.com/managed-components/google-analytics-4)
- Plano anterior de referência (arquitetura de consentimento que este plano precisa igualar): `docs/superpowers/plans/2026-07-23-sgtm-hybrid-consent.md`
