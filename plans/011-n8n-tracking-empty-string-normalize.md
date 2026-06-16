# Plan 011: Normalizar click IDs vazios/whitespace para null nos payloads do n8n

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 68eecf6..HEAD -- lib/n8n-payloads.ts tests/lib-n8n-payloads.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 007 (recomendado — ver "Interação com 007")
- **Category**: correctness / data quality
- **Planned at**: commit `68eecf6`, 2026-06-12

## Why this matters

`lib/n8n-payloads.ts` molda toda a saída de leads enviada ao n8n → Salesforce.
Os click IDs de atribuição (`gclid`, `fbclid`, `msclkid`, `ttclid`, `wbraid`,
`gbraid`, `fbc`, `fbp`, `cid`, `sid`) passam pelo helper
`toNullableTrackingValue` antes de entrarem no payload de **lead** e de
**contato**.

Hoje esse helper só converte `null`/`undefined` para `null`:

```ts
function toNullableTrackingValue(value: string | null | undefined): string | null {
    return value ?? null;
}
```

Consequência: um click ID que chega como **string vazia** (`''`) ou só
**whitespace** (`'   '`) — comum quando um parâmetro de URL existe mas vem vazio
(`?gclid=`) — é repassado intacto ao CRM em vez de virar `null`. Isso polui o
Salesforce com valores de atribuição vazios que **parecem preenchidos** mas não
são, atrapalhando segmentação e relatórios de origem de lead.

O repo já tem o padrão correto no mesmo arquivo: `normalizeContextValue`
(`lib/n8n-payloads.ts:128`) trima e converte vazio/whitespace para `null`. A
correção é alinhar `toNullableTrackingValue` a esse mesmo comportamento.

> Achado originado durante a execução do plano 007 (testes dos builders), que
> documentou o comportamento atual de passthrough. Este plano corrige o
> comportamento; ver "Interação com 007".

## Current state

`lib/n8n-payloads.ts`:

- `:87-89` — o helper a corrigir:
  ```ts
  function toNullableTrackingValue(value: string | null | undefined): string | null {
      return value ?? null;
  }
  ```
- `:128-132` — o padrão de referência (NÃO mudar, só espelhar):
  ```ts
  function normalizeContextValue(value: string | null | undefined): string | null {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
  }
  ```
- `toNullableTrackingValue` é usado em **dois lugares**: `buildLeadTrackingIds`
  (`:107-116`, alimenta o payload de lead) e o bloco de tracking de
  `buildN8nContactPayload` (`:168-177`, payload de contato). Os 10 click IDs em
  cada. Confirme com `grep -n "toNullableTrackingValue" lib/n8n-payloads.ts`
  (esperado: 1 definição + 20 chamadas).

**Importante — escopo da correção**: os campos **UTM** (`utm_source` etc.) NÃO
passam por `toNullableTrackingValue` — eles usam `?? ` direto em
`buildLeadTrackingUtms` (`:90-104`) e no fallback de contato. Este plano **não**
altera o comportamento de UTM (string vazia de UTM continua passando). Mexer
nisso exigiria decidir o contrato de fallback UTM e está fora de escopo aqui.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Localizar usos | `grep -n "toNullableTrackingValue" lib/n8n-payloads.ts` | 1 def + 20 chamadas |
| Typecheck | `pnpm typecheck` | exit 0 |
| Teste isolado | `pnpm exec tsx --test tests/lib-n8n-payloads.test.ts` | todos passam |
| Suíte completa | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `lib/n8n-payloads.ts` — corrigir **somente** o corpo de
  `toNullableTrackingValue` (`:87-89`). A assinatura permanece igual.
- `tests/lib-n8n-payloads.test.ts` — atualizar/adicionar asserts de normalização
  de click ID vazio/whitespace (ver "Interação com 007" e "Test plan").

**Out of scope** (NÃO tocar):
- `normalizeContextValue` e qualquer lógica de UTM/fallback.
- Handlers em `api/`, `services/n8n.ts`, schemas em `lib/schemas/`.
- A construção inline do payload de NPS em `api/submit-nps.ts` (não usa este
  helper).
- Não refatorar para unificar `toNullableTrackingValue` e `normalizeContextValue`
  num único helper — duplicação mínima é aceitável; unificar amplia o escopo e o
  risco sem ganho proporcional.

## Interação com 007

O plano 007 (branch `test/007-n8n-payloads-unit-tests`, já DONE) adicionou
`tests/lib-n8n-payloads.test.ts` com um teste que documenta o comportamento
ATUAL de passthrough:

```ts
test('buildN8nContactPayload — click ID vazio/whitespace é repassado sem normalização (toNullableTrackingValue só trata undefined/null)', () => {
    ...
    assert.equal(result.tracking.gclid, '');
    assert.equal(result.tracking.fbclid, '   ');
});
```

Depois desta correção, esse assert fica **errado** — `gclid`/`fbclid` passarão a
ser `null`. Você DEVE atualizar esse teste para refletir o novo contrato
(asserts `=== null`) e o nome do teste para descrever a normalização. Não remova
a cobertura; inverta a expectativa.

- Se ambas as branches forem mergeadas em sequência, garanta que a 007 entre
  primeiro e esta atualize o teste. Se a 007 ainda não estiver em `main` quando
  você rodar o drift check, o arquivo de teste pode não existir — nesse caso,
  crie os asserts de normalização do zero seguindo o "Test plan".

## Git workflow

- Branch: `fix/011-n8n-tracking-empty-string-normalize`
- Commit convencional, ex.: `fix(leads): normalizar click IDs vazios para null nos payloads do n8n`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Corrigir o helper

Em `lib/n8n-payloads.ts`, substitua o corpo de `toNullableTrackingValue`
(`:87-89`) para trimar e converter vazio/whitespace em `null`, espelhando
`normalizeContextValue`:

```ts
function toNullableTrackingValue(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
```

Decisão de contrato: o valor retornado para um click ID válido é a versão
**trimada** (`'abc123 '` → `'abc123'`). Isso é desejável — espaços de borda em
um click ID nunca são significativos.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Atualizar/adicionar testes

Ver "Test plan" e "Interação com 007". Inverta o assert de passthrough existente
(se presente) e cubra também o caminho do **lead** (não só contato).

**Verify**: `pnpm exec tsx --test tests/lib-n8n-payloads.test.ts` → todos passam.

### Step 3: Suíte completa

**Verify**: `pnpm test:regression` → exit 0.

## Test plan

`tests/lib-n8n-payloads.test.ts` (`node:test` + `assert/strict`). Asserts a
garantir após a correção:

**`buildN8nContactPayload`** (inverter o teste existente do 007):
- `gclid: ''` → `result.tracking.gclid === null`.
- `fbclid: '   '` → `result.tracking.fbclid === null`.
- click ID válido com espaços de borda → trimado (ex.: `gclid: ' abc123 '` →
  `'abc123'`). (Assert opcional mas recomendado para travar o contrato de trim.)
- click ID válido sem espaços continua ecoando (`'abc123'` → `'abc123'`) — manter
  o teste já existente.

**`buildN8nLeadPayload`** (novo — o lead também usa o helper via
`buildLeadTrackingIds`):
- com `payload.tracking.gclid = ''`, o tracking do lead resultante tem
  `gclid === null`. Leia o output de `buildN8nLeadPayload` para saber o caminho
  exato do campo (`result.tracking.gclid`) e construa a fixture com um objeto
  `tracking` válido conforme o tipo `SubmitLeadRequest`.

Sem rede, sem mocks (funções puras). Use os tipos reais de `types/`, sem `any`.

## Done criteria

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm exec tsx --test tests/lib-n8n-payloads.test.ts` → todos passam
- [ ] `pnpm test:regression` exit 0
- [ ] `toNullableTrackingValue` trima e converte vazio/whitespace → `null`
- [ ] Há ≥1 teste de normalização vazio→null no caminho de **lead** e ≥1 no de
      **contato**
- [ ] Nenhum assert remanescente afirma que click ID vazio é repassado como `''`
- [ ] `git status` mostra apenas `lib/n8n-payloads.ts` e
      `tests/lib-n8n-payloads.test.ts`
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se a correção quebrar algum teste **fora** de `tests/lib-n8n-payloads.test.ts`
  (ex.: um teste de handler que esperava `''` no payload), PARE e reporte — isso
  indica que algum consumidor depende do passthrough e a decisão precisa de
  revisão, não de um ajuste de teste no improviso.
- Se os excertos de "Current state" não baterem com o código vivo, PARE (drift).
- Se `toNullableTrackingValue` tiver passado a ser usado também para campos não
  relacionados a tracking desde o `Planned at`, PARE e reavalie o impacto.

## Maintenance notes

- Este helper e `normalizeContextValue` agora têm corpos idênticos. Mantê-los
  separados é intencional (nomes documentam intenção em pontos de uso
  diferentes). Se um terceiro caso surgir, considere então promover para um
  único `normalizeNullableString` em `lib/` — mas não antes.
- Revisor: confirmar que os campos UTM continuam com o comportamento antigo
  (este plano deliberadamente não os toca) e que apenas os click IDs passaram a
  normalizar vazio→null.
