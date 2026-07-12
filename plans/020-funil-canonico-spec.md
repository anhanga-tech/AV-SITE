# Plan 020: SPIKE — especificar o funil canônico de medição (visitante → receita no CRM)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f5e4324..HEAD -- utils/formAnalytics.ts hooks/useLeadCapture.ts hooks/useQuizCapture.ts components/AIChatPanel.tsx components/ChatLeadForm.tsx lib/odoo-submit-handler.ts lib/odoo-lead-mapping.ts docs/product/`
> If any in-scope-for-reading file changed since this plan was written, compare
> the "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (entregável é um documento; zero mudança de código)
- **Depends on**: none. Sinergia com `plans/019-odoo-ads-conversion-loop.md`: os campos estruturados de tracking no Odoo (019, Step 3) são o mecanismo natural de correlação do estágio `won` — a spec deve referenciá-los, não redesenhá-los.
- **Category**: direction
- **Planned at**: commit `f5e4324`, 2026-07-12

## Why this matters

O site roda funis distintos (chatbot BANT, quiz, formulários de contato,
waitlists) que emitem eventos de analytics **assimétricos** — cada funil mede
etapas diferentes com nomes diferentes, e nenhum evento cobre o trecho do meio
("handoff criado") nem o final ("virou receita no CRM"). A consequência
concreta já está registrada: `docs/product/quiz-to-chatbot-funnel-spike.md`
recomendou um A/B test quiz→chat e o declarou **bloqueado** por falta de
medição downstream simétrica ("Sem um evento de 'chegou no orçamento'... a
comparação ficaria limitada a cliques no CTA — insuficiente para decidir").
Este spike define **um** ciclo de vida canônico, a fonte de verdade de cada
estágio, as propriedades privacy-safe e a chave de correlação estável — a spec
que qualquer instrumentação futura (e os experimentos hoje bloqueados)
implementa. Definir antes de implementar; este plano não instrumenta nada.

## Current state

Inventário verificado no commit `f5e4324` (o executor deve re-verificar cada
item — é a matéria-prima da spec):

### Eventos browser-side existentes

- `utils/formAnalytics.ts` — vocabulário compartilhado de formulários, 8
  eventos: `form_view`, `form_start`, `field_complete`, `field_error`,
  `submit_attempt`, `submit_success`, `submit_failure`, `whatsapp_opened`.
  Payload passa por allowlist (`SAFE_FIELD_NAMES`) e redação de PII na URL
  (`currentPageLocation`, linhas 45–64) — **este é o padrão privacy-safe do
  repo; a spec deve adotá-lo como regra**. Usado por `ChatLeadForm.tsx`,
  `ContactModal.tsx`, `SearchForm.tsx`, `MobileHeroForm.tsx`,
  `CorpContactForm.tsx`, entre outros.
- `hooks/useLeadCapture.ts:204-232` — `pushGenerateLeadDataLayerEvent`: no
  sucesso do `/api/submit-lead` empurra `generate_lead` (com `event_id`,
  `destination`, UTMs, `ga_client_id`/`ga_session_id`) + `form_submission`
  (`form_type`: `ai_chatbot_lead` | `event_lead` | `corporate_lead`,
  `form_id` = `event_id`).
- `hooks/useQuizCapture.ts:17-38` — `pushQuizDataLayerEvent`: no sucesso do
  `/api/submit-quiz` empurra `quiz_lead` (com `quiz_profile`, UTMs,
  `ga_client_id`/`ga_session_id`) + `form_submission` (`form_type:
  'quiz_lead'`, `form_id: 'quiz_anhanga'` — **fixo**, não é um event_id).
  Nota de drift: a versão citada no spike do quiz chamava
  `sendLeadToSalesforce`; isso **não existe mais** (cut-over Odoo).
- `components/ChatLeadForm.tsx` — usa `pushFormAnalyticsEvent` com
  `formType: 'ai_chatbot_lead'` e `'ai_chatbot_direct_whatsapp'`.

### O gap central verificado

`components/AIChatPanel.tsx:320-340` — quando o Gemini retorna
`response.budgetLink` (BANT completo → cartão "Orçamento Pronto"), o código
seta o draft e injeta o cartão de ação, **sem nenhum push ao dataLayer**:

```ts
    if (response.budgetLink) {
      setLeadDraft({
        bantSummary: response.budgetLink.bantSummary,
        // ...
      });
      nextMessages.push({
        id: generateMessageId(),
        role: 'model',
        text: 'Orçamento Pronto',
        isAction: true,
        // ...
      });
    }
```

Ou seja: o momento "qualificado/handoff criado" do funil do chatbot — o
equivalente ao `quiz_lead` do quiz — é invisível hoje. É exatamente a
assimetria que bloqueou o A/B test.

### Correlação client ↔ CRM existente

- O chatbot gera `event_id` no formato `lead_{uuid}`
  (`hooks/useLeadCapture.ts:145-151`, `createLeadEventId`), envia ao
  `/api/submit-lead` (schema aceita `event_id` até 128 chars,
  `lib/schemas/submit-lead.ts:43`).
- `lib/odoo-submit-handler.ts:65-66` usa esse `eventId` como **chave de
  idempotência** do `crm.lead`, gravada como linha `idempotency_key: ...` no
  HTML de `description` (`lib/odoo-lead-mapping.ts`,
  `IDEMPOTENCY_KEY_LABEL`). Portanto o `event_id` do browser **já chega ao
  Odoo hoje**, mas só como texto de descrição (consultável via domain `like`,
  não como campo estruturado).
- `ga_client_id`/`ga_session_id` são capturados no cliente
  (`utils/whatsapp.ts`) e viajam no `tracking` de todos os hooks de captura.
- Estágios do CRM: `crm.lead` nasce com `stage_id = 1` (Novo,
  `lib/odoo-lead-mapping.ts:37`); transições de estágio (aceito, qualificado
  pelo vendedor, Ganho/Perdido) **não emitem nada** — a infraestrutura para o
  estágio `won` é o objeto do plano 019.

### Intenção de produto a honrar

`PRODUCT.md` (princípio "conversa não transação") e o spike do quiz: o funil
canônico deve **descrever** os caminhos existentes (chat, quiz, formulários,
WhatsApp direto), não forçá-los a um só fluxo. Funis distintos, ciclo de vida
de medição único. Preferência registrada do mantenedor: não achatar funis
distintos.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck (sanidade, nada deve mudar) | `pnpm typecheck` | exit 0 |
| Confirmar zero mudança de código | `git status --porcelain -- . ':!docs' ':!plans'` | vazio |

## Scope

**In scope** (únicos arquivos a criar/modificar):
- `docs/product/funil-canonico-de-medicao.md` (criar — o entregável)
- `plans/README.md` (linha de status)

**Out of scope** (NÃO tocar):
- **Qualquer arquivo de código.** Este plano é docs-only por definição
  ("definir antes de implementar"). Nada de adicionar eventos, mesmo o
  `handoff_created` óbvio — ele entra na spec como "instrumentação proposta",
  para um plano/PR futuro.
- `docs/product/quiz-to-chatbot-funnel-spike.md` e
  `docs/product/chatbot-tool-expansion-spike.md` — referenciar, não editar.
- GTM/GA4/dashboards — configuração externa; a spec só nomeia o que deve
  existir lá.

## Git workflow

- Branch: `docs/020-funil-canonico`
- Conventional commit (ex.: `docs(product): spec do funil canônico de medição`)
- PR draft ao final; merge é sempre humano (squash).

## Steps

### Step 1: Re-verificar o inventário

Confirmar, com `grep`/leitura, cada afirmação da seção "Current state" (os 8
eventos de `formAnalytics`, os pushes de `useLeadCapture`/`useQuizCapture`, a
ausência de push em `AIChatPanel.tsx` no ramo `response.budgetLink`, o fluxo do
`event_id` até a `description` do Odoo). Qualquer divergência → STOP.

**Verify**: `grep -c "dataLayer" components/AIChatPanel.tsx` → `0`.

### Step 2: Escrever `docs/product/funil-canonico-de-medicao.md`

Cabeçalho no padrão dos spikes existentes (ver
`docs/product/quiz-to-chatbot-funnel-spike.md`): data, tipo ("Spec de medição —
não há mudança de comportamento neste documento"), commit de verificação.

Seções obrigatórias (títulos exatos, são o done-criteria):

1. `## Ciclo de vida canônico` — os estágios
   `intent_started → qualified → handoff_created → lead_accepted → sales_qualified → won/lost`,
   cada um com definição de uma frase e o critério observável que o dispara.
2. `## Mapeamento por funil` — tabela: estágio canônico × funil (chatbot,
   quiz, contato/formulários, WhatsApp direto) × evento/sinal existente hoje ×
   lacuna. Usar o inventário do "Current state". Exemplos do mapeamento
   esperado (o executor valida e completa, não copia cegamente):
   - `intent_started`: chat = primeira mensagem do usuário (sem evento hoje);
     quiz = início do quiz; formulários = `form_start`.
   - `qualified`/`handoff_created`: chat = `response.budgetLink` chega
     (**lacuna — o gap central**); quiz = `quiz_lead`.
   - `lead_accepted`: `submit_success`/`generate_lead` (lead criado no Odoo).
   - `sales_qualified`, `won/lost`: transições de estágio do `crm.lead`
     (**lacuna — só medível via infraestrutura do plano 019**).
   Regra dura: funis distintos mapeiam para o MESMO vocabulário de estágios;
   nenhum funil é removido ou fundido por causa da medição.
3. `## Fonte de verdade por estágio` — decidir e justificar: browser/dataLayer
   (GA4) para estágios pré-lead; Odoo para `lead_accepted` em diante. Nomear o
   sistema que desempata quando os dois discordam (recomendação: Odoo para
   contagem de leads e receita; GA4 para comportamento pré-lead).
4. `## Chave de correlação` — especificar a chave estável ponta a ponta:
   `event_id` (`lead_{uuid}`) como id primário do lead do chat +
   `ga_client_id`/`ga_session_id` como join secundário; documentar que o
   `event_id` já chega ao Odoo como `idempotency_key` na description e que a
   versão estruturada (campo consultável) depende dos campos do plano 019.
   O quiz não tem event_id por submissão hoje (`form_id: 'quiz_anhanga'` fixo)
   — registrar como lacuna com proposta (gerar `quiz_{uuid}` no submit).
5. `## Propriedades privacy-safe` — a allowlist de propriedades permitidas por
   evento, herdando as regras de `utils/formAnalytics.ts` (allowlist de
   nomes de campo, redação de e-mail/telefone em URLs, nunca PII crua no
   dataLayer). Registrar explicitamente: `x_lgpd_consent` no Odoo é opt-in de
   **e-mail marketing**, não consentimento de analytics — se algum estágio
   exigir base legal própria, sinalizar para o DPO (mesmo processo do §7 de
   `docs/product/odoo-ads-conversion-decision.md`).
6. `## Lacunas de instrumentação propostas` — lista priorizada do que um plano
   futuro implementa (no mínimo: evento `handoff_created` no ramo
   `response.budgetLink` de `AIChatPanel.tsx`; `intent_started` no chat;
   event_id por submissão do quiz; eventos de estágio CRM via plano 019).
   Cada item com: onde no código, payload proposto (conforme seção 5), e o que
   desbloqueia (ex.: o A/B test do spike do quiz).
7. `## O que esta spec NÃO decide` — escolha de ferramenta de dashboard,
   mudanças de UX nos funis, e qualquer implementação.

**Verify**:
`grep -c "^## " docs/product/funil-canonico-de-medicao.md` → ≥ 7.

### Step 3: Sanidade docs-only

**Verify**: `git status --porcelain` mostra somente
`docs/product/funil-canonico-de-medicao.md` e `plans/README.md`;
`pnpm typecheck` → exit 0.

## Test plan

Docs-only — isento de testes de runtime pela regra do repo
(`.claude/rules/testing.md`, "Documentation-only changes do not require
runtime tests"). A verificação é estrutural (seções obrigatórias presentes) e
factual (Step 1).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `docs/product/funil-canonico-de-medicao.md` existe
- [ ] `grep -c "^## " docs/product/funil-canonico-de-medicao.md` → ≥ 7, com os 7 títulos do Step 2 presentes literalmente
- [ ] `grep -n "handoff_created" docs/product/funil-canonico-de-medicao.md` → ≥ 1 match
- [ ] `grep -n "AIChatPanel" docs/product/funil-canonico-de-medicao.md` → ≥ 1 match (o gap central está documentado com file path)
- [ ] `git status --porcelain` limpo fora de `docs/product/` e `plans/`
- [ ] `pnpm typecheck` exit 0
- [ ] Linha do plano 020 atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Alguma afirmação do "Current state" não confere no Step 1 (ex.:
  `AIChatPanel.tsx` já ganhou um push de dataLayer no ramo do `budgetLink` —
  nesse caso parte da spec já foi implementada por outra via e o plano precisa
  ser re-baselined).
- Você se pegar editando um `.ts`/`.tsx` — este plano não instrumenta nada.
- Já existir um doc equivalente em `docs/product/` (procurar por
  `funil`/`funnel` antes de criar) — reconciliar em vez de duplicar.

## Maintenance notes

- Quando a instrumentação da seção 6 da spec for implementada (plano futuro),
  cada evento novo deve nascer com teste em `tests/` no padrão de
  `tests/form-analytics.test.ts`.
- O plano 019, ao ser executado, cria os campos de correlação no Odoo — a spec
  deve ser atualizada (uma linha) quando `x_ga_client_id`/`x_gclid` saírem de
  "proposto" para "existente".
- O A/B test quiz→chat (`docs/product/quiz-to-chatbot-funnel-spike.md`)
  permanece bloqueado até a lacuna `handoff_created` ser implementada — a spec
  é o pré-requisito, não a resolução.
