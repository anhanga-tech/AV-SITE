# Plan 018: Fazer o guard de no-op do workflow de reviews ignorar mudanças só de `lastFetched`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. Touch
> only the files listed as in scope. If a STOP condition occurs, stop and report.
> Commit your work in the worktree following the git workflow section. SKIP
> updating `plans/README.md` if a reviewer dispatched you and said they maintain
> the index; otherwise update it.
>
> **Drift check (run first)**:
> `git diff --stat 7667a44..HEAD -- .github/workflows/refresh-reviews.yml scripts/fetch-google-reviews.ts data/googleReviews.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plano 014 (workflow `refresh-reviews.yml`) — já mergeado (PR #917)
- **Category**: dx / ops
- **Planned at**: commit `7667a44`, 2026-06-22

## Why this matters

O workflow agendado `refresh-reviews.yml` (plano 014) abre um PR sempre que
`data/googleReviews.json` muda. Mas `scripts/fetch-google-reviews.ts` reescreve o
campo `lastFetched` com `new Date().toISOString()` **a cada execução**
(`scripts/fetch-google-reviews.ts:288`), então o guard de no-op
(`git diff --cached --quiet`) **sempre** detecta diferença — mesmo quando os
reviews em si não mudaram. Resultado: todo run semanal gera um PR cujo único diff
é o timestamp, como aconteceu no PR #922 (validação manual do plano 014):

```
- "lastFetched": "2026-06-01T03:33:25.520Z",
+ "lastFetched": "2026-06-22T05:21:25.848Z",
```

Isso é ruído previsível para o mantenedor. O objetivo deste plano é: **só abrir PR
quando o conteúdo dos reviews mudar de fato**, ignorando diferenças que sejam
apenas no `lastFetched`. O workflow continua atualizando o arquivo; o que muda é a
decisão de quando vale a pena commitar/abrir PR.

## Current state

Verified at commit `7667a44`.

- `scripts/fetch-google-reviews.ts:288` — monta o objeto de saída com
  `lastFetched: new Date().toISOString()` e grava em `data/googleReviews.json`
  (`writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n')`, linha 293).
  **Não mexer no script** — ele deve continuar registrando quando rodou.
- `data/googleReviews.json` — JSON com chaves top-level nesta ordem:
  `placeId`, `averageRating`, `totalReviews`, `lastFetched`, `reviews`. O
  `lastFetched` é uma string ISO top-level.
- `.github/workflows/refresh-reviews.yml` — o passo `Open PR with updated reviews`
  contém hoje o guard simples:
  ```bash
  git add data/googleReviews.json
  if git diff --cached --quiet; then
    echo "No changes to googleReviews.json — skipping."
    exit 0
  fi
  BRANCH="chore/update-google-reviews-${{ github.run_id }}"
  git checkout -b "$BRANCH"
  git commit -m "chore: atualiza data/googleReviews.json"
  git push origin "$BRANCH"
  gh pr create \
    --title "chore: atualiza data/googleReviews.json" \
    --body "Atualização automática semanal dos reviews do Google, disparada pelo workflow agendado \`refresh-reviews.yml\`." \
    --base main \
    --head "$BRANCH"
  ```
  O runner do Ubuntu já tem `jq` e `git` disponíveis (usados pelo gh CLI).

Convenções: workflows em `.github/workflows/`, kebab-case `.yml`. O runner é
`ubuntu-latest` (jq pré-instalado).

## Commands you will need

| Purpose            | Command                                                                 | Expected               |
|--------------------|-------------------------------------------------------------------------|------------------------|
| YAML lint          | `node -e "import('js-yaml').then(m=>{(m.default||m).load(require('fs').readFileSync('.github/workflows/refresh-reviews.yml','utf8'));console.log('ok')})"` | prints `ok` |
| jq disponível      | `jq --version`                                                          | imprime versão         |
| Simular no-op      | (ver Step 2)                                                            | guard decide "skip"    |
| Regressão          | `pnpm test:regression`                                                  | all pass (inalterado)  |

> Este plano altera **só** o YAML do workflow. Não há mudança de TypeScript, então
> typecheck/regressão ficam inalterados. A validação real é o teste de simulação
> (Step 2) + um `workflow_dispatch` manual pelo mantenedor.

## Scope

**In scope** (o único arquivo a modificar):
- `.github/workflows/refresh-reviews.yml` (só o passo `Open PR with updated reviews`)

**Out of scope** (NÃO tocar):
- `scripts/fetch-google-reviews.ts` — o script deve continuar gravando
  `lastFetched` a cada run; a deduplicação é decisão do workflow, não do script.
- `data/googleReviews.json` — não editar à mão.
- Os outros passos do workflow (checkout, setup, install, fetch) — só o guard muda.
- Qualquer teste — não há teste unitário de workflow (infra; ver Test plan).

## Git workflow

- Branch: `chore/reviews-guard-ignore-lastfetched`.
- Conventional commit: `chore(ci): guard de reviews ignora mudança só de lastFetched`.
- NÃO fazer push nem abrir PR a menos que instruído.

## Steps

### Step 1: Substituir o guard por uma comparação que ignora `lastFetched`

No passo `Open PR with updated reviews` de `.github/workflows/refresh-reviews.yml`,
troque o bloco do guard. Em vez de comparar o arquivo inteiro, compare a versão
nova contra a versão em `HEAD`, **ambas normalizadas com `lastFetched` removido**
via `jq`. Se forem iguais, restaure o arquivo (para o timestamp não ficar sujo) e
saia sem abrir PR.

Substitua:
```bash
          git add data/googleReviews.json
          if git diff --cached --quiet; then
            echo "No changes to googleReviews.json — skipping."
            exit 0
          fi
```
por:
```bash
          # Compara conteúdo ignorando o carimbo `lastFetched`, que muda a cada
          # run. Sem isso, todo run semanal abriria um PR só de timestamp.
          NEW_CONTENT="$(jq -S 'del(.lastFetched)' data/googleReviews.json)"
          OLD_CONTENT="$(git show HEAD:data/googleReviews.json | jq -S 'del(.lastFetched)')"
          if [ "$NEW_CONTENT" = "$OLD_CONTENT" ]; then
            echo "Apenas lastFetched mudou — nenhum review novo. Pulando PR."
            git checkout -- data/googleReviews.json
            exit 0
          fi
          git add data/googleReviews.json
```

Mantenha o resto do passo (branch, commit, push, `gh pr create`) inalterado.

**Verify**: o lint de YAML (tabela) imprime `ok`; `git diff` do workflow mostra só
a troca do bloco do guard, sem mexer em outros passos.

### Step 2: Simular o comportamento do guard localmente

Prove as duas direções da lógica com um teste de shell manual (não commitado).
Rode exatamente isto a partir da raiz do repo:

```bash
# Caso A — só lastFetched muda → deve imprimir SKIP
cp data/googleReviews.json /tmp/orig.json
jq '.lastFetched = "2099-01-01T00:00:00.000Z"' /tmp/orig.json > data/googleReviews.json
NEW_CONTENT="$(jq -S 'del(.lastFetched)' data/googleReviews.json)"
OLD_CONTENT="$(git show HEAD:data/googleReviews.json | jq -S 'del(.lastFetched)')"
[ "$NEW_CONTENT" = "$OLD_CONTENT" ] && echo "A: SKIP (correto)" || echo "A: ABRIRIA PR (errado)"

# Caso B — conteúdo real muda (totalReviews) → deve imprimir ABRIRIA PR
jq '.totalReviews = (.totalReviews + 1)' /tmp/orig.json > data/googleReviews.json
NEW_CONTENT="$(jq -S 'del(.lastFetched)' data/googleReviews.json)"
OLD_CONTENT="$(git show HEAD:data/googleReviews.json | jq -S 'del(.lastFetched)')"
[ "$NEW_CONTENT" = "$OLD_CONTENT" ] && echo "B: SKIP (errado)" || echo "B: ABRIRIA PR (correto)"

# Restaura o arquivo intacto
git checkout -- data/googleReviews.json
```

**Verify**: a saída é exatamente `A: SKIP (correto)` e `B: ABRIRIA PR (correto)`,
e `git status --porcelain data/googleReviews.json` fica vazio ao final (arquivo
restaurado). Se o caso A imprimir "ABRIRIA PR", a normalização com `jq` está
errada — **STOP** e reporte.

### Step 3: Suite de regressão (sanidade)

```
pnpm test:regression
```

**Verify**: todos passam (nenhum TypeScript mudou; este é um sanity check).

## Test plan

Não há teste unitário novo: a lógica vive em shell dentro do YAML do workflow
(infra), que o padrão de testes (`docs/standards/testing.md`) não exige cobrir com
`node:test`. A rede de segurança é:
- a simulação de shell das duas direções (Step 2),
- o lint de YAML (Step 1),
- a regressão verde (Step 3),
- um `workflow_dispatch` manual pelo mantenedor após o merge (validação real
  ponta a ponta — o mesmo método usado para validar o plano 014).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `.github/workflows/refresh-reviews.yml` é YAML válido (lint imprime `ok`)
- [ ] O guard usa `jq` com `del(.lastFetched)` para comparar conteúdo
      (`grep -n "del(.lastFetched)" .github/workflows/refresh-reviews.yml` → 2 matches)
- [ ] O guard restaura o arquivo no caminho de skip
      (`grep -n "git checkout -- data/googleReviews.json" .github/workflows/refresh-reviews.yml` → 1 match)
- [ ] A simulação (Step 2) imprime `A: SKIP (correto)` e `B: ABRIRIA PR (correto)`
- [ ] `git status --porcelain data/googleReviews.json` vazio ao final
- [ ] `pnpm test:regression` exits 0
- [ ] Nenhum arquivo além do workflow modificado (`git status --porcelain`)
- [ ] `plans/README.md` status row atualizado (a menos que o reviewer mantenha)

## STOP conditions

Stop and report back if:

- `data/googleReviews.json` não tiver mais um `lastFetched` top-level (o script
  mudou de forma) — a normalização `del(.lastFetched)` ficaria sem efeito; reporte.
- `scripts/fetch-google-reviews.ts` não gravar mais `lastFetched` a cada run (ex:
  já foi corrigido para só atualizar quando há mudança) — então este plano é
  redundante; reporte o que encontrou em vez de duplicar a correção.
- No Step 2, o caso A imprimir "ABRIRIA PR" (a comparação `jq` não está
  neutralizando o timestamp) — não force; reporte a saída.
- O runner não tiver `jq` (improvável no `ubuntu-latest`) — reporte; não troque
  por um parser ad-hoc.

## Maintenance notes

- Para o reviewer: o diff deve ser só a troca do bloco do guard no passo
  `Open PR with updated reviews`. Confirme que o caminho de skip faz
  `git checkout -- data/googleReviews.json` (senão o working tree do runner fica
  com o timestamp sujo, sem efeito prático mas confuso).
- Efeito colateral aceito: nas semanas sem review novo, o `lastFetched` no repo
  **não** avança (o arquivo é restaurado). O campo passa a refletir "última vez
  que o conteúdo mudou", não "última vez que rodou". Isso é desejável aqui — quem
  quiser auditar execuções tem o histórico de runs do Actions.
- Se no futuro o `reviews:fetch` passar a reordenar chaves ou normalizar de forma
  instável, o `jq -S` (sort keys) já protege contra diffs espúrios de ordenação.
