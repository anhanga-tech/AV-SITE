# Plan 003: Endurecer config — exigir HTTPS nos webhooks n8n e rejeitar ALLOWED_ORIGIN inseguro

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d27f8b0..HEAD -- services/n8n.ts lib/network.ts tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d27f8b0`, 2026-06-12

## Why this matters

Dois pontos de hardening contra erro de configuração do operador: (1) `services/n8n.ts` envia o segredo compartilhado `X-Webhook-Secret` para a URL configurada em env vars sem validar o scheme — se um operador configurar uma URL `http://`, o segredo e PII de leads trafegam em texto claro; (2) `lib/network.ts` usa `process.env.ALLOWED_ORIGIN` diretamente no header `Access-Control-Allow-Origin` — um valor `*` (ou origem não-HTTPS) abriria CORS para qualquer site. Nenhum dos dois é bug hoje; são guardas baratas que transformam um erro silencioso de configuração em falha explícita.

## Current state

- `services/n8n.ts:39-48` — `n8nRequest(url, secret, requestId, payload)` monta os headers e faz `fetch(url, ...)` sem validar `url`:
  ```ts
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('X-Webhook-Secret', secret);
  headers.set('X-Request-Id', requestId);
  ```
  Erros são lançados no formato `N8N_WEBHOOK_ERROR:<status>:<mensagem>` (ver `assertN8nResponseOk` em `services/n8n.ts:27-33` e `normalizeNetworkError` em `:35-37`) — siga esse formato.
- `lib/network.ts:16-23` — `buildCorsHeaders()`:
  ```ts
  'Access-Control-Allow-Origin': allowedOrigin || process.env.ALLOWED_ORIGIN || 'https://www.anhanga.tur.br',
  ```
- Convenções do repo (`.claude/rules/security.md` e `api-conventions.md`): validação na fronteira em `lib/`, transporte em `services/`, erros 5xx para falha de configuração; testes em `tests/*.test.ts` com `node:test` + `assert/strict`.
- Exemplo de teste do transporte n8n já existente: procure `tests/` por arquivo que importe `services/n8n` (`grep -rln "services/n8n" tests/`) e use-o como padrão estrutural; se não existir, modele em `tests/lib-lead-logic.test.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 |
| Teste isolado | `tsx --test tests/n8n-service.test.ts` (ou o arquivo que você criar/editar) | todos passam |
| Suíte completa | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `services/n8n.ts`
- `lib/network.ts`
- Arquivos de teste correspondentes em `tests/` (criar ou estender)

**Out of scope** (NÃO tocar):
- Handlers em `api/` e `functions/` — as guardas vivem nas camadas compartilhadas; os handlers não mudam.
- `lib/rate-limit.ts`, `lib/hubspot-validation.ts` — não relacionados.
- Comportamento em dev: `http://localhost` e `http://127.0.0.1` devem continuar funcionando (n8n local e dev server).

## Git workflow

- Branch: `fix/003-harden-n8n-https-cors-origin`
- Commit convencional, ex.: `fix(security): exigir HTTPS em webhooks n8n e validar ALLOWED_ORIGIN`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Validar scheme da URL em `services/n8n.ts`

No início de `n8nRequest`, antes de montar headers, valide a URL:

- Parse com `new URL(url)`; se lançar, throw `new Error('N8N_WEBHOOK_ERROR:500:Invalid webhook URL')`.
- Aceite `https:` sempre; aceite `http:` **somente** quando o hostname for `localhost` ou `127.0.0.1` (dev local). Caso contrário, throw `new Error('N8N_WEBHOOK_ERROR:500:Webhook URL must use HTTPS')`.
- Não inclua a URL completa na mensagem de erro (pode conter path secreto do webhook).

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Validar origem em `lib/network.ts`

Em `buildCorsHeaders`, valide o valor resolvido antes de usá-lo:

- Crie um helper local `resolveAllowedOrigin(candidate?: string): string` que retorna o candidato apenas se for uma origem única HTTPS válida (`new URL(...)` com `protocol === 'https:'`, sem path/único valor, e diferente de `*`); para `http://localhost`/`http://127.0.0.1` (com porta opcional), também aceite (dev). Qualquer outro valor (incl. `*`, listas separadas por vírgula, strings malformadas) → retorna o default `'https://www.anhanga.tur.br'`.
- `buildCorsHeaders` passa `allowedOrigin || process.env.ALLOWED_ORIGIN` pelo helper.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Testes de regressão

Ver "Test plan". Rode a suíte completa ao final.

**Verify**: `pnpm test:regression` → exit 0.

## Test plan

Novos testes `node:test` + `assert/strict`:

1. Para `services/n8n.ts` (no arquivo de teste existente do serviço, ou crie `tests/n8n-service.test.ts`):
   - URL `http://example.com/webhook` → rejeita com mensagem iniciando em `N8N_WEBHOOK_ERROR:500:`.
   - URL `http://localhost:5678/webhook` → não rejeita pelo scheme (mock do `fetch` global para não fazer rede — siga o padrão de mock dos testes existentes, ex.: `tests/submit-lead.test.ts`).
   - URL `https://n8n.example.com/webhook` → passa pela validação.
   - URL inválida (`not-a-url`) → rejeita com `N8N_WEBHOOK_ERROR:500:`.
2. Para `lib/network.ts` (crie/estenda `tests/network.test.ts`):
   - `buildCorsHeaders('*')` → header é o default `https://www.anhanga.tur.br`.
   - `buildCorsHeaders('https://www.anhanga.tur.br')` → ecoa o valor.
   - `buildCorsHeaders('http://localhost:3000')` → ecoa o valor.
   - `process.env.ALLOWED_ORIGIN = '*'` (set/restore dentro do teste) → default.

Sem testes hitting rede real (regra do repo).

## Done criteria

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:regression` exit 0, incluindo os ~8 testes novos
- [ ] `git status` mostra apenas arquivos in-scope
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se algum teste existente quebrar porque depende de URLs `http://` não-localhost para n8n, PARE e reporte — pode haver ambiente de staging HTTP legítimo que o plano desconhece.
- Se `buildCorsHeaders` for chamado em algum lugar com múltiplas origens separadas por vírgula (procure `grep -rn "buildCorsHeaders" api/ functions/ lib/`), PARE — o design de origem única estaria errado.
- Se os excertos de "Current state" não baterem com o código, PARE (drift).

## Maintenance notes

- Se no futuro o site ganhar múltiplos domínios permitidos (ex.: subdomínio de landing), `resolveAllowedOrigin` precisará evoluir para allowlist + echo da `Origin` da request.
- Revisor: conferir que mensagens de erro não vazam a URL do webhook (contém path secreto).
