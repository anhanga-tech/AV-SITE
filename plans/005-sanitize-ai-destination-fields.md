# Plan 005: Rejeitar sintaxe de markdown/URL nos campos de destino do handoff da IA

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d27f8b0..HEAD -- lib/ai/validation.ts lib/ai/handoff.ts tests/`
> Se arquivos in-scope mudaram, compare os excertos de "Current state" com o
> código vivo; em divergência, trate como STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d27f8b0`, 2026-06-12

## Why this matters

O chatbot (Gemini) devolve um tool call `generate_budget_link` cujos argumentos (destino, datas, interesses etc.) são derivados de texto digitado pelo usuário. Hoje `lib/ai/validation.ts` sanitiza esses campos com `cleanString()` (escape de HTML + trim), mas **não rejeita** sintaxe de markdown (`[texto](url)`), URLs ou esquemas (`http:`, `wa.me`) embutidos no destino. As mitigações existentes em `api/generate.ts` (strip de links WhatsApp não-oficiais) cobrem o pior caso, mas um usuário pode injetar um "destino" contendo um link/instrução que flui para a mensagem de handoff e para o payload de lead enviado ao n8n/CRM. Este plano fecha a borda: campos de cidade/região/destino são texto plano — qualquer sintaxe de link/markdown invalida o campo.

## Current state

- `lib/ai/validation.ts:152-178` — `sanitizeBudgetFields(raw)`:
  ```ts
  const destinationCity = cleanString(raw.destination_city);
  const destinationRegion = cleanString(raw.destination_region);
  const originCity = cleanString(raw.origin_city);
  ...
  const destination = cleanString(raw.destination) || [destinationCity, destinationRegion].filter(Boolean).join(', ');
  ```
- `lib/ai/validation.ts:180-202` — `collectMissingBudgetFields(...)` marca campos ausentes/inaceitáveis com `isCityValueAcceptable(...)`; campos rejeitados geram pedido de refinamento ao usuário via `buildRefinementMessage` (`:123-137`), não erro fatal — **este é o mecanismo a reutilizar**: um destino com markdown deve ser tratado como "valor de cidade inaceitável".
- `isCityValueAcceptable` — função existente em `lib/ai/validation.ts` (localize com `grep -n "isCityValueAcceptable" lib/ai/validation.ts`); hoje verifica placeholders/valores vazios.
- `cleanString` vem de `lib/lead-logic.ts` — escapa entidades HTML e faz trim; **não** remove `[`, `]`, `(`, `)`, `://`.
- `lib/ai/handoff.ts` formata a mensagem de handoff interpolando o destino como texto.
- Convenções: validação na fronteira em `lib/` (`.claude/rules/security.md`); testes `node:test` + `assert/strict`; testes existentes do subsistema: `tests/api-generate-normalization.test.ts` e procure `grep -rln "validation" tests/ | grep -i ai` por testes da validação da IA.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 |
| Testes do subsistema | `tsx --test tests/api-generate-normalization.test.ts` | todos passam |
| Suíte completa | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `lib/ai/validation.ts`
- Arquivo(s) de teste da validação da IA em `tests/` (estender ou criar `tests/ai-validation-plain-text.test.ts`)

**Out of scope** (NÃO tocar):
- `lib/ai/prompt.ts` — o prompt já tem PROMPT_INJECTION_POLICY; não mexer.
- `api/generate.ts` e o strip de links WhatsApp existente — continuam como defesa em profundidade.
- `lib/lead-logic.ts` / `cleanString` — usado por todos os formulários; mudar seu comportamento teria blast radius enorme.
- Campos livres longos como `needSummary`/`interests` — escapados por `cleanString` e não viram links; endurecê-los geraria falsos positivos (usuário pode citar um site). Somente campos de **cidade/região/destino/datas** entram na regra.

## Git workflow

- Branch: `fix/005-ai-destination-plain-text`
- Commit convencional, ex.: `fix(ai): rejeitar markdown e URLs em campos de destino do handoff`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Criar o predicado de texto plano

Em `lib/ai/validation.ts`, adicione um helper local (não exporte se não for preciso para teste; se exportar para teste, siga o padrão de exports nomeados do arquivo):

```ts
const LINKY_PATTERN = /\[[^\]]*\]\([^)]*\)|https?:\/\/|wa\.me|\bwww\./i;

function isPlainTextLocation(value: string): boolean {
    return value.length > 0 && !LINKY_PATTERN.test(value);
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Aplicar nos campos de localização

Em `sanitizeBudgetFields` (ou imediatamente após, em `collectMissingBudgetFields`): se `destinationCity`, `destinationRegion`, `originCity` ou `destination` contiverem padrão "linky", trate o campo como inválido — esvazie-o (string vazia) **antes** de `collectMissingBudgetFields` rodar, para que o fluxo existente de refinamento peça o dado de novo ao usuário. Não lance erro nem altere o shape de retorno.

**Verify**: `tsx --test tests/api-generate-normalization.test.ts` → testes existentes continuam passando.

### Step 3: Testes

Ver "Test plan".

**Verify**: `pnpm test:regression` → exit 0.

## Test plan

Novos testes (no arquivo de teste de validação da IA existente, ou `tests/ai-validation-plain-text.test.ts`, modelado em `tests/api-generate-normalization.test.ts`):

- Destino `"Paris [clique aqui](https://attacker.example)"` → campo invalidado; resultado da validação inclui `destination_city` em `missing`.
- Destino `"Paris http://attacker.example"` → idem.
- Destino `"Confira wa.me/5511999999999"` → idem.
- Destino legítimo `"Paris, França"` → válido, sem `missing` de destino.
- Destino com acento e hífen `"São João del-Rei"` → válido (regressão contra falso positivo).
- `origin_city` com markdown → `origin_city` em `missing`.

## Done criteria

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:regression` exit 0, incluindo os 6 novos testes
- [ ] Nenhuma mudança no shape de retorno de `sanitizeBudgetFields`/`collectMissingBudgetFields` (testes existentes intactos)
- [ ] `git status` mostra apenas arquivos in-scope
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se `isCityValueAcceptable` já rejeitar padrões de URL/markdown (verifique antes do Step 1), PARE e reporte — o achado pode já ter sido corrigido.
- Se invalidar o campo quebrar testes existentes que usam destinos com URLs intencionalmente, PARE e reporte — pode haver contrato que o plano desconhece.
- Se a correção parecer exigir mudanças em `api/generate.ts` ou `lib/ai/handoff.ts`, PARE — o design é conter tudo na validação.

## Maintenance notes

- O `LINKY_PATTERN` é deliberadamente conservador (markdown-link, esquema http/https, wa.me, www.). Se surgir falso positivo real (cidade com "www" no nome não existe; risco baixo), ajustar o padrão com teste de regressão.
- Defesa em profundidade: o strip de links WhatsApp em `api/generate.ts` deve permanecer mesmo após este plano.
