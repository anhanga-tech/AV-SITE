# Plan 009: Fallback visível quando o globe.gl falha ao carregar (CorpGlobe)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 68eecf6..HEAD -- components/landings/corporativo/CorpGlobe.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: UX / resiliência
- **Planned at**: commit `68eecf6`, 2026-06-12

## Why this matters

`CorpGlobe` (landing `/corporativo`) carrega `globe.gl` via `import('globe.gl')`
dentro de um `useEffect`. Se o import dinâmico falhar (rede lenta, chunk não
servido, WebGL indisponível), o único tratamento é `console.error` — o usuário
fica com um container vazio onde deveria haver o globo 3D, sem nenhuma
indicação. Numa landing B2B de captação corporativa, um buraco visual silencioso
prejudica a percepção de qualidade. A correção é um estado de erro com fallback
estático (imagem ou bloco estilizado), sem custo de bundle adicional relevante.

## Current state

`components/landings/corporativo/CorpGlobe.tsx`:

- `:32-39` — componente, `containerRef`, `useEffect` com `cancelled`/`cleanup`.
- `:41` — `import('globe.gl').then(({ default: Globe }) => { ... })`.
- `:102-104` — único tratamento de falha:
  ```ts
  }).catch((err) => {
      console.error('Failed to load globe.gl:', err);
  });
  ```
- `:106-110` — cleanup do effect (`cancelled = true; cleanup?.()`).
- `:113-119` — render: um único `<div ref={containerRef} className="w-full h-full" .../>`.

Não há estado de React no componente além do ref; ele é puramente imperativo.
WebGL também pode falhar dentro do `.then` (ex.: `globe.renderer()` retorna
algo inválido) — mas o caso primário a cobrir é a falha do import/inicialização.

Convenções (`.claude/rules/code-style.md`): manter render puro, efeitos isolam
comportamento de browser; preferir early returns; preservar export style local
(este arquivo usa `export function CorpGlobe()`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 |
| E2E corporativo | `pnpm test:e2e tests/e2e/corporativo.spec.ts` | passa |
| Suíte regressão | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `components/landings/corporativo/CorpGlobe.tsx` — adicionar estado de
  erro/fallback.

**Out of scope** (NÃO tocar):
- O conteúdo de dados do globo (`ARCS`, `POINTS`) e a configuração visual.
- A lógica de DPR/renderer (não é o foco deste plano).
- Outras landings / componentes.

## Git workflow

- Branch: `fix/009-corpglobe-load-failure-fallback`
- Commit convencional, ex.: `fix(corporativo): fallback visível quando globe.gl falha ao carregar`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Adicionar estado de erro

- Introduzir `const [loadFailed, setLoadFailed] = useState(false);`.
- No `.catch` (`:102`), além do `console.error` existente, chamar
  `if (!cancelled) setLoadFailed(true);`.
- Guardar o `setLoadFailed` atrás do flag `cancelled` para não atualizar estado
  após unmount.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Renderizar o fallback

No JSX (`:113`), quando `loadFailed` for `true`, renderizar um fallback estático
em vez do container do globo. Mantenha simples e alinhado à marca (paleta
`action`/`yellow` já usada no projeto). Opções aceitáveis:

- Um bloco com um ícone/ilustração estática e um texto curto (ex.: "Conectamos
  empresas a destinos no mundo todo") — sem depender de WebGL.
- OU uma imagem estática otimizada via os helpers de mídia existentes
  (`LazyImage` / `lib/media-url.ts`) se houver um asset de globo disponível.

Não jogue um espaço vazio. Mantenha as mesmas dimensões do container
(`w-full h-full`) para não causar layout shift.

```tsx
return loadFailed ? (
    <div className="w-full h-full flex items-center justify-center text-center ...">
        {/* fallback estático de marca */}
    </div>
) : (
    <div ref={containerRef} className="w-full h-full" style={{ ... }} />
);
```

Atenção: quando `loadFailed` é `true`, o `containerRef` não é montado — tudo
bem, pois o effect já falhou. Confirme que o effect não tenta usar o ref depois
(o `cancelled`/early-return em `:42` já cobre).

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Teste e validação manual

Ver "Test plan".

**Verify**: `pnpm test:e2e tests/e2e/corporativo.spec.ts` → passa;
`pnpm test:regression` → exit 0.

## Test plan

- **E2E (Playwright)**: estender `tests/e2e/corporativo.spec.ts`. O caminho
  feliz (globo carrega) já deve ser coberto — confirme. Para o caminho de
  falha, a forma mais robusta no Playwright é interceptar a rota do chunk do
  globe.gl e abortá-la, depois asserir que o fallback aparece:
  ```ts
  await page.route(/globe\.gl|three-globe/, route => route.abort());
  // navegar para /corporativo
  // expect(page.getByText(/fallback text/i)).toBeVisible();
  ```
  Se o padrão de rota do chunk for difícil de prever (hash no nome), use um
  matcher amplo e confirme manualmente. Se a interceptação se mostrar frágil,
  documente e mantenha ao menos a asserção do caminho feliz + verificação manual.
- **Manual**: `pnpm dev`, abrir `/corporativo` com DevTools → Network → throttle
  "Offline" após o primeiro load do HTML, recarregar, confirmar que o fallback
  aparece em vez de um buraco.

## Done criteria

- [ ] `loadFailed` controla a renderização; `.catch` seta o estado
- [ ] Fallback estático visível (sem WebGL), mesmas dimensões do container
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:e2e tests/e2e/corporativo.spec.ts` passa
- [ ] `pnpm test:regression` exit 0
- [ ] `git status` mostra apenas `CorpGlobe.tsx` e o spec de e2e
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se interceptar/abortar a rota do chunk no Playwright quebrar outros testes da
  mesma spec (estado compartilhado de rota), isole o teste de falha ou PARE e
  reporte para decidir a abordagem.
- Se não existir asset de imagem de fallback e a equipe preferir um, PARE e
  pergunte — não invente/baixe assets externos. O fallback textual/ícone é o
  default seguro.
- Se os excertos de "Current state" não baterem, PARE (drift).

## Maintenance notes

- Mesmo padrão (estado de erro + fallback) deve ser aplicado se outras landings
  passarem a usar imports dinâmicos pesados (WebGL/3D).
- Revisor: confirmar que `setLoadFailed` não dispara após unmount (guard
  `cancelled`).
