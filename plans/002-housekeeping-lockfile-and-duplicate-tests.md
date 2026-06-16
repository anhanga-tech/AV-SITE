# Plan 002: Remover lockfile npm fantasma e mesclar testes duplicados de lead-logic

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d27f8b0..HEAD -- tests/lead-logic.test.ts tests/lib-lead-logic.test.ts .gitignore`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `d27f8b0`, 2026-06-12

## Why this matters

Dois itens de housekeeping com custo de manutenção real: (1) `package-lock.json` (~221 KB) existe no disco mas **não é rastreado pelo git** — foi removido do índice no commit `2cd9534` ("remove legacy npm lockfile") quando o projeto migrou para pnpm, mas o arquivo sobrou no working tree e pode induzir um `npm install` acidental; (2) `tests/lead-logic.test.ts` é um subconjunto de `tests/lib-lead-logic.test.ts` — ambos testam `cleanString`/`normalizeNullable` de `lib/lead-logic.ts`, duplicando manutenção e confundindo qual arquivo atualizar.

## Current state

- `package-lock.json` — na raiz, não rastreado: `git ls-files package-lock.json` retorna vazio. O gerenciador oficial é pnpm (`pnpm-lock.yaml` + `pnpm-workspace.yaml` com `nodeLinker: hoisted`).
- `tests/lead-logic.test.ts` — começa com:
  ```ts
  import { cleanString, normalizeNullable } from '../lib/lead-logic.ts';
  // cleanString
  test('cleanString should return empty string for non-string input', () => { ... });
  ```
- `tests/lib-lead-logic.test.ts` — arquivo mais completo: cobre as mesmas funções **mais** `normalizeWhatsappNumber`, masking e normalização de tracking.
- Convenção de testes do repo: `node:test` + `assert/strict`, rodados via `tsx --test` (ver `.claude/rules/testing.md`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Testes do módulo | `tsx --test tests/lib-lead-logic.test.ts` | todos passam |
| Suíte completa | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `package-lock.json` (deletar do disco)
- `.gitignore` (adicionar `package-lock.json`)
- `tests/lead-logic.test.ts` (deletar após mesclar)
- `tests/lib-lead-logic.test.ts` (receber casos únicos do arquivo deletado, se houver)

**Out of scope** (NÃO tocar):
- `lib/lead-logic.ts` — nenhuma mudança de comportamento.
- `pnpm-lock.yaml`, `pnpm-workspace.yaml`.
- Qualquer outro arquivo de teste.

## Git workflow

- Branch: `chore/002-housekeeping-lockfile-tests`
- Commits convencionais, ex.: `chore: remover package-lock.json residual e ignorá-lo` e `test: mesclar lead-logic.test.ts em lib-lead-logic.test.ts`
- Não commitar na `main`; PR com squash merge. NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Remover o lockfile fantasma e preveni-lo

1. Confirme que não é rastreado: `git ls-files package-lock.json` → vazio.
2. `rm package-lock.json`
3. Adicione a linha `package-lock.json` ao `.gitignore` (na seção de dependências/lockfiles, se existir).

**Verify**: `ls package-lock.json` → "No such file"; `git check-ignore package-lock.json` → imprime o caminho (exit 0).

### Step 2: Mesclar os testes duplicados

1. Leia os dois arquivos por completo.
2. Para cada `test(...)` em `tests/lead-logic.test.ts`, verifique se um caso equivalente (mesma função + mesma asserção essencial) existe em `tests/lib-lead-logic.test.ts`. Casos sem equivalente: copie-os para `tests/lib-lead-logic.test.ts`, mantendo o estilo do arquivo de destino.
3. Delete `tests/lead-logic.test.ts`.

**Verify**: `tsx --test tests/lib-lead-logic.test.ts` → todos passam; a contagem de testes do arquivo destino é ≥ contagem anterior.

### Step 3: Rodar a suíte completa

**Verify**: `pnpm test:regression` → exit 0, nenhum teste referenciando o arquivo deletado.

## Test plan

Sem testes novos — é consolidação. O critério é não perder cobertura: a união dos casos dos dois arquivos deve existir no arquivo final.

## Done criteria

- [ ] `package-lock.json` ausente do disco e listado no `.gitignore`
- [ ] `tests/lead-logic.test.ts` não existe; `git status` mostra apenas arquivos in-scope
- [ ] `pnpm test:regression` exit 0
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se `git ls-files package-lock.json` retornar o arquivo (rastreado), PARE — a premissa "não rastreado" mudou e a remoção viraria mudança de comportamento de build.
- Se algum script em `package.json` ou workflow em `.github/workflows/` referenciar `package-lock.json` (`grep -rn "package-lock" package.json .github/`), PARE e reporte.
- Se algum teste do arquivo a deletar falhar ao ser movido (comportamento divergente entre os dois arquivos), PARE — pode indicar bug real em `lib/lead-logic.ts`.

## Maintenance notes

- Se alguém rodar `npm install` por engano no futuro, o `.gitignore` evita o commit acidental, mas o `node_modules` ficaria inconsistente — o time deve usar apenas pnpm.
- Revisor: conferir que nenhum caso de teste único foi perdido na mescla (diff dos nomes de testes).
