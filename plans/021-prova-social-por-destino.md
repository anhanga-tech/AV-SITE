# Plan 021: Protótipo de prova social casada ao destino no ponto de decisão

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat f5e4324..HEAD -- components/Destinations.tsx data/reviewsAdapter.ts data/reviewAnnotations.json data/googleReviews.json data/testimonialsData.ts types/reviews.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW–MED (UI nova em componente de alto tráfego; risco maior é quebrar snapshot visual de e2e)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `f5e4324`, 2026-07-12

## Why this matters

No modal de destino (`components/Destinations.tsx`), o visitante chega ao CTA
"Solicitar Orçamento" sem nenhuma prova social — enquanto os depoimentos (que
até carregam `destination`) vivem numa seção separada da Home, desconectados do
ponto de decisão. Colocar a prova certa no momento da decisão é a alavanca
clássica de conversão; a versão honesta disso exige duas coisas que este plano
entrega: (a) uma auditoria real de cobertura de tags destino×review (hoje a
cobertura é quase nula — ver abaixo), e (b) um cartão compacto com **fallback
honesto** (nota agregada real do Google) quando não houver review daquele
destino — nunca prova fabricada. É um protótipo: pequeno, mensurável via
`data-tracking`, e reversível.

## Current state

Arquivos relevantes:

- `components/Destinations.tsx` — seção do mapa + modal de destino. O modal
  (linhas 382–473) mostra foto, detalhes, atrações, share e os CTAs. **Não
  importa nada de reviews hoje.** Atenção: o arquivo usa classes `brand-*`
  legadas — congeladas por `tests/tailwind-brand-namespace-guard.test.ts`;
  **código novo deve usar tokens `anhanga-*`** (`lib/design-tokens.ts`).
- `data/reviewsAdapter.ts` — adapter puro google/manual → `DisplayReview`.
  `getDisplayReviews` é **tudo-ou-nada**: se há reviews do Google (há 3 hoje),
  os depoimentos manuais (`TESTIMONIALS`) nem entram na lista exibida.
- `data/googleReviews.json` — 3 reviews reais (nota média 5.0, `totalReviews: 3`),
  **nenhuma com campo `destination`** e nenhum texto menciona destino.
- `data/reviewAnnotations.json` — `{}` (vazio). É o mecanismo existente para
  anotar destino em review do Google: `scripts/fetch-google-reviews.ts:254-256`
  faz merge de `ReviewAnnotations` (`types/reviews.ts:30-34`, shape
  `{ [reviewId]: { destination?: string } }`) sobre os reviews baixados.
- `data/testimonialsData.ts` — 3 depoimentos manuais com `destination`
  (`'Finlândia'`, `'Paraty'`, `'Alemanha'`).
- `data/mapDestinations.ts` — `DESTINATIONS: Destination[]` com `city` (ex.
  `"Orlando"`, `"Punta Cana"`, `"Cancún"`) e `country` (ex. `"EUA"`,
  `"México"`). O match do protótipo compara `DisplayReview.destination` contra
  `city` **e** `country`.
- `components/ReviewSummaryBar.tsx` — exemplar visual de "nota agregada"
  (média + total), 43 linhas; referência para o fallback.
- `tests/destination-region.test.ts` — exemplar estrutural de teste
  `node:test` de helper puro sobre nomes de destino.

### Excerto 1 — o CTA sem prova (`components/Destinations.tsx:444-469`)

```tsx
        <div className="flex flex-col gap-3">
            {selectedDestination.landingPage && (
                <Link to={selectedDestination.landingPage} ... >
                    Ver detalhes do pacote <ArrowRight className="size-5" />
                </Link>
            )}
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    openContactModal({
                        source: 'destinations-modal',
                        destination: selectedDestination.city,
                    });
                    closeModal();
                }}
                ...
                data-tracking={`modal-destinations-${selectedDestination.city.toLowerCase()}`}
            >
                Solicitar Orçamento
            </button>
        </div>
```

O cartão de prova entra imediatamente **antes** deste bloco `flex flex-col gap-3`.

### Excerto 2 — fallback tudo-ou-nada do adapter (`data/reviewsAdapter.ts:31-36`)

```ts
export function getDisplayReviews(googleData: GoogleReviewsData): DisplayReview[] {
  if (googleData.reviews.length > 0) {
    return googleToDisplayReviews(googleData.reviews);
  }
  return manualToDisplayReviews(TESTIMONIALS);
}
```

Para o **matching por destino** (não para o carrossel), o pool deve ser a
união google+manual — um depoimento manual verdadeiro de Paraty continua sendo
prova legítima mesmo com reviews do Google presentes. Não alterar
`getDisplayReviews` (o carrossel da Home depende dele); criar uma função nova.

### Design system a honrar (DESIGN.md, "O Diário de Bordo")

- Cards informativos: `shadow-float` por padrão; **nunca** `shadow-hard` em
  card informativo (hard shadow é só para o CTA principal) — DESIGN.md, seção
  de cards ("Shadow Strategy") e Don'ts ("Don't colocar hard shadow em
  elementos passivos").
- Padding de card compacto mobile: `p-4`.
- Não usar `border-left` colorido como acento; preferir fundo tonalizado.
- Tokens: usar `anhanga-*` (ex. `text-anhanga-dark`, `bg-anhanga-light`) —
  `brand-*` está congelado pelo guard test.
- PRODUCT.md: "curadoria sobre catálogo", "lugares reais não categorias" — o
  cartão cita uma pessoa real e um destino real, ou mostra a nota agregada
  real; nunca texto genérico fabricado.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Teste novo (matcher) | `tsx --test tests/destination-proof.test.ts` | all pass |
| Guard de namespace | `tsx --test tests/tailwind-brand-namespace-guard.test.ts` | all pass |
| Regressão completa | `pnpm test:regression` | all pass |
| Lint (ratchet CI) | `pnpm lint:changed` | exit 0 |
| E2E (fluxos críticos + visual) | `pnpm test:e2e` | all pass (ver STOP sobre snapshots) |

## Scope

**In scope** (únicos arquivos a modificar/criar):
- `data/reviewsAdapter.ts` (adicionar o matcher; não alterar funções existentes)
- `components/ui/DestinationProofCard.tsx` (criar)
- `components/Destinations.tsx` (renderizar o cartão no modal)
- `data/reviewAnnotations.json` (só se o Step 1 encontrar evidência — ver regra)
- `tests/destination-proof.test.ts` (criar)
- `plans/README.md` (linha de status)

**Out of scope** (NÃO tocar, mesmo parecendo relacionado):
- `components/Testimonials.tsx` e `getDisplayReviews` — o carrossel da Home
  não muda.
- `scripts/fetch-google-reviews.ts` — o mecanismo de annotations já existe e
  funciona; nada a mudar.
- `data/googleReviews.json` — arquivo gerado pelo workflow agendado; editar à
  mão dessincroniza o próximo fetch.
- `pages/landings/*` — o protótipo é só no modal de Destinations; expandir
  para landings é follow-up condicionado a sinal de conversão.
- Schema JSON-LD do modal — o carrossel já emite `schema.org/Review`; duplicar
  markup de review no modal arrisca rich-result spam.

## Git workflow

- Branch: `feature/021-prova-social-destino`
- Conventional commits (ex.: `feat(destinations): proof card por destino no modal`)
- PR draft ao final; merge é sempre humano (squash).

## Steps

### Step 1: Auditoria de cobertura de tags

1. Enumerar os pools: reviews do Google (3, sem `destination`), depoimentos
   manuais (3, com `destination`) e a lista de `city`/`country` de
   `data/mapDestinations.ts`.
2. Regra de anotação **honesta**: só preencher `data/reviewAnnotations.json`
   para um review do Google se o **próprio texto do review** nomear um destino
   inequívoco. No snapshot atual, nenhum dos 3 textos nomeia destino →
   esperado: o arquivo permanece `{}`. Não inventar destino a partir de
   conhecimento de negócio — isso é decisão do mantenedor, não do executor.
3. Registrar o resultado da auditoria numa tabela no corpo da PR (review ×
   destino × fonte × match com algum `city`/`country` do mapa). Com os dados
   atuais o esperado é: cobertura de match ≈ 0 e fallback agregado dominando —
   esse é o estado honesto e o cartão foi desenhado para ele.

**Verify**: `node -e "const a=require('./data/reviewAnnotations.json'); console.log(Object.keys(a).length)"`
→ número igual ao de reviews cujo TEXTO nomeia destino (esperado hoje: `0`).

### Step 2: Matcher puro em `data/reviewsAdapter.ts`

Adicionar (exports nomeados, módulo permanece puro):

```ts
/** União google+manual para matching por destino (o carrossel continua tudo-ou-nada). */
export function getAllDisplayReviews(googleData: GoogleReviewsData): DisplayReview[] {
  return [...googleToDisplayReviews(googleData.reviews), ...manualToDisplayReviews(TESTIMONIALS)];
}

export function findReviewsForDestination(
  reviews: DisplayReview[],
  city: string,
  country: string,
): DisplayReview[] {
  // normalizar: lowercase + remoção de acentos via NFD + .replace(/[\u0300-\u036f]/g, "")
  //   (usar o escape Unicode explícito, nunca caracteres combinantes literais na regex)
  // match: review.destination existe (é opcional em DisplayReview — guard antes de
  //   normalizar, senão TypeError) && (destination normalizado === city normalizado
  //   OU === country normalizado)
}
```

Regras: retorno ordenado com reviews de maior `rating` primeiro e, em empate,
mais recente primeiro; reviews sem `destination` nunca casam; match é por
igualdade de string normalizada (sem substring — "Paraty" não pode casar
"Paraty Mirim" por acidente de includes).

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: `components/ui/DestinationProofCard.tsx`

Componente de apresentação puro (props, sem fetch, sem estado):

```ts
interface DestinationProofCardProps {
  city: string;
  country: string;
}
```

Comportamento (dados importados no módulo, como `Testimonials.tsx:10-14` faz
com `googleReviewsRaw`):

- Calcula `findReviewsForDestination(getAllDisplayReviews(googleReviewsData), city, country)`.
- **Com match** (1º da lista): citação curta (truncar texto em ~140 chars no
  limite de palavra + "…"), nome do autor, estrelas, e a linha "Viajou para
  {destination}" (mesmo padrão textual de `Testimonials.tsx:164-168`); badge
  "Google" só quando `source === 'google'`.
- **Sem match** (fallback honesto): nota agregada real — "★ 5.0 no Google ·
  3 avaliações" — lendo `averageRating`/`totalReviews` de
  `googleReviewsData` via `getReviewSummary` (nunca hardcode dos números). Se
  `getReviewSummary` retornar `null`, o componente retorna `null` (nenhum
  cartão em vez de cartão vazio).
- Visual: card informativo compacto seguindo DESIGN.md — `p-4`, `shadow-float`
  (nunca hard shadow: não é CTA), fundo tonalizado (ex. `bg-anhanga-light`),
  tokens `anhanga-*` apenas. Sem animação de entrada própria (o modal já anima).
- Acessibilidade: estrelas com `aria-label` (padrão de
  `Testimonials.tsx:147`), texto real no DOM (não só ícones).
- Atributo raiz: `data-tracking="destination-proof-card"` e
  `data-proof-variant="matched" | "aggregate"` — é o gancho de medição do
  protótipo (GTM consegue distinguir as variantes sem código novo).

**Verify**: `pnpm typecheck` → exit 0; `pnpm lint:changed` → exit 0.

### Step 4: Renderizar no modal de `Destinations.tsx`

Importar o componente e inserir imediatamente antes do bloco
`<div className="flex flex-col gap-3">` (Excerto 1):

```tsx
<DestinationProofCard
  city={selectedDestination.city}
  country={selectedDestination.country}
/>
```

Não tocar em mais nada do arquivo (nem migrar os `brand-*` existentes — o
guard congela o estado atual e a migração é oportunística fora deste plano).

**Verify**: `tsx --test tests/tailwind-brand-namespace-guard.test.ts` → pass
(nenhuma classe `brand-*` nova foi introduzida).

### Step 5: Testes + verificação manual

Escrever `tests/destination-proof.test.ts` (ver Test plan) e verificar no
browser: `pnpm dev` → Home → seção Destinos → abrir um destino → o cartão
aparece antes dos CTAs com a variante `aggregate` (estado atual dos dados).

**Verify**: `pnpm test:regression` → all pass; `pnpm test:e2e` → all pass.

## Test plan

`tests/destination-proof.test.ts`, `node:test` + `assert/strict`, modelado em
`tests/destination-region.test.ts` (helper puro, casos nomeados):

1. `findReviewsForDestination` casa por `city` com normalização de acento/caixa
   (`'cancún'` vs `'Cancun'`).
2. Casa por `country` quando o `destination` do review é um país (`'Alemanha'`).
3. Não casa por substring (`'Paraty'` não casa review `'Paraty Mirim'` e vice-versa).
4. Reviews sem `destination` são ignorados.
5. Ordenação: rating desc, depois data desc.
6. `getAllDisplayReviews` retorna google+manual mesmo com reviews do Google
   presentes (tamanho = google.length + TESTIMONIALS.length).
7. Fixture do estado real: com `data/googleReviews.json` e annotations `{}`,
   `findReviewsForDestination(..., 'Orlando', 'EUA')` → `[]` (garante que o
   fallback agregado é o caminho vivo hoje).

Verification: `tsx --test tests/destination-proof.test.ts` → 7 pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:regression` exit 0, incluindo `tests/destination-proof.test.ts` (7 casos)
- [ ] `pnpm lint:changed` exit 0
- [ ] `pnpm test:e2e` exit 0 (ou snapshots atualizados intencionalmente e mencionados na PR)
- [ ] `grep -n "DestinationProofCard" components/Destinations.tsx` → 2 matches (import + render)
- [ ] `grep -n "data-proof-variant" components/ui/DestinationProofCard.tsx` → ≥1 match
- [ ] `grep -rn "brand-" components/ui/DestinationProofCard.tsx` → 0 matches (só tokens `anhanga-*`)
- [ ] `getDisplayReviews` em `data/reviewsAdapter.ts` está byte-idêntico ao excerto 2 (carrossel intocado)
- [ ] `git status` sem arquivos fora do escopo
- [ ] Linha do plano 021 atualizada em `plans/README.md`

## STOP conditions

Stop and report back (do not improvise) if:

- Os excertos de "Current state" não batem com o código (drift desde `f5e4324`).
- `pnpm test:e2e` falhar em snapshot **visual** após inserir o cartão: se a
  única diferença for o cartão novo no modal, rodar
  `pnpm test:update-snapshots`, tratar como mudança intencional e destacar na
  PR (regra de `.claude/rules/testing.md`); se a diferença for em outra
  página/estado, STOP — algo fora do escopo mudou.
- Você se sentir tentado a anotar um destino em `reviewAnnotations.json` sem
  que o texto do review o nomeie — isso vira pergunta ao mantenedor, não
  decisão do executor.
- O bundle guard (`pnpm test:size`) falhar por causa do JSON importado no
  chunk das Destinations — reportar em vez de reestruturar imports por conta
  própria.

## Maintenance notes

- **Medição do protótipo**: `data-proof-variant` permite comparar, no GTM/GA4,
  cliques em "Solicitar Orçamento" com cartão `matched` vs `aggregate` vs
  período pré-cartão (o CTA já tem `data-tracking`). Decidir expandir (landings,
  seção de destinos) só com esse sinal — é o espírito de protótipo do achado.
- Quando novos reviews do Google mencionarem destinos, preencher
  `data/reviewAnnotations.json` (mecanismo já pronto) aumenta a cobertura
  `matched` sem nenhuma mudança de código.
- Se um futuro plano migrar `Destinations.tsx` de `brand-*` para `anhanga-*`,
  o guard test precisa ser re-baselined — não fazer aqui.
- Revisor deve escrutinar: fallback honesto (números vindos de
  `getReviewSummary`, nunca literais), truncamento da citação, e a ausência de
  JSON-LD novo no modal.
