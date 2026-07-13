# Implementation Plans

Gerados pela skill improve em 2026-06-12, contra o commit `d27f8b0`. Execute na
ordem abaixo, salvo dependências. Cada executor: leia o plano inteiro antes de
começar, honre as STOP conditions e atualize sua linha ao terminar.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001 | Atualizar docs pós-migração (Cloudflare Pages + Salesforce) | P1 | S | — | DONE |
| 002 | Remover lockfile npm fantasma + mesclar testes lead-logic | P2 | S | — | DONE |
| 003 | Hardening: HTTPS nos webhooks n8n + validar ALLOWED_ORIGIN | P2 | S | — | DONE |
| 004 | Links internos absolutos → navegação SPA nas landings | P2 | M | — | DONE |
| 005 | Rejeitar markdown/URL em campos de destino do handoff IA | P3 | M | — | DONE |
| 006 | Restringir links do markdown da IA a allowlist no chat | P2 | S | — | DONE |
| 007 | Testes unitários diretos dos builders de payload do n8n | P2 | S | — | DONE |
| 008 | Extrair helper de resposta JSON dos handlers submit-* | P3 | M | 007 (recomendado) | DONE |
| 009 | Fallback visível quando globe.gl falha (CorpGlobe) | P3 | S | — | DONE |
| 010 | Header CSP na página de callback OAuth do Decap | P3 | S | — | DONE |
| 011 | Normalizar click IDs vazios/whitespace → null nos payloads n8n | P3 | S | 007 | DONE |
| 012 | Tirar artefatos/dumps obsoletos da raiz para `docs/` (root mínima) | P3 | S | — | DONE |
| 013 | Congelar namespace Tailwind legado `brand-*` com guard ratchet | P3 | S | — | DONE |
| 014 | Atualização automática de reviews do Google (GH Actions agendado) | P3 | S | — | DONE |
| 015 | SPIKE: expandir superfície de tools do chatbot (design doc) | P3 | M | — | DONE |
| 016 | SPIKE: rotear resultado do quiz para o chatbot (design doc) | P3 | M | — | DONE |
| 017 | Mover folder do design system → `docs/design/brand-system/` + ajustar teste | P3 | S | — | DONE |
| 018 | Guard do workflow de reviews ignora mudança só de `lastFetched` | P3 | S | 014 | DONE |
| 019 | Fechar o loop de conversão Odoo → Google/Meta (parte repo, flags off) | P1 | M | — (gates externos p/ ativação) | DONE |
| 020 | SPIKE: spec do funil canônico de medição (visitante → receita CRM) | P2 | M | — | TODO |
| 021 | Protótipo de prova social casada ao destino no modal de Destinations | P2 | M | — | TODO |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (com motivo) | REJECTED (com justificativa)

> **Rodada 2** (commit `68eecf6`, 2026-06-12): planos 001–005 já executados
> (DONE, PRs #868–#872). Planos 006–010 são desta rodada — foco em performance
> (gap da rodada 1), segurança de defesa-em-profundidade e cobertura de testes.

> **Rodada 3** (commit `ec3029a`, 2026-06-21): audit focado no delta de 44
> commits desde a rodada 2. Núcleos críticos (generate, OAuth callback, leads),
> cobertura de testes (83 arquivos) e o código novo (otimizador R2, hardening
> OAuth, UX mobile) estão sólidos e foram mudanças intencionais/testadas. Sobram
> só achados de baixa alavancagem: 012 (higiene de raiz, ganho claro) e 013
> (freeze do namespace de cor — versão segura S/LOW, não o big-bang). Direção
> auditada via `/improve next` — sugestões grounded apresentadas ao mantenedor.

> **Rodada 4** (commit `f5e4324`, 2026-07-12): planos de direção derivados do
> `/improve next` desta rodada, escopo confirmado pelo mantenedor (achados 1–3).
> 019 implementa a parte repo de `docs/product/odoo-ads-conversion-decision.md`
> atrás de flags default-off — a **ativação** segue bloqueada pelos gates
> externos (campos no Odoo, RIPD/DPO, fase de sombra); não declarar completo
> sem validação viva. 020 é spec/docs-only (define antes de implementar).
> 021 é protótipo mensurável com fallback honesto.

## Dependency notes

- 001–005: sem dependências rígidas (todos DONE).
- 006, 007, 009, 010: independentes entre si.
- 008 não depende rigidamente de 007, mas recomenda-se executá-lo **depois** —
  os testes dos builders (007) dão rede de segurança extra ao refatorar os
  handlers de lead.
- 019, 020, 021: independentes entre si (executáveis em qualquer ordem).
  Sinergia sem dependência rígida: os campos estruturados do 019 (x_gclid,
  x_ga_client_id etc.) são o mecanismo de correlação do estágio `won` que a
  spec do 020 referencia; e a instrumentação que o 020 especifica (ex.
  `handoff_created`) é pré-requisito do A/B test quiz→chat do plano 016 —
  a spec vem antes de qualquer implementação de eventos.

## Findings considered and rejected

- Inconsistência de timing-safe compare entre handlers: código atual é seguro
  (HMAC via crypto.subtle); risco apenas de padrão futuro — não vale plano.
- Edge cases do rate limiter (`lib/rate-limit.ts` TTL/in-memory dev): comportamento
  correto; footgun só em dev.
- Race de state OAuth multi-tab no Decap CMS (`api/auth.ts`/`callback.ts`): fricção
  rara de UX, validação de state continua correta; custo (M) > benefício.
- Validação de formato de click IDs em `api/purchase-dispatch.ts`: falha
  silenciosa no provedor, sem impacto de segurança.
- Cast/`JSON.parse` em `api/hubspot-webhook.ts`: seguro hoje (try-catch cobre);
  módulo é legado.
- `console.error` em `api/auth/callback.ts:85`: vazamento de informação já
  semi-pública; trocar por logger quando o arquivo for tocado por outro motivo.
- Refactor do `SearchForm.tsx` (1005 linhas): debt real, mas L de esforço com
  risco MED e sem bug ativo — não priorizado nesta rodada.
- Limpeza dos 7 arquivos HubSpot-only (`api/hubspot-webhook.ts`,
  `services/hubspot.ts`, `lib/hubspot-validation.ts` + 4 testes): depende de
  decisão de negócio (deals Closed-Won ainda passam por lá); planejar quando a
  migração de tracking de deals para Salesforce for confirmada.
- Footer Orlando com ano hardcoded: cosmético; corrigir quando tocar no arquivo.
- Script `verify` unificado / cache de Chrome no CI / `dev:cms` com concurrently:
  ganhos pequenos de DX; fazer oportunisticamente.

### Considered and rejected — rodada 2 (commit `68eecf6`)

- **PERF: Leaflet importado no topo de `Destinations.tsx`** — falso positivo. O
  componente é lazy-loaded em `pages/Home.tsx` e gated por IntersectionObserver
  (`shouldLoadDestinations`); Leaflet fica num chunk separado, fora do bundle
  crítico.
- **Cache de regex unbounded em `lib/ai/utils.ts`** — Cloudflare reseta estado
  de módulo por request; o `_aliasPatternCache` não cresce entre requests.
  Impacto desprezível em produção.
- **`lib/ai/validation.ts` "sem testes"** — falso; já coberto por
  `tests/ai-validation-plain-text.test.ts`.
- **Timing-safe compare no state OAuth (`api/auth/callback.ts`)** — state é
  gerado server-side, alta entropia, single-use; timing attack impraticável.
  Já avaliado e descartado na rodada 1.
- **Teste de schema dedicado para `submit-lead`** — coberto indiretamente por
  `tests/submit-lead.test.ts`; baixo valor isolar.
- **Cache do cliente Gemini em `api/generate.ts`** — o edge runtime já cacheia
  imports de módulo; ganho especulativo, não medido.
- **Re-renders do `SearchForm.tsx` (PERF-06)** — plausível mas especulativo;
  exige profiling para confirmar impacto real. Não priorizado sem medição.
- **Config sprawl (.agent/.agents/.qwen/.codex/.Jules), Vercel/Netlify configs,
  script `verify` unificado** — DX menor; fazer oportunisticamente (já anotado
  na rodada 1).

### Considered and rejected — rodada 3 (commit `ec3029a`)

- **Advisories do `pnpm audit` (ws/undici em wrangler→miniflare)** — dev-only.
  Atingem só o emulador local; não estão no runtime de produção (Cloudflare
  edge) nem no output de build. Ruído de baixo sinal, sem plano.
- **Big-bang `brand-*` → `anhanga-*` (~629 usos)** — débito real, mas L de
  esforço e risco MED–HIGH com só snapshots visuais de rede; péssimo encaixe
  para executor barato. Reformulado como plano 013 (freeze ratchet, S/LOW);
  migração fica oportunística.
- **Tokens de cor pouco usados (`brand.blue`, `brand.cyanDark` — 3 usos cada)**
  — removê-los exige migrar os call sites; coberto pela política do 013, sem
  plano isolado.
- **`feat(ai)` #908 (liberação de destinos Oriente Médio + visa_status)** —
  mudança de produto intencional (estabilização do conflito), testada. By-design.
- **`functions/api/*` fazem `Object.assign(process.env, env)` por request** —
  padrão canônico de bridge das Pages Functions; coberto por
  `cloudflare-config.test.ts`. By-design.
- **Decomposição de `SearchForm.tsx` (1005) / `QuizAnhangaLanding.tsx` (1110)**
  — segue sendo débito real (L), reafirmado das rodadas 1–2; sem bug ativo, não
  priorizado.

### Direção (`/improve next`) — rodada 3

- **D1: loop NPS → review no Google** — **já implementado**. `pages/NpsPage.tsx`
  ramifica por nota (`score >= 9 → thank-promoter`) e `components/nps/NpsThankPromoter.tsx`
  já mostra o CTA "Deixar minha review no Google". O que falta é automação no
  lado n8n (fora do repo). Sem plano.
- **D2 → plano 014**: refresh automático de reviews (gap real — nenhum workflow
  `schedule:` hoje).
- **D3 → plano 015 (spike)**: expandir tools do chatbot. Arquitetura permite, mas
  roteamento é hardcoded p/ `generate_budget_link`; valor de produto especulativo.
- **D4 → plano 016 (spike)**: rotear resultado do quiz p/ o chatbot. Assimetria
  real (quiz → WhatsApp, ignora o chatbot apesar de já ter perfil + bantSummary),
  mas o caminho atual converte lead morno — medir antes de mudar.

### Direção (`/improve next`) — rodada 4 (commit `f5e4324`, 2026-07-12)

Achados 1–3 viraram os planos 019–021 (escopo confirmado pelo mantenedor).
Opções de menor prioridade, **estudadas e não planejadas** — exigem nova
evidência antes de reabrir:

- **Retomada de conversa mobile (consentida, expirável)** em
  `components/AIChatPanel.tsx`/`components/AIChat.tsx` — não planejar sem um
  design de privacidade prévio (não persistir histórico sensível sem base
  clara); demanda também sinal de que abandono de conversa é problema real.
- **Estados explícitos de campanha evergreen** (`pages/landings/LollapaloozaLanding.tsx`
  + `App.tsx`) — não generalizar máquina de estados até uma **segunda**
  campanha recorrente provar o padrão.
- **Clusters editoriais / GEO** (`docs/seo/orlando-content-cluster.md`,
  `docs/seo/geo-citation-monitoring-pilot.md`, `docs/seo/geo-content-strategy-2026-07.md`)
  — gated em evidência: o primeiro baseline de citação GEO ainda não rodou;
  rodar o piloto antes de investir em produção de conteúdo.
- **Expansão de tools do chatbot** — segue deferida
  (`docs/product/chatbot-tool-expansion-spike.md`, plano 015).
- **Quiz → chatbot** — segue como A/B test instrumentado
  (`docs/product/quiz-to-chatbot-funnel-spike.md`, plano 016), bloqueado pela
  lacuna de medição que o plano 020 especifica.

## Audit gaps

- Rodada 1 não auditou performance; rodada 2 cobriu. O achado de maior valor de
  perf (lazy de chunks pesados) já estava resolvido no código — ver rejeitados.
- **Direção/features** auditada só superficialmente. Rodar `/improve next` se
  houver interesse em roadmap de produto.
- Decomposição de `QuizAnhangaLanding.tsx` (1109) e `SearchForm.tsx` (1005)
  permanece debt real (L de esforço) — habilitaria testes unitários hoje
  impossíveis; não planejado nesta rodada.
