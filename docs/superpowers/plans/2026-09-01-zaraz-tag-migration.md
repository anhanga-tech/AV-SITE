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

- ~~Rollout em paralelo — o Stape/GTM continuam ativos em produção até o Zaraz estar validado; nunca remover os dois ao mesmo tempo sem uma janela de comparação.~~ **Superada em 01/09/2026** (achado de review, chatgpt-codex-connector[bot]): esta constraint pressupunha Stape ativo pra comparar. A própria Stape já tinha desativado o container antes deste plano existir (ver Goal) — nunca houve como cumprir literalmente. Tasks 1-5 foram validadas individualmente (Zaraz Realtime/Test Events por tool, não uma comparação de volume agregado com o Stape), Task 6 foi pulada por decisão do usuário, e a Task 7 (corte) prosseguiu sem essa janela. A evidência de "pronto pra cortar" substituta é a soma das validações individuais das Tasks 1-5, documentadas em cada uma.
- `lib/conversions/{google,meta}.ts` e `api/purchase-dispatch.ts` ficam fora de escopo — não tocar.
- Nenhum access token (Meta, TikTok, GA4 API secret) pode entrar no Git, no chat, em screenshots ou em comentários de issue/PR. O usuário digita os tokens direto no dashboard Zaraz; o agente não seleciona, copia nem lê esses valores.
- **CAPI-only confirmado com o usuário (2026-09-01)**: não recriar pixel client-side Meta/TikTok via tool "Custom HTML". Se isso mudar depois, é uma decisão nova, não um ajuste deste plano.
- `hideOriginalIP: true` é obrigatório na tool GA4 — sem isso, o corte introduz uma regressão de LGPD que hoje não existe (RIPD v1.1, salvaguarda de IP stripping).
- Toda tag de marketing (Meta, TikTok) precisa de purpose de consentimento explícita no Zaraz antes de qualquer publicação — auditar isso é um passo obrigatório, não op­cional, dado o default fail-open.
- Google Ads Customer Match (RIPD Atividade 4) já depende de segmento Mautic, que foi removido do código em 01/09/2026 (PR #1564) — esse fluxo já está órfão **independente** desta migração. Fora de escopo aqui; registrar como achado separado (issue própria), não misturar com o corte do Stape.
- Antes de qualquer evento real de teste, disparar um evento sintético primeiro. Lead real exige confirmação explícita do usuário porque cria registro no Odoo.
- Rollback (revisado 01/09/2026): a estratégia original ("manter Stape ativo") não é mais possível — a própria Stape já desativou o container em 31/08/2026 antes deste plano existir. Rollback real, se necessário, seria reverter os commits do corte (Task 7) e aceitar um período sem nenhum tag-manager até reconfigurar; não há mais um sistema paralelo vivo pra recair.
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

API confirmada (lida em `github.com/imviidx/fake-cloudflare-zaraz-consent`, mock que espelha a API real — a doc oficial da Cloudflare não documenta a assinatura): `window.zaraz.consent.set({ purposeId: boolean, ... })`, aceita objeto com múltiplas purposes.

**Atualizado (revisão de PR, fedce64):** a primeira versão (commit `dc03997`) chamava `window.zaraz.consent.set()` inline dentro dos listeners de DOM `{ once: true }`, com uma guarda defensiva `if (window.zaraz && window.zaraz.consent)`. Review (`chatgpt-codex-connector[bot]`) apontou que isso descarta o consentimento em silêncio se o `zaraz.js` (assíncrono) ainda não tiver carregado no momento do clique — sem retry, e o listener só dispara uma vez. Também nunca sincronizava consentimento já persistido de uma visita anterior. Corrigido: a sincronização agora vive numa assinatura de `window.addAnhangaConsentListener` (dispara imediatamente com o estado atual no registro, e de novo a cada mudança futura), com retry via `setInterval` de até 10s se o Zaraz ainda não estiver pronto. Os listeners de DOM não chamam mais o Zaraz diretamente.

`updateConsentState`/`gtag` não existiam mais no `index.html` atual (o arquivo já tinha evoluído desde o plano de jul/2026) — não havia nada a manter em paralelo além do `dataLayer.push` existente.

- [x] **Step 3: Teste estático — Zaraz consent API chamada nos dois listeners** (concluído 01/09/2026, ajustado em fedce64/8f4cc01)

Adicionado em `tests/index-third-party-scripts.test.ts` (assinatura registrada antes dos listeners de DOM, com os quatro elementos do bloco: mapeamento do `choice`, guarda de prontidão, chamada a `consent.set`, retry via `setInterval`; mais um teste separado confirmando que os listeners de DOM não chamam `window.zaraz` diretamente) e em `tests/e2e/cookie-consent.spec.ts` (stub de `window.zaraz.consent.set` via `addInitScript`, já que `window.zaraz` só existe em produção — não roda no dev server do Playwright; 3 testes: sincronização no load sem escolha prévia, aceite, e revogação via aceitar→gerenciar→recusar). **Playwright não executado** neste sandbox (sem Node); os testes `node:test` rodaram no CI e pegaram um bug real de slice num deles (corrigido em 8f4cc01) — revisão manual sozinha não é suficiente, o CI é a rede de segurança real aqui.

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

- [x] **Step 1: Adicionar o tool "Facebook Pixel"** (concluído 01/09/2026)

Pixel ID e access token: usuário digitou direto no dashboard. Gate: purpose `marketing` (Task 3), atribuída na aba **Consent** (não é uma config do tool em si).

**Achado importante:** ao adicionar a tool, o Zaraz liga por padrão duas "Automated actions" — **Pageviews** e **Events** (mesmo padrão visto no GA4 na Task 2). Diferente do GA4, aqui isso é sério: "Events" reenvia **todo** `zaraz.track()` do site (os ~16 eventos mapeados na Task 1 — formulários, quiz, waitlist, cliques da página de links, etc.) pro Meta como evento genérico, e "Pageviews" manda `PageView` em toda visita. Isso expande a coleta bem além do escopo desta task (só `generate_lead` → `Lead`) e contraria o resto desta migração. **As duas foram desligadas** — só a custom action `Meta - Lead` (Step 2) fica ativa. Conferir o mesmo em qualquer tool nova adicionada daqui pra frente, incluindo a TikTok (Task 5).

- [x] **Step 2: Mapear `generate_lead` pro standard event `Lead`** (concluído 01/09/2026)

Não há mapeamento automático de evento custom → standard event — foi preciso criar manualmente: **Custom actions → Create action**, Action Type `Event`, campo obrigatório **Facebook Event Name** = `Lead`. O trigger não é escolhido por nome de evento direto — precisou de um trigger novo (**Triggers → Create Trigger**) com Match Rule usando a variable de sistema **"Event Name"** (dentro de Web API, ao lado de "Event Property: ..." — não confundir os dois) `Equals` `generate_lead`. **"Include Event Properties"** ligado.

- [x] **Step 3: Confirmar quais campos de PII o evento `generate_lead` hoje carrega** (concluído 01/09/2026, sem mudança de código)

`pushGenerateLeadConversionEvent` não envia `email`/`phone`/`nome` hoje — só `destination`, UTMs e `ga_client_id`/`ga_session_id`. Isso significa **sem PII pro Advanced Matching hoje**, então o hashing SHA-256 do tool não tem o que hashear neste evento específico. Não expandir o payload nesta migração — é fora de escopo (mudaria o que é coletado, não só onde é enviado).

- [x] **Step 4: Validar payload no Zaraz Preview/Debug** (concluído 01/09/2026)

Disparado `generate_lead` sintético com `zaraz.debug()` ativo. Confirmado no Meta Events Manager → Test Events: evento `Lead`, status `Processado`, `Fonte da ação: website`/`Servidor` — confirma CAPI de verdade (sem pixel client-side). `Chaves de dados do usuário` mostra `fbp`/`fbc`/IP/User-Agent enriquecidos automaticamente pela tool, como previsto no spike.

**Lacuna do `event_id` — investigada e corrigida (01/09/2026).** O `event_id` inicialmente não chegava na tool (Meta caía no fallback aleatório do componente). Causa raiz, achada inspecionando a request real pra `/cdn-cgi/zaraz/t`: o toggle **"Include Event Properties"** não manda só as chaves da chamada `zaraz.track()` atual — ele repassa o **objeto acumulado do `dataLayer`**, que funde chaves de pushes anteriores na mesma sessão (ex.: um evento carregou `form_type`/`form_id` de um `form_submission` completamente diferente, mais `gtm.start`/client_id do bootstrap do GTM). O Zaraz está replicando fielmente a semântica real do `dataLayer` do GTM (cada push funde num objeto persistente, não substitui) — não é bug do Zaraz, mas o toggle "pegar tudo" é mais largo do que uma tag GTM manual, que normalmente lê variáveis específicas, não o blob inteiro.

**Correção aplicada:** desligado "Include Event Properties" na action `Meta - Lead`; adicionado campo individual **"Event ID"** via **"+ Add Field"**, mapeado a uma variable **"Event Property: event_id"** (não "Event Name", usada no trigger). Revalidado: `Identificação do evento` no Meta agora bate exatamente com o `event_id` que mandamos, sem parâmetros espúrios.

**Relevante pra Task 5 (TikTok) e qualquer tool futura:** evitar o toggle "Include Event Properties" (ou equivalente) por padrão — mapear campos individuais explicitamente via "Event Property: <nome>" em vez de confiar no blob acumulado do dataLayer.

**Incidente de segurança durante a investigação:** um print da tela "Tool Settings" foi compartilhado no chat com o **Conversion API Access Token completo em texto puro**. Token revogado e substituído imediatamente pelo usuário assim que identificado. Reforça a regra do plano: nunca printar telas com token visível, nem a Tool Settings (só a tela de configuração da action, que não expõe credenciais).

Revalidado depois de desligar Pageviews/Events: só `Lead` aparece nos Test Events, confirmando o escopo corrigido. **Lembrete:** remover o Test Event Code do campo da tool antes de qualquer publicação — não é código pra ficar em produção.

---

### Task 5: Configurar o tool TikTok (Events API)

**Files:**
- Configure: Zaraz dashboard → Tools → TikTok

**Interfaces:**
- Consumes: mesmo evento `generate_lead`.
- Produces: chamada server-side a `business-api.tiktok.com/.../event/track/`.

- [x] **Step 1: Adicionar o tool TikTok** (concluído 01/09/2026)

Pixel Code e access token: usuário digitou direto (token gerado no TikTok Events Manager). Gate: purpose `marketing`, atribuída na aba Consent. As lições da Task 4 foram aplicadas de cara desta vez:
- O wizard de setup já mostra "Track all pageviews"/"Track all other events"/"Track all ecommerce events" na etapa **Actions** — os dois primeiros vieram ligados por padrão (mesmo padrão do Meta) e foram desligados antes de salvar.
- Nenhum print da tela de credenciais foi feito desta vez.

- [x] **Step 2: Mapear `generate_lead` pro standard event equivalente** (concluído 01/09/2026)

O trigger `generate_lead` criado na Task 4 foi **reaproveitado** diretamente (triggers são um recurso compartilhado entre tools, não por-tool). Custom action `TikTok - Leads`: Action Type `Standard Event` → **`SubmitForm`** (não `Contact` — `SubmitForm` é a categoria de geração de leads do TikTok Ads, `Contact` é para o usuário iniciar contato diretamente, ex. clicar pra ligar). `event_id` mapeado individualmente via variable "Event Property: event_id" desde o início — sem passar pelo toggle "include all" que causou o bug no Meta.

- [x] **Step 3: Validar payload no TikTok Events Manager** (concluído 01/09/2026)

Disparado `generate_lead` sintético. Confirmado no TikTok Events Manager → Test Events: evento **"Enviar formulário"** (nome de exibição de `SubmitForm`, `Código: Lead` internamente), `Método de conexão: Servidor`, `Método de configuração: Código personalizado`, `event_id` batendo exatamente com o enviado, sem PII. Validação correta já na primeira tentativa — nenhum dos dois problemas do Meta (automated actions, blob acumulado) se repetiu, confirmando que as lições realmente generalizam pra outras tools do Zaraz.

---

### Task 6: Rodar em paralelo com o Stape e comparar — **PULADA (01/09/2026)**

O Stape já estava desativado desde 31/08/2026 (a própria Stape desligou o container por exceder o plano gratuito — motivo original desta migração, ver início do plano). Sem Stape ativo, não há com o que rodar em paralelo nem baseline simultânea pra comparar — os 4 steps abaixo pressupõem os dois sistemas rodando ao mesmo tempo, o que não é mais possível. Pulado direto pra Task 7 por decisão do usuário. Os steps ficam registrados como referência, não como trabalho pendente.

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
- Consumes: decisão do usuário de pular a Task 6 (Stape já desativado, sem baseline pra comparar).
- Produces: `index.html` sem nenhuma dependência do Stape.

- [x] **Step 1: Remover o loader do Stape de `index.html`** (concluído 01/09/2026)

Removidos: variável `gtmLoaded`, função `loadGtm` inteira (incluindo o `window.dataLayer.push({'gtm.start':...})` interno) e sua chamada em `loadAnalytics`; os dois `<link rel="dns-prefetch">` pra `load.sst.anhanga.tur.br`/`sst.anhanga.tur.br` no `<head>`. `injectScript` foi mantida — ainda é usada pelo `utm-tracking.js`.

- [x] **Step 2: Atualizar os testes estáticos** (concluído 01/09/2026)

`tests/index-third-party-scripts.test.ts`: substituído o teste que exigia o loader do Stape por um `doesNotMatch` (padrão Mautic/HubSpot) checando `gtmLoaded`/`loadGtm`/`sst.anhanga.tur.br`/`'gtm.start'`; removidos os dois testes que verificavam comportamento específico do `loadGtm` (gate de host) e do preconnect/dns-prefetch dos hosts sGTM (não fazem mais sentido, o host não é mais referenciado). `playwright.config.ts`/`tests/playwright-safety.test.ts` mantidos como estavam — os `MAP ... ~NOTFOUND` dos hosts do Stape ficam como defesa em profundidade, mesmo padrão adotado pro HubSpot na remoção de set/2026.

- [ ] **Step 3: Rodar a suíte completa** — **não executado neste sandbox (sem Node)**, só revisão manual linha a linha. Rodar antes do merge:

```bash
pnpm test:regression
pnpm exec playwright test tests/e2e/cookie-consent.spec.ts
pnpm typecheck
pnpm lint:changed
pnpm run build
```

- [x] **Step 4: Atualizar RIPD e docs** (concluído 01/09/2026 — "desativar/cancelar a conta Stape" não se aplica, a própria Stape já desativou)

RIPD bumped pra **v1.9**: Stape substituído por Cloudflare Zaraz nas Atividades 1 e 2 (DPA com a Cloudflare marcado como **pendente de confirmação**, não implementado — achado de review, ver abaixo); Atividade 4 (Customer Match) marcada como **inativa** (já dependia do Mautic removido na v1.8, agora também do Stape); pendências #1 e #4 marcadas obsoletas. `README.md` atualizado. `.env.example` não mencionava Stape/sGTM (checado, nada a mudar).

**Correção (achado de review, chatgpt-codex-connector[bot]):** a checagem original de `docs/performance-third-party-scripts.md` (buscando literalmente "stape"/"sgtm") deu falso negativo — o arquivo não cita essas palavras, mas descrevia o loader do GTM como se ainda existisse (`GTM-T2KGS86G`, validação via "GTM Preview"). Reescrito pra registrar a remoção do GTM como superseding note e trocar os passos de validação por Zaraz/Meta/TikTok Events Manager.

**Achados extras na política de privacidade** (fora do escopo original deste step, mas encontrados ao corrigir as menções à Stape):
- `PrivacySection4MetodosColeta.tsx` citava "Meta Pixel (Facebook) para remarketing" como cookie/tecnologia client-side — **desatualizado desde as Tasks 4-5** (arquitetura é CAPI-only, sem pixel client-side). Corrigido.
- `PrivacySection6Compartilhamento.tsx` **nunca listava o TikTok** como destinatário de dados, apesar do TikTok Events API já estar em produção desde o plano de jul/2026 (`2026-07-23-sgtm-hybrid-consent.md`) — anterior a esta migração. Corrigido (TikTok Pte. Ltd. adicionado). Vale o DPO revisar essa adição.
- `PrivacySection5FinalidadesBases.tsx` (Customer Match) atualizada pra refletir que a finalidade está inativa, sem atribuir a função de upload à Cloudflare (que não faz upload em lote).

**Segunda rodada de review (chatgpt-codex-connector[bot], 7 achados, todos confirmados e corrigidos):**
1. `PrivacySection4MetodosColeta.tsx` usava `**negrito**` em Markdown dentro de JSX — renderiza como asteriscos literais pro usuário, não negrito. Trocado por `<strong>`.
2. `docs/performance-third-party-scripts.md` — a checagem original (buscar "stape"/"sgtm") deu falso negativo; o arquivo descrevia o loader do GTM como se ainda existisse. Reescrito com nota de superseding e passos de validação atualizados pro Zaraz.
3. RIPD: checkbox `[x]` marcava a cobertura do DPA da Cloudflare como implementada enquanto o próprio texto dizia "pendente confirmar" — inconsistente. Trocado pra `[ ]` nas duas ocorrências (Atividades 1 e 2); a linha de Transferência internacional também não presume mais cobertura.
4. RIPD: a frase "arquitetura de anonimização/filtragem é preservada" contradizia o achado (linha abaixo) de que o Zaraz não tem scrubber de PII equivalente ao da Stape e ~15 eventos não foram auditados. Qualificada — só a supressão de IP é confirmada, a mitigação de PII é estrutural (nenhum evento carrega PII por design), não uma ferramenta.
5. **RIPD, achado mais substancial:** a nota de risco aceito do §1 (registro de consentimento só em `localStorage`) dependia da premissa "sem tratamento server-side associado" — que deixou de ser verdade com Meta/TikTok CAPI-only (a escolha de marketing agora aciona chamada server-side real pro Meta/TikTok). Adicionada nota de atualização reconhecendo isso e marcando como pendência do DPO reavaliar se o risco aceito em v1.5 ainda é proporcional.
6. `PrivacySection3Categorias.tsx` (seção 3.4) e `PrivacySection6Compartilhamento.tsx` continuavam descrevendo Customer Match como finalidade ativa, inconsistente com a seção 5.5 que a marca como inativa (achado anterior). Ambas atualizadas pra "atualmente inativo".
7. Global Constraint "Rollout em paralelo — Stape/GTM continuam ativos" nunca foi formalmente superada, mesmo com a Task 6 pulada e a Task 7 concluída sem essa janela. Marcada como superada, com nota explicando a evidência substituta (validações individuais das Tasks 1-5).

**Terceira rodada de review (chatgpt-codex-connector[bot], 2 achados P1, ambos confirmados no código real e corrigidos):**
1. **`ga_client_id` quebrado pra visitantes novos.** `public/utm-tracking.js` e `utils/whatsapp.ts` dependiam de `gtag('get', ..., 'client_id', callback)` ou de ler o cookie `_ga` do Google pra obter o client ID do GA4 — mas nada carrega o `gtag.js` real desde que o loader do GTM foi removido (e já não carregava desde 31/08, quando a própria Stape desativou o container). Um visitante sem o cookie `_ga` legado nunca teria `ga_client_id`, quebrando a correlação de conversão no GA4 (e a futura integração de conversões offline Odoo→GA4, ver `docs/product/odoo-ads-conversion-decision.md`). Corrigido: as duas funções agora geram e persistem um ID próprio (cookie `anhanga_ga_cid`, formato `número.timestamp` igual ao `_ga`) quando não existe nenhum cookie do Google — decoupled de qualquer script do Google rodar. Teste de regressão adicionado em `tests/whatsapp-tracking.test.ts`.
2. **Vetor real de vazamento de PII via UTM.** `utils/whatsapp.ts` aceitava qualquer valor de UTM/`hsa_*` da URL sem validação e espalhava tudo no evento `tracking_data_captured`, que o Zaraz encaminha ao GA4 sem scrubbing — um link como `?utm_content=email@exemplo.com` vazaria PII pro GA4. Isso contradizia a afirmação da rodada anterior de que "nenhum evento carrega PII por design". Corrigido: extraído `utils/piiRedaction.ts` (reaproveitando os padrões de e-mail/telefone que já existiam em `utils/formAnalytics.ts`, em vez de duplicar) e usado em `utils/whatsapp.ts` pra rejeitar valores com formato de e-mail/telefone antes de aceitá-los como tracking. RIPD atualizado (2.6) marcando esse item como corrigido, com ressalva de que não é um scrubber genérico — só cobre o vetor identificado.

**Quarta rodada de review (ambos os bots, 02/09/2026 — 5 achados confirmados e corrigidos, 1 stale, 1 pendência real em aberto):**
1. **P1 (claude[bot]) — bypass de duplo URL-encoding no fix de PII acima.** `isSafeTrackingValue` validava o valor já decodificado uma vez por `URLSearchParams`, mas `appendDecodedTrackingValue` decodificava de novo antes de gravar — um valor como `?utm_content=%2565mail%2540example.com` passava no check ("%65mail%40example.com", sem "@" literal) e só virava e-mail de verdade no segundo decode, já aprovado. Corrigido: removido o segundo decode (redundante — `URLSearchParams` já decodifica por completo).
2. **P1 (chatgpt-codex-connector[bot]) — segundo coletor sem filtro.** `public/utm-tracking.js` grava na mesma `sessionStorage` key (`anhanga_tracking_data`) que `mergeStoredTrackingData` lê de volta sem revalidar — um caminho paralelo que ignorava o filtro de PII adicionado na rodada anterior. Corrigido centralizando a revalidação em `mergeStoredTrackingData` (não duplicando a regra num script estático sem bundler).
3. **P2 (chatgpt-codex-connector[bot]) — falsos positivos no filtro de telefone.** `PHONE_PATTERN` sozinho casa qualquer sequência longa de dígitos, descartando IDs de campanha e datas ISO puramente numéricos (`utm_campaign=1234567890`, `2026-09-01`) como se fossem telefone. Corrigido com `looksLikePhoneNumber` (exige "+" ou separador de formatação; exclui datas ISO).
4. **P2 (ambos os bots) — RIPD chamava o GA client id de "anonimizado".** Ele é gravado em `x_ga_client_id` no mesmo registro `crm.lead`/`res.partner` que tem e-mail/telefone, especificamente pra correlação cross-sistema — é pseudonimizado, não anônimo. Reescrita a §2.1/2.3.
5. **Stale (chatgpt-codex-connector[bot]) — "teste de gtag ainda quebrado".** Achado citava o commit `ac92d2d`, mas esse mesmo commit já tinha removido a asserção antiga — confirmado via `git show ac92d2d:tests/index-third-party-scripts.test.ts`. Provável leitura do diff cumulativo antes do commit terminar de aplicar. Nenhuma mudança necessária.
6. **P1 (chatgpt-codex-connector[bot]) — investigado ao vivo (browser conectado, 02/09/2026), PENDENTE como tarefa própria, fora do escopo desta PR.** O `anhanga_ga_cid` que geramos é um ID totalmente nosso, desconectado do client_id real que o Zaraz usa nos hits GA4. Cadeia de investigação:
   - Fonte do Managed Component GA4 (`github.com/managed-components/google-analytics-4/src/requestBuilder.ts:101-107`): o Zaraz já gera e persiste seu próprio client_id via `client.set('ga4', cid, {scope:'infinite'})` — mas honra `payload.cid` se essa propriedade vier no evento, sobrescrevendo o auto-gerado nesse hit específico.
   - Testado em produção: `document.cookie` fica **completamente vazio** mesmo depois de hits reais do Zaraz confirmados via rede (`/cdn-cgi/zaraz/t`, 200) — os cookies que `client.set()` cria são **HttpOnly**, ilegíveis por qualquer JS de página. Ler o cookie real (a ideia original) é impossível, não é questão de achar o nome certo.
   - Testado `window.zaraz.set('cid', valor, {scope:'page'})` + `zaraz.track()`: o valor **aparece** no payload que o GA4 recebe (`"cid":"debug-cid-..."` confirmado via patch de `fetch`/`sendBeacon`). O mecanismo de injeção funciona.
   - Mas: o script do Zaraz (`cdn-cgi/zaraz/s.js`) é injetado dinamicamente por script (não está no HTML bruto — confirmado via `curl` com UA de navegador real, 0 ocorrências; `performance.getEntriesByType('resource')` mostra `initiatorType: "script"`, carregando só ~2.15s após a navegação) — quem injeta esse loader não é código nosso (`grep` no repo não acha nada), é a própria plataforma Cloudflare. O Pageview automático do Zaraz dispara nesse boot, antes do nosso script deferido (por design, pra proteger TBT) rodar — nosso `zaraz.set('cid',...)` chegaria tarde pro Pageview automático, só valeria pros eventos customizados que disparamos depois.
   - **Achado extra que muda o desenho do fix:** `utils/generate-lead-analytics.ts:28` já envia esse identificador como `ga_client_id` (nome customizado), não como `cid`. O Managed Component só reconhece literalmente `payload.cid` pra sobrescrever o client_id do Measurement Protocol — `ga_client_id` vira só mais um parâmetro customizado do evento no GA4, não unifica a sessão. Corrigir isso exige decidir quais eventos devem carregar `cid` (todos? só `generate_lead`?), renomear/mapear o campo, e validar de novo no GA4 DebugView — desenho de tarefa nova, não um ajuste pontual.
   - **Decisão (02/09/2026):** não forçar essa correção nesta PR já grande — vira item de plano próprio, com validação passo a passo como as Tasks 1-5 tiveram, em vez de um fix apressado que poderia parecer correto sem realmente unificar a sessão GA4.

- [ ] **Step 5: Monitorar por 3–7 dias pós-corte** — pendente, só possível depois do merge e deploy em produção.

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
