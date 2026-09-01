# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anhangá Viagens is an institutional website for a Brazilian boutique travel agency. It features an AI-powered chatbot (Google Gemini) for travel consultation, destination showcases, blog, and WhatsApp lead generation.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Cloudflare Pages Functions (handlers edge-style em `api/`, adaptados em `functions/`)

## Development Commands

```bash
pnpm dev                  # Generates blog manifest + sitemap, then starts Vite dev server at http://localhost:3000
pnpm build                # Generates manifest + sitemap, runs Vite build, then prerenders static routes
pnpm preview              # Preview production build at http://localhost:4173
pnpm typecheck            # Type-check without emitting (also regenerates manifest + sitemap first)
pnpm lint:changed         # Lint only files changed vs. the base branch (the CI-enforced ratchet, see docs/standards/linting.md)
pnpm lint                 # Lint the whole repo — informational, not a CI gate (pre-existing debt is expected)
pnpm test:regression      # Run all unit/regression tests (Node built-in test runner via tsx)
pnpm test:e2e             # Run Playwright e2e tests
pnpm test:e2e:ui          # Run Playwright with interactive UI
pnpm test:update-snapshots  # Update visual regression snapshots
pnpm test:size            # Check bundle size limits (bundlesize config)
pnpm doctor               # Run react-doctor diagnostics
pnpm deploy               # Build + deploy to GitHub Pages (requires VITE_BASE_PATH)
pnpm cms:proxy            # Start local Decap CMS proxy server for /admin
```

**Running a single regression test file:**
```bash
tsx --test tests/submit-lead.test.ts
```

**Running a single test by name pattern:**
```bash
tsx --test --test-name-pattern="validates email" tests/submit-lead.test.ts
```

## Environment Variables

Copy `.env.example` to `.env`. Required groups:

```bash
# AI (required)
GEMINI_API_KEY=           # Google Gemini API key
GEMINI_MODEL=             # Optional override (default: gemini-3.1-flash-lite)

# CRM ativo: Odoo (External API JSON-RPC) — ver bloco ODOO_* abaixo.
# Os 5 formulários (lead/contato/quiz/waitlist/nps) postam direto no Odoo. Salesforce e HubSpot foram aposentados.

# Odoo — CRM ativo (required in prod): intake dos 5 formulários via JSON-RPC
ODOO_URL=                     # https://anhanga.odoo.com
ODOO_DB=                      # anhanga
ODOO_LOGIN=                   # e-mail de um usuário Odoo
ODOO_API_KEY=                 # API key (entra no lugar da senha)

# n8n Webhook (required in prod) — só purchase-dispatch após o cut-over Odoo (NPS também migrou pro Odoo)
N8N_WEBHOOK_SECRET=           # Shared HMAC secret validado por /api/purchase-dispatch

# NPS Invitation (required in prod): assina/verifica o link de convite de /api/submit-nps
NPS_INVITE_SECRET=            # HMAC-SHA256 key (lib/nps-invite.ts) — ver docs/ops/nps-invite.md

# Rate limiting (required in prod — module-level state resets per request on Cloudflare)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Decap CMS OAuth (required in prod)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional
SENTRY_DSN=               # Server-side Sentry DSN
VITE_SENTRY_DSN=          # Browser-side Sentry DSN
VITE_MEDIA_BASE_URL=      # Cloudflare R2 media origin (default: https://media.anhanga.tur.br)
VITE_MEDIA_ENABLE_TRANSFORMS=  # Enable Cloudflare image transforms via /cdn-cgi/image
AI_GATEWAY_ENABLED=       # Route Gemini through Cloudflare AI Gateway
AI_GATEWAY_BYOK_ALIAS=    # AI Gateway Provider Key alias (BYOK); makes GEMINI_API_KEY optional
ALLOWED_ORIGIN=           # CORS allowed origin (default: https://www.anhanga.tur.br)
DEBUG=                    # Enable verbose server logs
```

## Architecture

### Routing (`App.tsx`)

Two layout tiers, resolved at the top-level `Routes`:

1. **Landing pages** (no Header/Footer/AIChat): `/beto-carrero`, `/lollapalooza`, `/orlando`, `/melhor-idade`, `/corporativo`, `/consultoria-de-viagem`, `/cruzeiros`, `/nps`, `/quiz`. Several redirect aliases exist (e.g. `/lollapalooza-2026` → `/lollapalooza`, `/curadoria-cruzeiros-brasil` → `/cruzeiros`).
2. **Main site shell** (Header + AIChat + Footer): all other routes via `MainSiteShell`, including `/blog`, `/blog/:slug`, legal pages, `/sobre`, and a catch-all `NotFound`.

`App` accepts `router`, `initialEntries`, `headManager`, and `includeClientFeatures` props — used by `scripts/prerender.mjs` to render static HTML for each route at build time via `MemoryRouter`.

### Directory Layout (key areas)

```
/api          Handlers edge-style (executados como Cloudflare Pages Functions via `functions/`)
/lib          Shared server-side helpers (40+ files, organized into subsystems)
  /ai         Gemini config, BANT prompt, tool definitions, handoff logic
  /schemas    Zod validators for each API endpoint
  /conversions  Google + Meta pixel helpers
/services     Client/server provider integrations (geminiService, odoo)
/hooks        React form hooks (useLeadCapture, useContactForm, useQuizCapture, useWaitlistCapture)
/components   React UI; /ui for primitives, /schemas for JSON-LD, /landings for event pages, /blog for post layout
/pages        Route components; /landings for standalone event pages
/utils        Browser utilities (whatsapp UTM tracking, share, blog helpers)
/data         Static data and generated manifests
/scripts      Build-time generators (blog manifest, sitemap, prerender, reviews fetch)
/tests        Node:test regression tests (65+ files) + Playwright e2e under /tests/e2e
/docs/standards  Engineering source of truth — read before making changes
```

### API Handlers (`/api`)

Handlers rodam como Cloudflare Pages Functions (via `functions/`). O campo `export const config = { runtime: 'edge' }` é um legado do Vercel e não tem efeito no Cloudflare — ignorar. Standard response shape: `{ ok: boolean, code?: string, error?: string, data?: T }`.

| Handler | Purpose |
|---|---|
| `generate.ts` | Gemini chatbot proxy; runs BANT qualification state machine |
| `submit-lead.ts` | Lead capture (chatbot/corporativo) → Odoo `res.partner` + `crm.lead` |
| `submit-contact.ts` | Quick contact form → Odoo `res.partner` + `crm.lead` |
| `submit-waitlist.ts` | Event waitlist → Odoo `res.partner` (ToFu, sem oportunidade) |
| `submit-nps.ts` | Post-trip NPS form → Odoo `res.partner` (`x_nps_score` + nota; sem oportunidade). Requer convite assinado (`token`, `lib/nps-invite.ts`) — identidade nunca vem do corpo da requisição |
| `submit-quiz.ts` | Travel quiz results → Odoo `res.partner` (ToFu, sem oportunidade) |
| `purchase-dispatch.ts` | Receives n8n purchase events; validates `N8N_WEBHOOK_SECRET` |
| `auth.ts` / `auth/callback.ts` | GitHub OAuth for Decap CMS `/admin` |
| `health.ts` | Health check |
| `markdown.ts` | Serves blog content as Markdown (content negotiation) |
| `api-catalog.ts` / `api-docs.ts` / `openapi.ts` | RFC 9727 catalog, human docs, OpenAPI 3.0 schema |

Cross-cutting handler concerns live in shared helpers — always reuse them:
- `lib/network.ts` — `buildCorsHeaders()`, `getClientIp()`, `createRequestId()`
- `lib/rate-limit.ts` — Upstash Redis rate limiter (required in prod; falls back to allow in dev)
- `lib/schemas/` — Zod validators for each endpoint's request body
- `lib/logger.ts` — Structured logger that masks secrets and PII

### AI Chatbot Flow

1. `AIChat.tsx` maintains conversation history, calls `geminiService.ts`
2. `geminiService.ts` POSTs to `/api/generate` (localhost in dev, `/api/generate` in prod)
3. `api/generate.ts` orchestrates: validates input → rate limits → calls Gemini with `SYSTEM_INSTRUCTION` from `lib/ai/prompt.ts` → extracts `generate_budget_link` tool call when BANT qualification is complete → runs handoff logic in `lib/ai/handoff.ts`
4. Qualification state (Need, Authority, Budget, Timeline) is managed by the system prompt; the handler enforces single-question-per-response and safety blocks via `lib/ai/validation.ts`
5. Under-30-day bookings are handed off to a human agent rather than generating a budget link

The AI subsystem is fully isolated in `lib/ai/`: `constants.ts` (models, budget ranges, blocked countries), `types.ts`, `gemini-config.ts` (native Gemini vs. Cloudflare AI Gateway), `prompt.ts`, `tools.ts`, `handoff.ts`, `utils.ts`, `validation.ts`.

### Lead Capture Flow

Os 5 formulários (lead/contato/quiz/waitlist/nps) postam **direto no Odoo** via External API JSON-RPC (cut-over do n8n/Salesforce em jun/2026 + NPS no mesmo cut-over):
1. `useLeadCapture.ts` (e os hooks de contato/quiz/waitlist/nps) coletam BANT/perfil + atribuição UTM + opt-in de marketing
2. Submetem a `/api/submit-{lead,contact,quiz,waitlist,nps}.ts`
3. O handler valida/normaliza (`lib/lead-logic.ts`, `lib/quiz-logic.ts`, `lib/waitlist-logic.ts`, Zod em `lib/schemas/`)
4. `createOdooSubmitHandler` (`lib/odoo-submit-handler.ts`) chama `services/odoo.ts` (JSON-RPC sobre fetch — runtime Workers não roda `xmlrpc`): `openOdooSession` → `upsertPartner` (dedup por e-mail) **+** `createLead` em lead/contato
5. Mapeamento puro em `lib/odoo-lead-mapping.ts`: `res.partner` (incl. `x_perfil_do_viajante` no quiz, `x_lgpd_consent` via opt-in de e-mail marketing, `x_nps_score` no NPS) e `crm.lead` (opportunity, `partner_id` ligado, `source_id`/`medium_id` por UTM). Quiz/waitlist/nps são partner-only → só `res.partner` (NPS não cria `crm.lead`: a oportunidade já está Ganha quando o NPS chega). NPS preserva o `name` do parceiro existente (`upsertPartner(fields, { preserveName: true })`) porque o formulário só coleta o primeiro nome. `purchase-dispatch` é o único uso restante de `N8N_WEBHOOK_SECRET` (inbound).
6. Falha do Odoo retorna erro visível (502/504, code `ODOO_ERROR`) → fallback de WhatsApp do cliente. Error codes: 400 (validation), 429 (rate limit), 500 (config), 502/504 (Odoo)

### UTM Tracking (`utils/whatsapp.ts`)

On page load: captures UTM params + click IDs (gclid, fbclid, ttclid, etc.), extracts GA4 client/session IDs from cookies, persists to `sessionStorage` + 30-day cookies, pushes to GTM `dataLayer`. The `useWhatsAppLink()` hook appends all tracking params to every WhatsApp CTA URL.

### Media Assets (`lib/media-url.ts`, `lib/media-assets.ts`)

- Default origin: `https://media.anhanga.tur.br` (Cloudflare R2), overridable via `VITE_MEDIA_BASE_URL`
- Cloudflare image transforms via `/cdn-cgi/image/...` when `VITE_MEDIA_ENABLE_TRANSFORMS=true`
- `lib/media-assets.ts`: `optimizeRemoteImageUrl()` (wsrv.nl WebP proxy), `optimizeCloudinaryUrl()`, `generateSrcSet()`

### Blog

Blog posts are MDX files processed by `@mdx-js/rollup`. `scripts/generate-blog-manifest.ts` generates a manifest at build/dev time. Posts com `date` futura são ocultados no build de produção (CF Pages/main) e publicados pelo rebuild diário de `.github/workflows/scheduled-publish.yml` — ver `lib/blog-schedule.js` e `content/blog/README.md`. `pages/BlogList.tsx` and `pages/BlogPost.tsx` serve the blog locally. `/old-blog` and `/old-blog/:slug` redirect to an external domain via `BlogRedirect.tsx`. `api/markdown.ts` serves raw markdown for content negotiation (`Accept: text/markdown`).

### CMS

Decap CMS at `/admin`. Authenticates via GitHub OAuth through `api/auth.ts` + `api/auth/callback.ts`. Run `pnpm cms:proxy` locally alongside `pnpm dev` to use the CMS editor.

### Styling

Tailwind CSS (`tailwind.config.mjs`). Brand palette: `action` (#0056D2), `actionDark` (#003B8E), `yellow` (#FFD600). Custom animations: `fade-in-up`, `fade-in-down`, `pop-in`, `draw`, `float`, `blob`. Custom shadows: `glow`, `float`, `hard`, `hard-yellow`. Fonts: Poppins (sans + display headings), Merriweather (serif for blog prose). Design tokens shared between CSS and TS via `lib/design-tokens.ts`. The canonical Tailwind color namespace is `anhanga-*` (semantic tokens in `lib/design-tokens.ts`); `brand-*` is legacy and frozen by `tests/tailwind-brand-namespace-guard.test.ts` — new code must use `anhanga-*`.

### Design Context

Source of truth for design decisions, maintained by the `/impeccable` skill. Read before any UI/UX work:

- **[PRODUCT.md](../PRODUCT.md)** (strategic — who/what/why): register (`brand`), users, brand personality, anti-references, design principles, accessibility. **Wins on voice/strategy decisions.**
- **[DESIGN.md](../DESIGN.md)** + **[.impeccable/design.json](../.impeccable/design.json)** (visual — how it looks): the "O Diário de Bordo" system — tokens, colors, typography, elevation, components, do's & don'ts. **Wins on visual decisions.**

Five strategic principles (from PRODUCT.md): conversa não transação · curadoria sobre catálogo · peso físico só onde se age · lugares reais não categorias · mobile-first e íntimo por padrão. The `anhanga-*` Tailwind tokens above are the implementation of DESIGN.md's palette.

### SEO + Prerender

`lib/head.ts` provides `HeadContext` for SSR-safe head management (replaces React Helmet in SSR context). `scripts/prerender.mjs` renders each route via `MemoryRouter` + `HeadContext` at build time. Schema components in `/components/schemas/` emit JSON-LD (LocalBusiness, FAQ, Breadcrumb).

### Deployment

- **Cloudflare Pages** (primário) — `wrangler.toml` (`pages_build_output_dir = "dist"`), functions em `functions/` (incl. `_middleware.ts`), Node 24 via `.node-version`. Secrets configurados no dashboard do Pages.
- **Vercel** (legado/secundário) — `vercel.json` mantido no repo para compatibilidade; não é a plataforma ativa.
- **Netlify** (legado/secundário) — `netlify.toml` mantido no repo.
- **GitHub Pages** — `pnpm deploy` with `VITE_BASE_PATH` (estático, sem API)

Build chunks: `react-vendor`, `ai-vendor`, `leaflet-vendor` (manual split in `vite.config.ts`).

## Testing

**Regression tests** (`tests/*.test.ts`, 65+ files): Node built-in `node:test` runner via `tsx`. Cover API handler contracts, validation logic, lib helpers, schema compliance, and security hardening. Run with `pnpm test:regression` or individually with `tsx --test tests/<file>.test.ts`.

**E2E tests** (`tests/e2e/*.spec.ts`): Playwright. Cover browser flows: chatbot lead submit, visual regression, destructive/security scenarios. Run with `pnpm test:e2e`.

**Completion checks** — run the relevant command before closing a task:
- `pnpm test:regression` for unit/regression changes
- `pnpm test:e2e` for browser-visible or critical-path changes
- `pnpm typecheck` for TypeScript contract changes
- `pnpm lint:changed` for any `.ts`/`.tsx` change (see `docs/standards/linting.md`)

## Documentation Organization

Keep the project root minimal — only `README.md`, `CLAUDE.md`, and code/tooling configs belong there. All other documentation lives under `/docs/`, organized by domain:

| Directory | Contents |
|---|---|
| `docs/standards/` | Engineering source of truth (code style, testing, API conventions, security) |
| `docs/ops/` | Deploy, troubleshooting, GitHub workflows, agents, security policy, Cloudflare rules |
| `docs/design/` | Brand-system assets (`brand-system/`) + pointers to the canonical design system, which lives at root: `DESIGN.md` + `.impeccable/design.json` |
| `docs/product/` | Product strategy and positioning |
| `docs/seo/` | SEO plans, action plans, backlink strategy — **entirely gitignored** (repo is public; see Rules below) |
| `docs/marketing/` | Brand profile, content calendars, brand reviews |
| `docs/compliance/` | LGPD/RIPD and data-deletion documentation |
| `docs/baselines/` | Point-in-time infrastructure/state snapshots |
| `docs/n8n/`, `docs/superpowers/` | Automation and agent workflow docs |

**Rules for new documentation:**
- New strategy/audit/planning docs go into the matching `docs/<domain>/` subfolder — never the root.
- Reports and briefs containing sensitive business data (ad account IDs, spend figures, competitive intelligence, active campaign strategy) stay **local only** — add the filename pattern to `.gitignore` instead of committing.
- `docs/seo/` specifically is **entirely local-only** (`.gitignore`'d as a whole directory, not file-by-file) — the repo is public, and SEO/GEO strategy content (competitor traffic and backlink data, outreach drafts with real contacts, content priorities) is exactly the kind of thing not to expose there. Write new SEO docs into `docs/seo/` as usual (it's a normal working directory locally), just don't expect `git add` to track them — that's intentional.
- When a doc is superseded (new audit, new plan version), delete the old one rather than letting both linger — `git log` preserves history if needed.
- If a moved/renamed doc is referenced elsewhere (other docs, tests, scripts), update those references in the same change.

## Git Flow

GitHub Flow — continuous deployment, no `develop` branch.

**Branch naming:** `feature/`, `fix/`, `chore/`, `docs/`

**Rules:**
- Never commit directly to `main` — always via PR
- Use squash merge into `main`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `test:`, `refactor:`
- CI `build-and-test` must pass before merging

### Fluxo de PR (para o agente)

- **Merge é sempre humano** (squash via GitHub). O agente nunca executa `gh pr merge` nem considera a tarefa concluída no merge — o estado final do agente é "PR pronta para merge".
- Uma PR só está **pronta** quando: checks verdes **+** reviews dos bots tratados **+** sem merge conflicts. Os bots de review são `chatgpt-codex-connector[bot]` e `claude[bot]` — o `gemini-code-assist` foi substituído pelo Codex e não comenta mais aqui. Após o CI passar, sempre buscar reviews pendentes: `gh api repos/felipewilliam2/AV-SITE/pulls/<N>/comments` e `.../pulls/<N>/reviews`. Reviews chegam *depois* do CI verde — não declarar a PR pronta sem checar.
- Ambos os bots comentam *inline*, o que abre review threads. A `main` tem `required_conversation_resolution`: responder ao comentário **não** resolve a thread, e uma thread aberta deixa `mergeStateStatus` em `BLOCKED` mesmo com tudo verde. Resolver é um passo GraphQL separado (`resolveReviewThread`).
- Nem todo apontamento de bot é válido: o `claude[bot]` já reapontou coisa que já estava correta **no próprio commit analisado** (e o `gemini-code-assist` fazia o mesmo antes da troca). Não há caso observado com o Codex, o que não o isenta — o padrão é possível em qualquer bot. Conferir contra o conteúdo real (`git show <commit>:<arquivo>`) antes de aceitar.
- CodeQL usa default setup e pode aparecer como "skipping"/neutral — **não é falha** (`gh pr checks` retorna exit code 8 nesse caso; ignorar esse exit).
- Para poll de CI/reviews, usar a ferramenta **Monitor** em background — nunca `sleep` em foreground (bloqueado pelo sandbox). Para acompanhamento contínuo até a PR ficar pronta, usar a skill `pr-babysit`.
- Presets de custo (salvo pedido contrário do usuário): issue rotineira/fix pontual → effort low/medium; feature ou refactor multi-arquivo → medium/high; review de segurança ou debugging difícil → high.

## Engineering Standards

`/docs/standards/` is the source of truth. Read before making changes:

1. `/docs/standards/README.md` — standards map and exception process
2. `/docs/standards/code-style.md` — TypeScript, React, naming, imports, Tailwind
3. `/docs/standards/linting.md` — the `pnpm lint:changed` ratchet, what's enforced today, adoption path
4. `/docs/standards/testing.md` — node:test, Playwright, regression coverage
5. `/docs/standards/api-conventions.md` — handler patterns, validation, JSON responses
6. `/docs/standards/security.md` — sanitization, secrets, webhooks, rate limits, AI safety

Templates in `/docs/standards/templates/`: `api-endpoint-template.md` (required for new endpoints), `pr-checklist.md`, `change-plan-template.md`.

### Agent Contract

- Apply standards to new and touched code only — do not expand scope to repo-wide cleanup
- Keep stack intact: React 19, TypeScript, Vite, Playwright, `node:test`, edge-style API handlers, shared helpers under `lib/` and `services/`
- Add or update automated tests for every behavior change; docs-only changes are exempt
- Validate and sanitize all untrusted input before side effects or outbound provider calls
- Reuse `lib/network.ts`, `lib/rate-limit.ts`, `lib/lead-logic.ts`, and `lib/schemas/` instead of creating parallel patterns
- When adding API handlers, use `/docs/standards/templates/api-endpoint-template.md`
- Record intentional rule deviations in PR notes; silence is not an exception process

## Agent skills

### Issue tracker

Work is tracked in GitHub Issues for `felipewilliam2/AV-SITE`; external pull
requests are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the repository's existing `status:*`, `question`, and `wontfix` labels for
the five canonical triage roles. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. Read the existing product, design, and
engineering standards first, plus `CONTEXT.md` and relevant ADRs when those
files exist. See `docs/agents/domain.md`.
