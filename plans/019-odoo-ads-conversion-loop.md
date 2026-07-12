# Plan 019: Fechar o loop de conversão Odoo → Google/Meta (parte executável no repo)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f5e4324..HEAD -- api/purchase-dispatch.ts lib/odoo-lead-mapping.ts lib/odoo-submit-handler.ts lib/conversions/ tests/purchase-dispatch.test.ts tests/odoo-lead-mapping.test.ts .env.example docs/product/odoo-ads-conversion-decision.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (toca o caminho de criação de lead no Odoo — mitigado por flag default-off)
- **Depends on**: none (mas tem **gates externos** que bloqueiam a *ativação*, não a implementação — ver "Gates externos")
- **Category**: direction
- **Planned at**: commit `f5e4324`, 2026-07-12

## Why this matters

Quando uma oportunidade vira "Ganho" no Odoo, nada hoje reenvia essa conversão
para o Google e para a Meta — o algoritmo de lance otimiza por quem preenche
formulário, não por quem vira receita. A infraestrutura de dispatch já existe e
funciona (`api/purchase-dispatch.ts` + `lib/conversions/{google,meta}.ts`), mas
ficou **órfã** após o cut-over do CRM para o Odoo (jun/2026): nenhum gatilho a
aciona. A arquitetura completa já foi decidida e documentada em
`docs/product/odoo-ads-conversion-decision.md` — este plano implementa **apenas
a parte que vive no repo** (Fases 1 [lado repo], 3a e o ajuste de payload da
Fase 2), preservando todos os gates externos e de compliance daquele documento.

**Este plano NÃO ativa nenhum disparo real.** Ele deixa o código pronto atrás
de flags default-off, para que a ativação aconteça só depois dos gates externos
(campos no Odoo, revisão DPO/RIPD, fase de sombra).

## Current state

Arquivos relevantes:

- `docs/product/odoo-ads-conversion-decision.md` — a decisão de arquitetura. **Leia o documento inteiro antes do Step 1.** Este plano implementa as "Fatias de implementação" 1 (lado repo), 2 (ajuste de payload) e 3a dele.
- `api/purchase-dispatch.ts` — endpoint que recebe eventos de conversão (autentica por `X-Webhook-Secret` contra `N8N_WEBHOOK_SECRET`), dispara GA4 MP + Meta CAPI em paralelo, retorna `mode: full/partial/failed`. Hoje **não tem kill switch**.
- `lib/conversions/google.ts` — GA4 Measurement Protocol (envs `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`). Não mudar.
- `lib/conversions/meta.ts` — Meta CAPI (envs `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `META_TEST_EVENT_CODE` para fase de sombra). Já usa `deduplicationId` como `event_id` do payload. Não mudar.
- `lib/odoo-lead-mapping.ts` — mapeamento puro form → `res.partner`/`crm.lead`. Hoje os click IDs vão **só como texto** dentro do HTML de `description` (`buildDescriptionHtml`), inacessíveis para automações do Odoo.
- `lib/odoo-submit-handler.ts` — orquestra `openOdooSession` → `upsertPartner` → `createLead`; é onde `buildLeadFields` é chamado (linhas 87–88) e onde uma leitura de env fica no boundary certo.
- `tests/purchase-dispatch.test.ts` — padrão de teste do handler (salva/restaura `process.env`, mocka `global.fetch`, monta `Request` com header de secret). Modelar os novos testes nele.
- `tests/odoo-lead-mapping.test.ts` — testes do mapeamento puro.

### Excerto 1 — fluxo do handler (`api/purchase-dispatch.ts:411-447`)

```ts
export default async function handler(request: Request): Promise<Response> {
  const requestId = createRequestId();
  const methodError = validateRequestMethod(request, requestId);
  if (methodError) {
    return methodError;
  }

  const authError = validateAuthorization(request, requestId);
  if (authError) {
    return authError;
  }
  // ... rate limit → parse → dispatchConversion(payload, requestId)
```

### Excerto 2 — deduplicationId hoje (`api/purchase-dispatch.ts:187-198`)

```ts
  let deduplicationId: string;

  if (eventType === 'lead_qualificado') {
    if (!attributionKey) {
      return { error: 'Missing attributionKey' };
    }
    deduplicationId = attributionKey;
  } else if (!dealId) {
    return { error: 'Missing dealId' };
  } else {
    deduplicationId = dealId;
  }
```

Para `purchase`, o id de dedup é o `dealId` cru. A decisão (§4 do doc) exige o
identificador determinístico **`purchase_{dealId}`** para idempotência do
disparo no Meta.

### Excerto 3 — buildLeadFields hoje (`lib/odoo-lead-mapping.ts:195-222`)

```ts
export function buildLeadFields(input: OdooLeadInput, partnerId: number, idempotencyKey?: string): Record<string, unknown> {
    // ...
    if (input.email) fields.email_from = input.email;
    if (input.phone) fields.phone = input.phone;
    if (input.referred) fields.referred = input.referred;
    if (input.empresa) fields.partner_name = input.empresa;
    if (input.cargo) fields.function = input.cargo;
    if (input.destination) fields.x_destino = input.destination;

    const description = buildDescriptionHtml(input, idempotencyKey);
    if (description) fields.description = description;

    return fields;
}
```

`x_destino` é o exemplar do padrão a seguir (campo Studio custom já criado no
Odoo, escrito condicionalmente). O tracking (`input.tracking`: `gclid`,
`fbclid`, `fbp`, `fbc`, `cid`, `sid`) hoje só aparece em `buildDescriptionHtml`.

### Excerto 4 — call site do mapeamento (`lib/odoo-submit-handler.ts:87-88`)

```ts
        const idempotencyKey = await resolveIdempotencyKey(input);
        const leadFields = buildLeadFields(input, partnerId, idempotencyKey);
```

### Convenções do repo que se aplicam

- Handlers seguem a ordem method gate → CORS → config → parse → validação →
  rate limit → orquestração → resposta estruturada (`docs/standards/api-conventions.md`).
  O kill switch é um "configuration check" e entra **depois** da autenticação
  (não vazar o estado da flag para chamadores não autenticados).
- Leitura de `process.env` fica perto do boundary de configuração — seguir o
  padrão de `getExpectedSecret()` em `api/purchase-dispatch.ts:138-143`.
- `lib/odoo-lead-mapping.ts` é **puro** (sem env, sem I/O) — a flag de env é
  lida no `lib/odoo-submit-handler.ts` e passada como opção.
- Testes: `node:test` + `assert/strict`, mock de `global.fetch`, salvar e
  restaurar env (ver `tests/purchase-dispatch.test.ts:5-36`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Testes do handler | `tsx --test tests/purchase-dispatch.test.ts` | all pass |
| Testes do mapeamento | `tsx --test tests/odoo-lead-mapping.test.ts` | all pass |
| Regressão completa | `pnpm test:regression` | all pass |
| Lint (ratchet CI) | `pnpm lint:changed` | exit 0 |

## Scope

**In scope** (únicos arquivos a modificar/criar):
- `api/purchase-dispatch.ts`
- `lib/odoo-lead-mapping.ts`
- `lib/odoo-submit-handler.ts`
- `tests/purchase-dispatch.test.ts`
- `tests/odoo-lead-mapping.test.ts`
- `.env.example`
- `docs/ops/conversion-dispatch-runbook.md` (criar)
- `docs/product/odoo-ads-conversion-decision.md` (só a linha de Status no topo)
- `plans/README.md` (linha de status)

**Out of scope** (NÃO tocar, mesmo parecendo relacionado):
- `lib/conversions/google.ts` e `lib/conversions/meta.ts` — já suportam tudo
  que este plano precisa (`deduplicationId`, `META_TEST_EVENT_CODE`).
- A Automated Action / Server Action no Odoo — é configuração externa (Fase 2
  do doc), não vive no repo.
- Migração para Offline Conversion Import nativo do Google (Fase 3b) — condicional,
  só após reconciliação provar necessidade.
- `msclkid`/`ttclid`/`wbraid`/`gbraid` (Fase 4) — condicional a confirmação de
  campanha ativa; não mapear.
- O esquema de autenticação do endpoint (`X-Webhook-Secret`) — decidido no doc.
- Qualquer verificação de consentimento no repo: o gate de `x_lgpd_consent`
  (§7 do doc) atravessa `partner_id` e vive na automação do Odoo, não aqui.

## Git workflow

- Branch: `feature/019-odoo-ads-conversion-loop`
- Conventional commits (ex.: `feat(conversions): add PURCHASE_DISPATCH_ENABLED kill switch`)
- Abrir PR draft ao final; **merge é sempre humano** (squash). CI `build-and-test` precisa passar.

## Steps

### Step 1: Kill switch `PURCHASE_DISPATCH_ENABLED` no handler (Fase 3a)

Em `api/purchase-dispatch.ts`:

1. Adicionar um helper no padrão de `getExpectedSecret()`:

   ```ts
   function isDispatchEnabled(): boolean {
     const raw = typeof process.env.PURCHASE_DISPATCH_ENABLED === 'string'
       ? process.env.PURCHASE_DISPATCH_ENABLED.trim().toLowerCase()
       : '';
     // Default true: ausência da env não desliga o endpoint (decisão §6 do doc).
     return raw !== 'false' && raw !== '0';
   }
   ```

2. No `handler`, **depois** de `validateAuthorization` e **antes** de
   `enforceRateLimit`, retornar 503 quando desligado:

   ```ts
   if (!isDispatchEnabled()) {
     emitConversionLog('warn', requestId, 'dispatch_disabled');
     return buildJsonResponse(
       { ok: false, requestId, code: 'DISPATCH_DISABLED', error: 'Conversion dispatch disabled' },
       503,
     );
   }
   ```

   Racional da posição: chamador não autenticado não descobre o estado da flag;
   e a automação do Odoo recebe erro ≥500, grava `failed` e o job de
   reconciliação reprocessa depois (comportamento de rollback do §8 do doc).

**Verify**: `tsx --test tests/purchase-dispatch.test.ts` → all pass (os testes
existentes não setam a env, e o default é ligado).

### Step 2: Identificador determinístico `purchase_{dealId}` (§4 do doc)

Em `normalizePayload` (`api/purchase-dispatch.ts`), no ramo em que
`eventType === 'purchase'`, derivar o id de dedup com o prefixo determinístico
em vez do `dealId` cru:

```ts
  } else {
    deduplicationId = eventType === 'purchase' ? `purchase_${dealId}` : dealId;
  }
```

Isso garante a decisão do §4 (idempotência de reexecuções no Meta) **no código
que controlamos**, independente de como a automação do Odoo montar o payload —
ela só precisa mandar `dealId`. `close_convert_lead` mantém o comportamento
atual. O mesmo valor vira `transaction_id` no GA4 (via `transactionId`), o que
também é desejável para dedup lá.

**Verify**: `tsx --test tests/purchase-dispatch.test.ts` → all pass **após** o
Step 5 adicionar/ajustar as asserções (se algum teste existente assertar o
`deduplicationId` de purchase como `dealId` cru, ajustá-lo faz parte deste
passo — é mudança de contrato intencional num endpoint hoje órfão, sem
chamadores em produção).

### Step 3: Campos estruturados de tracking no `crm.lead`, atrás de flag default-off (Fase 1, lado repo)

**Contexto crítico**: escrever um campo inexistente num `create` do Odoo faz o
JSON-RPC falhar — e derrubaria os formulários de lead/contato em produção. Os
campos `x_gclid` etc. **ainda não existem** no Odoo (gate externo). Por isso a
escrita fica atrás de `ODOO_CONVERSION_FIELDS_ENABLED` (default **off**).

1. Em `lib/odoo-lead-mapping.ts`, estender a assinatura de `buildLeadFields`
   com um parâmetro opcional (mantendo o módulo puro):

   ```ts
   export interface BuildLeadFieldsOptions {
     /**
      * Escreve os campos estruturados de tracking (x_gclid, x_fbclid, x_fbc,
      * x_fbp, x_ga_client_id, x_ga_session_id) exigidos pela automação de
      * conversão Odoo→Ads (docs/product/odoo-ads-conversion-decision.md §1).
      * Default false: os campos custom precisam existir na instância Odoo
      * antes — escrever campo inexistente derruba o create via JSON-RPC.
      */
     includeConversionFields?: boolean;
   }

   export function buildLeadFields(
     input: OdooLeadInput,
     partnerId: number,
     idempotencyKey?: string,
     options: BuildLeadFieldsOptions = {},
   ): Record<string, unknown> {
   ```

2. Dentro da função, após o bloco de `x_destino`, adicionar (mesmo padrão
   condicional dos campos existentes):

   ```ts
   if (options.includeConversionFields) {
       const t = input.tracking;
       if (t?.gclid) fields.x_gclid = t.gclid;
       if (t?.fbclid) fields.x_fbclid = t.fbclid;
       if (t?.fbc) fields.x_fbc = t.fbc;
       if (t?.fbp) fields.x_fbp = t.fbp;
       if (t?.cid) fields.x_ga_client_id = t.cid;
       if (t?.sid) fields.x_ga_session_id = t.sid;
   }
   ```

   **Não** escrever `x_event_id`, `x_conversion_dispatch_status` nem
   `x_conversion_dispatch_attempts`: pelo §4 do doc, esses são gravados pela
   automação do Odoo no primeiro disparo, não pelo site na entrada do lead.
   As linhas correspondentes em `buildDescriptionHtml` **permanecem** (a
   descrição continua sendo o registro legível por humanos).

3. Em `lib/odoo-submit-handler.ts`, ler a env uma vez perto do call site e
   passar a opção (padrão: env access no boundary de configuração):

   ```ts
   const includeConversionFields = process.env.ODOO_CONVERSION_FIELDS_ENABLED === 'true';
   const leadFields = buildLeadFields(input, partnerId, idempotencyKey, { includeConversionFields });
   ```

**Verify**: `tsx --test tests/odoo-lead-mapping.test.ts` → all pass (testes
existentes chamam sem `options` e nada muda no output default).

### Step 4: `.env.example` + runbook de reconciliação (Fase 3a)

1. Em `.env.example`, no bloco de conversões/n8n, adicionar com comentários:

   ```bash
   # Conversões offline (Odoo → Google/Meta) — ver docs/product/odoo-ads-conversion-decision.md
   PURCHASE_DISPATCH_ENABLED=     # 'false' desliga /api/purchase-dispatch (kill switch; default: ligado)
   ODOO_CONVERSION_FIELDS_ENABLED=  # 'true' só depois dos campos x_gclid/x_fbclid/... existirem no Odoo
   ```

2. Criar `docs/ops/conversion-dispatch-runbook.md` com, no mínimo, estas
   seções (conteúdo vem das §§5–6 e 8 do doc de decisão — transcrever as
   regras, não inventar novas):
   - `## Reconciliação semanal` — comparar contagem/valor de `crm.lead` Ganho
     vs. eventos Purchase no Meta Events Manager e conversões GA4; variância
     aceitável ≤5%; acima disso, investigar `x_conversion_dispatch_status = 'failed'`.
   - `## Retry` — reprocessar `status = 'failed' AND attempts < 5` com backoff
     (1h, 4h, 12h, 24h); `attempts >= 5` → investigação manual (reenvio direto
     ao endpoint com o `dealId`).
   - `## Kill switch / rollback` — `PURCHASE_DISPATCH_ENABLED=false` no
     dashboard do Cloudflare Pages; automação do Odoo continua gravando
     `failed`; ao religar, a reconciliação reprocessa o backlog.
   - `## Fase de sombra` — `META_TEST_EVENT_CODE` + GA4 DebugView; critério de
     saída: 10 oportunidades Ganhas consecutivas com `mode: full`.
   - `## Checklist de ativação (gates externos)` — a lista da seção "Gates
     externos" deste plano, como checkboxes.

3. Em `docs/product/odoo-ads-conversion-decision.md`, atualizar só a linha de
   Status do topo para: `**Status:** decisão de arquitetura tomada; parte
   repo implementada (plans/019) atrás de flags — ativação pendente dos gates
   externos.`

**Verify**: `ls docs/ops/conversion-dispatch-runbook.md` → existe;
`grep -c "PURCHASE_DISPATCH_ENABLED" .env.example` → `1`.

### Step 5: Testes

Ver "Test plan" abaixo. Escrever os testes e rodar a suíte completa.

**Verify**: `pnpm test:regression` → all pass; `pnpm typecheck` → exit 0;
`pnpm lint:changed` → exit 0.

## Test plan

Em `tests/purchase-dispatch.test.ts` (modelar nos testes existentes do arquivo
— mesmo save/restore de env e mock de fetch):

1. **Kill switch desligado**: com `PURCHASE_DISPATCH_ENABLED='false'` e secret
   válido → 503, body com `code: 'DISPATCH_DISABLED'`, e `global.fetch` de
   provedores **não** chamado.
2. **Kill switch não vaza para não autenticado**: `PURCHASE_DISPATCH_ENABLED='false'`
   + secret errado → 401 (não 503).
3. **Default ligado**: env ausente → comportamento atual preservado (200/`mode: full`
   no caminho feliz já testado).
4. **Id determinístico**: payload `eventType: 'purchase', dealId: '123'` →
   o payload enviado ao Meta (capturado no mock de fetch) tem
   `event_id: 'purchase_123'` e o do GA4 tem `transaction_id: 'purchase_123'`;
   `eventType: 'close_convert_lead', dealId: '123'` mantém `'123'`.

Em `tests/odoo-lead-mapping.test.ts` (modelar nos testes existentes do arquivo):

5. **Flag off (default)**: `buildLeadFields(input, 1, 'k')` com tracking
   completo → resultado **não** contém nenhuma chave `x_gclid`/`x_fbclid`/
   `x_fbc`/`x_fbp`/`x_ga_client_id`/`x_ga_session_id`.
6. **Flag on**: `{ includeConversionFields: true }` com tracking completo →
   as seis chaves presentes com os valores do tracking; campos de tracking
   ausentes/vazios não geram chave.
7. **Descrição intacta**: com flag on, `description` continua contendo as
   linhas `gclid:`/`fbclid:` de `buildDescriptionHtml` (sem regressão).

Verification: `pnpm test:regression` → all pass, incluindo os 7 novos casos.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:regression` exit 0, incluindo os novos testes dos Steps 1–3
- [ ] `pnpm lint:changed` exit 0
- [ ] `grep -n "PURCHASE_DISPATCH_ENABLED" api/purchase-dispatch.ts` → ≥1 match
- [ ] `grep -n "purchase_" api/purchase-dispatch.ts` → contém a derivação `purchase_${dealId}`
- [ ] `grep -n "includeConversionFields" lib/odoo-lead-mapping.ts lib/odoo-submit-handler.ts` → match nos dois arquivos
- [ ] `grep -c "x_event_id" lib/odoo-lead-mapping.ts` → `0` (não é escrito pelo site)
- [ ] `docs/ops/conversion-dispatch-runbook.md` existe com as 5 seções do Step 4
- [ ] `git status` não mostra arquivos modificados fora do escopo
- [ ] Linha do plano 019 atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não batem com o código (drift desde `f5e4324`).
- Algum teste existente de `tests/purchase-dispatch.test.ts` falhar por motivo
  **diferente** do id determinístico do Step 2 após duas tentativas de ajuste.
- Você se sentir tentado a ligar `ODOO_CONVERSION_FIELDS_ENABLED` ou
  configurar secrets/dashboard — isso é ativação, e ativação é bloqueada
  pelos gates externos abaixo. Este plano termina com tudo default-off.
- Descobrir que `buildLeadFields` ganhou outro call site além de
  `lib/odoo-submit-handler.ts` (verificar com `grep -rn "buildLeadFields(" --include="*.ts" | grep -v test`).

## Gates externos (bloqueiam a ATIVAÇÃO, não este plano)

Transcritos do doc de decisão — ficam como checklist no runbook (Step 4):

1. **Campos custom no Odoo** (`x_gclid`, `x_fbclid`, `x_fbc`, `x_fbp`,
   `x_ga_client_id`, `x_ga_session_id`, `x_event_id`,
   `x_conversion_dispatch_status`, `x_conversion_dispatch_attempts`) — acesso
   Studio/admin. Só então `ODOO_CONVERSION_FIELDS_ENABLED=true`.
2. **RIPD atualizado + confirmação do DPO** sobre a base legal do reenvio de
   PII hasheada e identificadores de clique (§7 do doc) — **nenhum disparo
   real antes disso**.
3. **Automated Action no Odoo validada** (Server Action com HTTP custom, ou
   "Send Webhook Notification" nativo; fallback: polling n8n) — §2 do doc.
4. **Fase de sombra concluída** (`META_TEST_EVENT_CODE` + DebugView, 10
   Ganhos consecutivos `mode: full`) — §8 do doc.
5. Confirmar campo de valor monetário da oportunidade Ganha, e link GA4↔Ads
   ativo com evento marcado como conversão — §§3 e 5 do doc.

## Maintenance notes

- O contrato do payload da automação Odoo → `/api/purchase-dispatch` é:
  `{ eventType: 'purchase', dealId, value, currency, email?, phone?, firstName?, lastName?, gclid?, fbclid?, fbc?, fbp?, gaClientId?, gaSessionId? }`
  com header `X-Webhook-Secret`. O handler deriva o `event_id` determinístico;
  a automação não precisa (nem deve) gerar ids aleatórios.
- Quando `ODOO_CONVERSION_FIELDS_ENABLED` estiver ligada há tempo suficiente e
  estável, considerar remover a flag e tornar a escrita incondicional (issue
  própria, não rider).
- Revisor deve escrutinar: posição do kill switch (depois do auth), e que
  nenhum campo `x_*` novo é escrito com a flag off.
- Follow-ups explicitamente fora deste plano: Fase 3b (Offline Conversion
  Import nativo do Google — condicional à reconciliação) e Fase 4
  (Microsoft/TikTok — condicional a campanha ativa confirmada).
