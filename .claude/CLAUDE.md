# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anhangá Viagens is an institutional website for a Brazilian boutique travel agency. It features an AI-powered chatbot (Google Gemini) for travel consultation, destination showcases, blog, and WhatsApp lead generation.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Vercel Edge Functions

## Development Commands

```bash
pnpm dev                  # Generates blog manifest + sitemap, then starts Vite dev server at http://localhost:3000
pnpm build                # Generates manifest + sitemap, runs Vite build, then prerenders static routes
pnpm preview              # Preview production build at http://localhost:4173
pnpm typecheck            # Type-check without emitting (also regenerates manifest + sitemap first)
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

# HubSpot CRM (required)
HUBSPOT_TOKEN=            # Private app token
HUBSPOT_DEAL_PIPELINE_ID= # Pipeline for new deals
HUBSPOT_DEAL_STAGE_ID=    # Stage for new deals

# n8n Webhooks (required in prod)
N8N_WEBHOOK_SECRET=           # Shared HMAC secret for inbound n8n calls
N8N_SUBMIT_CONTACT_WEBHOOK_URL=   # Contact form webhook
NPS_WEBHOOK_URL=              # Post-trip NPS form webhook

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
ALLOWED_ORIGIN=           # CORS allowed origin (default: https://www.anhanga.tur.br)
DEBUG=                    # Enable verbose server logs
```

## Architecture

### Routing (`App.tsx`)

Two layout tiers, resolved at the top-level `Routes`:

1. **Landing pages** (no Header/Footer/AIChat): `/beto-carrero`, `/lollapalooza`, `/orlando`, `/melhor-idade`, `/corporativo`, `/consultoria-de-viagem`, `/curadoria-cruzeiros-brasil`, `/nps`, `/quiz`. Several redirect aliases exist (e.g. `/lollapalooza-2026` → `/lollapalooza`).
2. **Main site shell** (Header + AIChat + Footer): all other routes via `MainSiteShell`, including `/blog`, `/blog/:slug`, legal pages, `/sobre`, and a catch-all `NotFound`.

`App` accepts `router`, `initialEntries`, `headManager`, and `includeClientFeatures` props — used by `scripts/prerender.mjs` to render static HTML for each route at build time via `MemoryRouter`.

### Directory Layout (key areas)

```
/api          Vercel Edge Functions (15 handlers)
/lib          Shared server-side helpers (40+ files, organized into subsystems)
  /ai         Gemini config, BANT prompt, tool definitions, handoff logic
  /schemas    Zod validators for each API endpoint
  /conversions  Google + Meta pixel helpers
/services     Client/server provider integrations (geminiService, n8n, hubspot, salesforce)
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

All handlers export `export const config = { runtime: 'edge' }`. Standard response shape: `{ ok: boolean, code?: string, error?: string, data?: T }`.

| Handler | Purpose |
|---|---|
| `generate.ts` | Gemini chatbot proxy; runs BANT qualification state machine |
| `submit-lead.ts` | Lead capture → HubSpot via n8n webhook |
| `submit-contact.ts` | Quick contact form → n8n |
| `submit-waitlist.ts` | Event waitlist → n8n |
| `submit-nps.ts` | Post-trip NPS form → n8n |
| `submit-quiz.ts` | Travel quiz results → n8n |
| `submit-lead-sf.ts` | Alternative Salesforce lead path |
| `hubspot-webhook.ts` | Inbound HubSpot "Closed-Won" deal events |
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

Lead data flows through n8n (not directly to HubSpot):
1. `useLeadCapture.ts` collects BANT summary + UTM attribution from `geminiService.ts`
2. Submits to `/api/submit-lead.ts`
3. Handler validates + normalizes via `lib/lead-logic.ts` and Zod schema in `lib/schemas/submit-lead.ts`
4. Calls n8n webhook (`N8N_SUBMIT_CONTACT_WEBHOOK_URL`) via `services/n8n.ts` with payload shaped by `lib/n8n-payloads.ts`
5. n8n creates/updates the HubSpot contact and deal via `HUBSPOT_TOKEN`
6. Error codes: 400 (validation), 401 (bad token), 429 (rate limit), 500 (server/n8n)

### UTM Tracking (`utils/whatsapp.ts`)

On page load: captures UTM params + click IDs (gclid, fbclid, ttclid, etc.), extracts GA4 client/session IDs from cookies, persists to `sessionStorage` + 30-day cookies, pushes to GTM `dataLayer`. The `useWhatsAppLink()` hook appends all tracking params to every WhatsApp CTA URL.

### Media Assets (`lib/media-url.ts`, `lib/media-assets.ts`)

- Default origin: `https://media.anhanga.tur.br` (Cloudflare R2), overridable via `VITE_MEDIA_BASE_URL`
- Cloudflare image transforms via `/cdn-cgi/image/...` when `VITE_MEDIA_ENABLE_TRANSFORMS=true`
- `lib/media-assets.ts`: `optimizeRemoteImageUrl()` (wsrv.nl WebP proxy), `optimizeCloudinaryUrl()`, `generateSrcSet()`

### Blog

Blog posts are MDX files processed by `@mdx-js/rollup`. `scripts/generate-blog-manifest.ts` generates a manifest at build/dev time. `pages/BlogList.tsx` and `pages/BlogPost.tsx` serve the blog locally. `/old-blog` and `/old-blog/:slug` redirect to an external domain via `BlogRedirect.tsx`. `api/markdown.ts` serves raw markdown for content negotiation (`Accept: text/markdown`).

### CMS

Decap CMS at `/admin`. Authenticates via GitHub OAuth through `api/auth.ts` + `api/auth/callback.ts`. Run `pnpm cms:proxy` locally alongside `pnpm dev` to use the CMS editor.

### Styling

Tailwind CSS (`tailwind.config.mjs`). Brand palette: `action` (#0056D2), `actionDark` (#003B8E), `yellow` (#FFD600). Custom animations: `fade-in-up`, `fade-in-down`, `pop-in`, `draw`, `float`, `blob`. Custom shadows: `glow`, `float`, `hard`, `hard-yellow`. Fonts: Poppins (sans + display headings), Merriweather (serif for blog prose). Design tokens shared between CSS and TS via `lib/design-tokens.ts`.

### SEO + Prerender

`lib/head.ts` provides `HeadContext` for SSR-safe head management (replaces React Helmet in SSR context). `scripts/prerender.mjs` renders each route via `MemoryRouter` + `HeadContext` at build time. Schema components in `/components/schemas/` emit JSON-LD (LocalBusiness, FAQ, Breadcrumb).

### Deployment

- **Vercel** (primary) — `vercel.json`: security headers, SPA rewrite, domain redirects (`anhanga.tur.br` → `www`, `beto.anhanga.tur.br` → `/beto-carrero`)
- **Netlify** — `netlify.toml`
- **GitHub Pages** — `pnpm deploy` with `VITE_BASE_PATH`

Build chunks: `react-vendor`, `ai-vendor`, `leaflet-vendor` (manual split in `vite.config.ts`).

## Testing

**Regression tests** (`tests/*.test.ts`, 65+ files): Node built-in `node:test` runner via `tsx`. Cover API handler contracts, validation logic, lib helpers, schema compliance, and security hardening. Run with `pnpm test:regression` or individually with `tsx --test tests/<file>.test.ts`.

**E2E tests** (`tests/e2e/*.spec.ts`): Playwright. Cover browser flows: chatbot lead submit, visual regression, destructive/security scenarios. Run with `pnpm test:e2e`.

**Completion checks** — run the relevant command before closing a task:
- `pnpm test:regression` for unit/regression changes
- `pnpm test:e2e` for browser-visible or critical-path changes
- `pnpm typecheck` for TypeScript contract changes

## Git Flow

GitHub Flow — continuous deployment, no `develop` branch.

**Branch naming:** `feature/`, `fix/`, `chore/`, `docs/`

**Rules:**
- Never commit directly to `main` — always via PR
- Use squash merge into `main`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `test:`, `refactor:`
- CI `build-and-test` must pass before merging

## Engineering Standards

`/docs/standards/` is the source of truth. Read before making changes:

1. `/docs/standards/README.md` — standards map and exception process
2. `/docs/standards/code-style.md` — TypeScript, React, naming, imports, Tailwind
3. `/docs/standards/testing.md` — node:test, Playwright, regression coverage
4. `/docs/standards/api-conventions.md` — handler patterns, validation, JSON responses
5. `/docs/standards/security.md` — sanitization, secrets, webhooks, rate limits, AI safety

Templates in `/docs/standards/templates/`: `api-endpoint-template.md` (required for new endpoints), `pr-checklist.md`, `change-plan-template.md`.

### Agent Contract

- Apply standards to new and touched code only — do not expand scope to repo-wide cleanup
- Keep stack intact: React 19, TypeScript, Vite, Playwright, `node:test`, edge-style API handlers, shared helpers under `lib/` and `services/`
- Add or update automated tests for every behavior change; docs-only changes are exempt
- Validate and sanitize all untrusted input before side effects or outbound provider calls
- Reuse `lib/network.ts`, `lib/rate-limit.ts`, `lib/lead-logic.ts`, and `lib/schemas/` instead of creating parallel patterns
- When adding API handlers, use `/docs/standards/templates/api-endpoint-template.md`
- Record intentional rule deviations in PR notes; silence is not an exception process
