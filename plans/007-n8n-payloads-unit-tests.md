# Plan 007: Testes unitários diretos para os builders de payload do n8n

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 68eecf6..HEAD -- lib/n8n-payloads.ts tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `68eecf6`, 2026-06-12

## Why this matters

`lib/n8n-payloads.ts` (~274 linhas) é a camada que **molda toda a saída de
leads** enviada ao n8n → Salesforce: mapeia BANT, destino, UTMs e click IDs nos
payloads de lead, contato, waitlist, quiz e NPS. Hoje esses builders só são
exercidos **indiretamente** via testes de handler (`tests/submit-lead.test.ts`,
`tests/submit-quiz.test.ts`) e via `tests/n8n-service.test.ts` (que testa o
transporte). Não há teste que fixe o **contrato de shape** de cada builder.

Consequência: uma regressão no mapeamento (campo UTM trocado, fallback `?? null`
removido, `extras` perdido) pode passar despercebida porque o teste de handler
mocka a rede e frequentemente só verifica o status HTTP, não cada campo do
payload. Como leads são o ativo de conversão do negócio, perder UTM/atribuição
silenciosamente custa dinheiro de mídia. Testes unitários diretos dos builders
são baratos (funções puras, sem I/O) e travam o contrato.

## Current state

Funções exportadas em `lib/n8n-payloads.ts` (confirme assinaturas antes de
testar com `grep -n "^export function" lib/n8n-payloads.ts`):

- `buildN8nLeadPayload(payload, requestId, context = {})` (`:134`) — retorna
  `{ requestId, source: 'submit-lead', lead: {...}, utms, tracking, meta }`.
  - `lead` inclui `firstName, lastName, email, whatsapp, eventId (?? null),
    bantSummary, destination`.
  - `tracking` vem de `buildLeadTracking(payload)` (helper interno no mesmo
    arquivo — leia-o para saber os campos esperados).
  - `meta.clientIpAddress`/`clientUserAgent` vêm de `context` via
    `normalizeContextValue` (string vazia/whitespace → `null`).
- `buildN8nContactPayload(payload, requestId)` (`:161`) — `source:
  'submit-contact'`; o objeto `tracking` faz fallback campo-a-campo:
  `payload.tracking?.utm_source ?? payload.utms.utm_source`, e usa
  `toNullableTrackingValue(...)` para os click IDs (`cid, sid, gclid, fbclid,
  msclkid, ttclid, wbraid, gbraid, fbc, fbp`); `extras` default `{}`.
- `buildN8nWaitlistPayload(payload, requestId)` (`:201`) — `source:
  'submit-waitlist'`.
- `buildN8nQuizPayload(payload, requestId)` (`:241`) — `source: 'submit-quiz'`.
- `buildN8nNpsPayload(...)` (procure a assinatura exata, ~`:266+`).

Helpers internos relevantes (não exportados, mas seu comportamento é o que você
verifica via output): `normalizeContextValue`, `toNullableTrackingValue`,
`buildLeadTracking`. **Leia o arquivo inteiro antes de escrever os asserts** —
os tipos `SubmitLeadRequest`, `SubmitContactRequest`, etc. vêm de `types/` e
`lib/schemas/`; construa fixtures válidas a partir desses tipos.

Padrão de teste do repo: `node:test` + `assert/strict`, arquivos
`tests/*.test.ts` rodados via `tsx --test`. Veja `tests/submit-quiz.test.ts`
(que já importa de `lib/n8n-payloads` indiretamente) e `tests/lib-lead-logic.test.ts`
como modelos estruturais para fixtures e asserts de shape.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Listar exports | `grep -n "^export function" lib/n8n-payloads.ts` | mostra os builders |
| Typecheck | `pnpm typecheck` | exit 0 |
| Teste isolado | `tsx --test tests/lib-n8n-payloads.test.ts` | todos passam |
| Suíte completa | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `tests/lib-n8n-payloads.test.ts` (novo) — testes unitários dos builders.

**Out of scope** (NÃO tocar):
- `lib/n8n-payloads.ts` — este é um plano **somente de testes**. Se um teste
  revelar um bug real no builder, NÃO conserte aqui: registre na seção STOP e
  reporte (vira um plano separado de correção). A exceção é se o "bug" for na
  verdade um mal-entendido seu sobre o contrato — então ajuste o teste.
- Handlers em `api/`, `services/n8n.ts` — fora de escopo.

## Git workflow

- Branch: `test/007-n8n-payloads-unit-tests`
- Commit convencional, ex.: `test(leads): cobrir builders de payload do n8n`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Ler o módulo e montar fixtures válidas

Leia `lib/n8n-payloads.ts` inteiro e os tipos de request importados. Crie
fixtures mínimas válidas para cada tipo de request (lead, contact, waitlist,
quiz, nps) — use valores reconhecíveis (ex.: `utm_source: 'google'`,
`gclid: 'abc123'`) para que asserts de mapeamento sejam legíveis.

**Verify**: `pnpm typecheck` → exit 0 (as fixtures devem satisfazer os tipos).

### Step 2: Escrever os testes de contrato

Para cada builder, asserts cobrindo (ver "Test plan" para a lista completa):
shape de topo (`source`, `requestId`), mapeamento de campos do lead/contato,
fallback de UTM (contact), normalização de nulos (context vazio → `null`,
click ID vazio → `null`), e `extras` default `{}`.

**Verify**: `tsx --test tests/lib-n8n-payloads.test.ts` → todos passam.

### Step 3: Suíte completa

**Verify**: `pnpm test:regression` → exit 0.

## Test plan

`tests/lib-n8n-payloads.test.ts` (`node:test` + `assert/strict`). Cobertura
mínima por builder:

**`buildN8nLeadPayload`**:
- `source === 'submit-lead'` e `requestId` ecoado.
- `lead.eventId === null` quando `payload.event_id` ausente; igual ao valor
  quando presente.
- `lead.bantSummary` e `lead.destination` repassados intactos.
- `meta.clientIpAddress === null` quando `context` é `{}`; igual ao IP quando
  `context.clientIpAddress` é uma string não-vazia; `null` quando é `'   '`
  (whitespace).
- `utms` repassado intacto.

**`buildN8nContactPayload`**:
- `source === 'submit-contact'`.
- Fallback de UTM: com `payload.tracking?.utm_source` definido, o output usa
  esse valor; sem ele, usa `payload.utms.utm_source`.
- Click ID vazio/whitespace → `null` (ex.: `gclid: ''` → `tracking.gclid ===
  null`); click ID válido ecoa.
- `tracking.extras === {}` quando `payload.tracking?.extras` ausente.
- `contact.lastName === null` / `email === null` quando ausentes (opcionais).

**`buildN8nWaitlistPayload`**, **`buildN8nQuizPayload`**, **`buildN8nNpsPayload`**:
- `source` correto em cada um.
- Pelo menos um assert de mapeamento de campo característico de cada (ex.: para
  quiz, o resultado/perfil; para nps, a nota) — leia o builder para saber quais
  campos verificar.

Sem rede, sem mocks de provider (são funções puras).

## Done criteria

- [ ] `pnpm typecheck` exit 0
- [ ] `tsx --test tests/lib-n8n-payloads.test.ts` → todos passam
- [ ] `pnpm test:regression` exit 0
- [ ] Cada builder exportado tem ≥1 teste de `source` + ≥1 teste de mapeamento
- [ ] `git status` mostra apenas `tests/lib-n8n-payloads.test.ts`
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se um teste expuser um **bug real de mapeamento** no builder (campo perdido,
  UTM trocado), NÃO conserte o builder neste plano — registre o achado e reporte
  para virar um plano de correção dedicado com seu próprio teste de regressão.
- Se as assinaturas exportadas divergirem dos excertos de "Current state", PARE
  (drift) e reconcilie contra o código vivo.
- Se algum tipo de request não tiver um builder correspondente (ou vice-versa),
  reporte — pode indicar código morto ou um fluxo sem cobertura.

## Maintenance notes

- Sempre que um novo click ID ou campo UTM for adicionado ao funil de tracking,
  estes testes devem ganhar um assert correspondente — eles são a rede de
  segurança da atribuição de leads.
- Revisor: confirmar que as fixtures usam os tipos reais de `types/`/`lib/schemas/`
  e não `any`, para que mudanças de tipo quebrem o teste em compile-time.
