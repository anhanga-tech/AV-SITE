# Plan 004: Converter links internos absolutos para navegação SPA (Link/href relativo)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d27f8b0..HEAD -- components pages`
> Se arquivos in-scope mudaram desde a escrita do plano, compare os excertos
> de "Current state" com o código vivo antes de prosseguir; em divergência,
> trate como STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction / tech-debt
- **Planned at**: commit `d27f8b0`, 2026-06-12

## Why this matters

Item explícito do backlog do repo (`TODO.MD`, seção "Técnico & Performance"): vários componentes — especialmente as landing pages — usam `<a href="https://www.anhanga.tur.br/...">` para navegação **interna**, em vez de `<Link>` do react-router ou href relativo. Isso força full page reload, quebra a navegação em ambientes de preview (a URL absoluta aponta para produção, não para o preview) e duplica o padrão de navegação. Convertendo, a navegação vira SPA consistente e os previews de branch funcionam.

## Current state

- `TODO.MD:5` — "**Padronizar navegação interna nas landing pages**: Substituir `<a href="https://www.anhanga.tur.br/">` por `<Link to="/">` do `react-router-dom` em todas as landings... Fazer de uma vez em todas para manter consistência."
- Arquivos com `href="https://www.anhanga.tur.br` hoje (confirmado por grep em d27f8b0):
  - `components/landings/shared/LandingNav.tsx:13` — `<a href="https://www.anhanga.tur.br/" aria-label="Voltar para o site principal">`
  - `components/landings/shared/LandingFooter.tsx:19` — idem, link para home
  - `components/landings/corporativo/CorpLgpdConsent.tsx`
  - `components/landings/lollapalooza/WaitlistSection.tsx`
  - `components/privacy/PrivacySection14Canais.tsx`
  - `components/blog/BlogPostHero.tsx`
  - `components/ChatLeadForm.tsx:319` — link de Política de Privacidade com `target="_blank"`
  - `pages/Terms.tsx`
  - `pages/landings/CuradoriaCruzeirosBrasilLanding.tsx`, `BetoCarreroLanding.tsx`, `CorporativoLanding.tsx`, `ConsultoriaDeViagemLanding.tsx`, `OrlandoLanding.tsx`, `MelhorIdadeLanding.tsx`, `LollapaloozaLanding.tsx`
- Arquitetura relevante: as landings são rotas do mesmo SPA (`App.tsx` faz o roteamento de tudo, com landings fora do `MainSiteShell`), então `<Link>` funciona nelas. O site também é pré-renderizado por `scripts/prerender.mjs` via `MemoryRouter` — `<Link>` é compatível; `window.location` não seria.
- Regra de conversão:
  - Navegação interna normal → `<Link to="/caminho/">` (`import { Link } from 'react-router-dom'`).
  - Links com `target="_blank"` (ex.: política de privacidade aberta em nova aba a partir de um formulário) → manter `<a>` mas trocar a URL absoluta por **href relativo** (`href="/politica-privacidade/"`), preservando `target` e `rel`.
  - Links dentro de strings HTML estáticas controladas (se houver `dangerouslySetInnerHTML` em `pages/Terms.tsx`/privacy) → trocar para href relativo na string; não converter para `<Link>`.
- Convenção SEO do projeto: caminhos internos usam **trailing slash** (ver memória/convenções SEO) — preserve o trailing slash existente nas URLs.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 |
| Enumerar restantes | `grep -rn 'href="https://www.anhanga.tur.br' components pages` | (ver done criteria) |
| Build + prerender | `pnpm build` | exit 0 |
| E2E | `pnpm test:e2e` | todos passam |

## Scope

**In scope**: somente os arquivos listados em "Current state" (re-enumere com o grep — a lista exata no momento da execução é a verdade).

**Out de scope** (NÃO tocar):
- `utils/whatsapp.ts` e quaisquer URLs de WhatsApp/CTA externas — são externas por definição.
- URLs absolutas em componentes de schema JSON-LD (`components/schemas/`) e meta tags/SEO (`lib/head.ts`, sitemap) — SEO exige URL canônica absoluta; **não** converter.
- E-mails, links para domínios externos (`media.anhanga.tur.br`, blogs externos etc.).
- `App.tsx` e rotas.

## Git workflow

- Branch: `fix/004-landing-spa-navigation`
- Commit convencional, ex.: `fix(nav): usar Link/href relativo para navegação interna nas landings`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Enumerar e classificar

Rode `grep -rn 'href="https://www.anhanga.tur.br' components pages` e classifique cada ocorrência: (a) navegação interna → `<Link>`; (b) `target="_blank"` ou HTML string → href relativo; (c) JSON-LD/meta/canonical → fora de escopo, não tocar.

**Verify**: lista classificada produzida (anote no PR/relatório).

### Step 2: Converter componentes compartilhados primeiro

Converta `components/landings/shared/LandingNav.tsx` e `LandingFooter.tsx` (afetam todas as landings).

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Converter os demais arquivos classe (a) e (b)

Um commit lógico; preserve classes Tailwind, `aria-label`, `target`, `rel` existentes.

**Verify**: `grep -rn 'href="https://www.anhanga.tur.br' components pages` → restam apenas ocorrências classe (c) (JSON-LD/meta/canonical).

### Step 4: Build, prerender e e2e

**Verify**: `pnpm build` → exit 0 (prerender incluído); `pnpm test:e2e` → todos passam.

## Test plan

- A cobertura principal é o e2e existente (`pnpm test:e2e`), que cobre navegação e landings críticas.
- Adicione um teste Playwright em `tests/e2e/` (modele nos specs existentes, ex.: padrão de `tests/e2e/pages/`) que: abre `/beto-carrero`, clica no link "Voltar para o site principal" do `LandingNav` e asserta que a navegação foi client-side para `/` (URL relativa do mesmo host do teste, sem hit a `www.anhanga.tur.br`).
- Snapshots visuais: se o visual regression acusar diff, trate como STOP (não deveria haver mudança visual).

## Done criteria

- [ ] `grep -rn 'href="https://www.anhanga.tur.br' components pages` retorna somente ocorrências classe (c) documentadas no PR
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm build` exit 0
- [ ] `pnpm test:e2e` exit 0, incluindo o novo spec de navegação
- [ ] `git status` mostra apenas arquivos in-scope
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se uma landing usar `window.location` ou lógica que dependa de full page reload (procure no arquivo antes de converter), PARE e reporte esse arquivo.
- Se o prerender (`pnpm build`) falhar após a conversão, PARE — pode indicar uso de `<Link>` fora de contexto de Router em algum componente renderizado isoladamente.
- Se o visual regression mudar, PARE e reporte.

## Maintenance notes

- Novas landings devem usar `LandingNav`/`LandingFooter` compartilhados — revisor deve recusar novos `href` absolutos internos.
- Follow-up deferido: o item irmão do TODO.MD (padronização Cloudinary + CLS) não faz parte deste plano.
