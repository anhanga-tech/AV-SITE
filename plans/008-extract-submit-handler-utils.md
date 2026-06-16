# Plan 008: Extrair helper de resposta JSON compartilhado dos handlers submit-* para lib/

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 68eecf6..HEAD -- api/submit-lead.ts api/submit-contact.ts api/submit-nps.ts api/submit-quiz.ts api/submit-waitlist.ts api/submit-lead-sf.ts lib/network.ts tests/network.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: 007 (DONE — testes dos builders dão rede de segurança extra)
- **Category**: tech-debt
- **Planned at**: commit `68eecf6`, 2026-06-12
- **Reconciled**: 2026-06-12 — a premissa original ("6 handlers quase idênticos")
  estava errada; há **4 variantes** de `buildJsonResponse`. Design do helper
  ajustado para preservar o comportamento exato de cada handler (decisão do
  operador: helper flexível, sem mudança observável).

## Why this matters

Seis handlers `submit-*` (`submit-lead`, `submit-contact`, `submit-nps`,
`submit-quiz`, `submit-waitlist`, `submit-lead-sf`) cada um define localmente um
`buildJsonResponse(body, status, corsHeaders)`. Mudar o shape da resposta, a
política de CORS ou a forma de propagar o request ID exige editar 6 arquivos.
Consolidar num único helper em `lib/network.ts` dá uma fonte de verdade.

Esta é uma extração de **um único helper de resposta** — deliberadamente
conservadora. NÃO é reescrita do pipeline dos handlers nem unificação do
rate-limit (janelas/limites por endpoint são intencionais e ficam locais).

## Current state — ATENÇÃO: são 4 variantes, não 1

As implementações locais **divergem** no tratamento do header `X-Request-Id`.
Confirme com `for f in submit-contact submit-lead submit-quiz submit-waitlist submit-nps submit-lead-sf; do echo "== $f =="; awk '/function buildJsonResponse/{p=1} p{print} p&&/^}/{exit}' api/$f.ts; done`.

1. **`submit-contact` (`:40`) e `submit-lead` (`:50`)** — header **condicional**,
   derivado de `body.requestId` quando é string:
   ```ts
   const requestId =
       'requestId' in body && typeof body.requestId === 'string' ? body.requestId : undefined;
   // headers: { 'Content-Type': 'application/json', ...(requestId ? {'X-Request-Id': requestId} : {}), ...corsHeaders }
   ```
2. **`submit-quiz` (`:49`) e `submit-waitlist` (`:28`)** — header **incondicional**:
   ```ts
   headers: { 'Content-Type': 'application/json', 'X-Request-Id': body.requestId, ...corsHeaders }
   ```
   (Na prática `body.requestId` é sempre uma string nesses fluxos.)
3. **`submit-nps` (`:18`)** — recebe `requestId` como **4º parâmetro**, header
   condicional sobre ele. (O body do nps também contém `requestId` em todas as
   chamadas, então auto-derivar do body produz o mesmo resultado.)
4. **`submit-lead-sf` (`:29`)** — **NÃO emite `X-Request-Id`**, apenas
   `Content-Type` + `corsHeaders`. Importante: o body do lead-sf **contém**
   `requestId` em todas as chamadas, mas o header é omitido de propósito. Um
   helper auto-derivado adicionaria um header que hoje não existe — por isso o
   lead-sf precisa **suprimir** explicitamente.

`lib/network.ts` já é o lar de helpers cross-cutting (`buildCorsHeaders`,
`getClientIP`, `createRequestId`, `buildJsonError`) — é onde o novo
`buildJsonResponse` deve morar (named export). `tests/network.test.ts` já existe.

Convenções (`.claude/rules/api-conventions.md`): handlers orquestram, helpers
compartilhados vivem em `lib/`; respostas JSON com status explícito e
`Content-Type: application/json`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Mapear duplicação | `grep -n "function buildJsonResponse" api/submit-*.ts` | 6 ocorrências |
| Comparar variantes | (o `for ... awk` da seção acima) | ver os 4 corpos |
| Typecheck | `pnpm typecheck` | exit 0 |
| Teste de rede | `pnpm exec tsx --test tests/network.test.ts` | passa |
| Testes de handler | `pnpm exec tsx --test tests/submit-lead.test.ts tests/submit-quiz.test.ts` | passam |
| Suíte completa | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- Novo `buildJsonResponse` (named export) em `lib/network.ts` com assinatura
  flexível (ver Step 1).
- Refatorar os 6 handlers `submit-*` para usá-lo, **preservando exatamente** o
  comportamento atual de cada um (incl. o lead-sf sem header).
- `tests/network.test.ts` — adicionar cobertura para os 3 modos do helper.

**Out of scope** (NÃO tocar):
- **Não** unificar constantes de rate-limit (diferenças intencionais, ficam locais).
- **Não** alterar lógica de classificação de erro de cada handler
  (`classifySubmitLeadError`, mapeamentos `N8N_WEBHOOK_ERROR:...`).
- **Não** "consertar" a inconsistência do lead-sf emitindo o header — a decisão é
  **preservar** o comportamento atual. Se achar que o lead-sf deveria emitir,
  registre como follow-up; não mude aqui.
- Handlers não-`submit-*` (`generate`, `purchase-dispatch`, `markdown`, etc.).
- `functions/` (adaptadores Cloudflare) — importam de `api/`, não mudam.

## Git workflow

- Branch: `refactor/008-submit-handler-response-helper`
- Commit convencional, ex.: `refactor(api): extrair helper de resposta JSON dos handlers submit-*`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Criar o helper flexível

Em `lib/network.ts` adicione (named export):

```ts
/**
 * Resposta JSON padrão dos handlers. O header X-Request-Id é resolvido assim:
 * - options.requestId === null  → suprime o header (ex.: submit-lead-sf).
 * - options.requestId é string  → usa esse valor.
 * - options.requestId ausente   → auto-deriva de body.requestId (se string).
 */
export function buildJsonResponse(
    body: unknown,
    status: number,
    corsHeaders: Record<string, string>,
    options: { requestId?: string | null } = {},
): Response {
    let requestId: string | undefined;
    if (options.requestId === null) {
        requestId = undefined;
    } else if (typeof options.requestId === 'string') {
        requestId = options.requestId;
    } else if (
        body !== null &&
        typeof body === 'object' &&
        'requestId' in body &&
        typeof (body as { requestId?: unknown }).requestId === 'string'
    ) {
        requestId = (body as { requestId: string }).requestId;
    }

    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...(requestId ? { 'X-Request-Id': requestId } : {}),
            ...corsHeaders,
        },
    });
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Testes do helper (antes de migrar handlers)

Em `tests/network.test.ts`, adicione casos para `buildJsonResponse` (ver "Test
plan"). Rode-os contra o helper novo isoladamente.

**Verify**: `pnpm exec tsx --test tests/network.test.ts` → passa.

### Step 3: Migrar os handlers, um a um, com mapeamento explícito

Para cada handler: remover a função local `buildJsonResponse`, importar de
`../lib/network`, e ajustar as call sites conforme a tabela. Rode o teste do
handler **depois de cada um** (descubra o arquivo com `ls tests/ | grep <nome>`).
NÃO migre os 6 de uma vez.

| Handler | Como chamar | Por quê |
|---|---|---|
| `submit-contact` | `buildJsonResponse(body, status, corsHeaders)` | auto-deriva do body (= condicional atual) |
| `submit-lead` | `buildJsonResponse(body, status, corsHeaders)` | idem |
| `submit-quiz` | `buildJsonResponse(body, status, corsHeaders)` | body.requestId sempre presente → header sempre emitido (= incondicional atual) |
| `submit-waitlist` | `buildJsonResponse(body, status, corsHeaders)` | idem quiz |
| `submit-nps` | `buildJsonResponse(body, status, corsHeaders)` | body do nps contém requestId → auto-deriva o mesmo header; remova o 4º parâmetro nas call sites |
| `submit-lead-sf` | `buildJsonResponse(body, status, corsHeaders, { requestId: null })` | **suprime** o header para preservar o comportamento sem X-Request-Id |

Atenção lead-sf: o body dele tem `requestId`, então **esquecer** o
`{ requestId: null }` adicionaria um header novo — isso é uma regressão e o teste
do lead-sf (se cobrir headers) deve pegá-la. Confira `tests/` por um teste de
lead-sf antes; se não houver cobertura de header, verifique manualmente que a
resposta não traz `X-Request-Id` (ex.: um assert temporário no teste de rede não
conta — confirme no handler).

**Verify após cada handler**: o teste correspondente passa **sem edição**;
`pnpm typecheck` exit 0.

### Step 4: Suíte completa

**Verify**: `pnpm test:regression` → exit 0.

## Test plan

`tests/network.test.ts` (estender) — `buildJsonResponse`:
- body `{ requestId: 'r1', ok: true }`, sem options → header `X-Request-Id === 'r1'`.
- body sem `requestId`, sem options → header ausente.
- `options.requestId = 'explicit'` → header `=== 'explicit'` (mesmo que o body
  tenha outro requestId, o explícito vence).
- `options.requestId = null` mesmo com `body.requestId` presente → header
  **ausente** (caso lead-sf).
- body `null` → não quebra, sem `X-Request-Id`, `Content-Type` presente.
- `corsHeaders` sempre mesclados no resultado.

Asserções de header: use `response.headers.get('X-Request-Id')` (retorna `null`
quando ausente) e `response.headers.get('Content-Type')`.

Testes de handler existentes (`tests/submit-lead.test.ts`,
`tests/submit-quiz.test.ts`, etc.) são a rede de segurança principal e devem
continuar passando **sem alteração**. Se algum precisar mudar para passar, o
shape não ficou idêntico → trate como STOP (ver abaixo).

## Done criteria

- [ ] `grep -n "function buildJsonResponse" api/submit-*.ts` → 0 ocorrências
- [ ] `grep -n "buildJsonResponse" api/submit-*.ts` → todas são import/uso do helper
- [ ] `lib/network.ts` exporta `buildJsonResponse`
- [ ] `submit-lead-sf` chama com `{ requestId: null }` e sua resposta **não** traz
      `X-Request-Id` (comportamento preservado)
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm exec tsx --test tests/network.test.ts` passa (com os casos novos)
- [ ] `pnpm test:regression` exit 0 — testes de handler passam **sem edição**
- [ ] Constantes de rate-limit inalteradas em cada handler
- [ ] `git status` mostra apenas arquivos in-scope
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se preservar o comportamento exato exigir **editar um teste de handler
  existente**, PARE — a extração não está neutra; reporte a diferença.
- Se algum handler tiver uma variação além das 4 mapeadas acima (header extra,
  outra lógica), PARE e reporte — não force o helper.
- Se o teste do `submit-lead-sf` (ou inspeção manual) mostrar `X-Request-Id` na
  resposta após a migração, PARE — o `{ requestId: null }` não foi aplicado ou o
  helper não suprime corretamente.
- Se os excertos de "Current state" não baterem com o código vivo, PARE (drift).

## Maintenance notes

- Mudanças futuras no shape de resposta JSON ou na propagação de request ID agora
  vivem num lugar só (`lib/network.ts`). Revisor: garantir que ninguém
  reintroduza um `buildJsonResponse` local; o template de endpoint
  (`docs/standards/templates/api-endpoint-template.md`) deve apontar para o helper
  compartilhado (atualize-o se ainda não apontar).
- **Follow-up registrado**: a omissão do `X-Request-Id` no `submit-lead-sf` é uma
  inconsistência preservada de propósito neste plano. Se for decidido que o
  lead-sf também deveria expor o header (consistência de observabilidade), isso é
  uma mudança de comportamento separada, com seu próprio teste.
- As janelas de rate-limit divergentes entre handlers continuam sem documentação
  do porquê — follow-up para documentar quando alguém tocar nesses valores.
