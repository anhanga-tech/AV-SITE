# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anhangá Viagens is an institutional website for a Brazilian boutique travel agency. It features an AI-powered chatbot (Google Gemini) for travel consultation, destination showcases, blog, and WhatsApp lead generation.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS

## Development Commands

```bash
pnpm dev       # Start dev server at http://localhost:3000
pnpm build     # Production build to /dist
pnpm preview   # Preview production build at http://localhost:4173
pnpm deploy    # Build + deploy to GitHub Pages
pnpm test:regression  # Run regression tests (Node built-in test runner, strip-types)
```

## Environment Variables

```bash
GEMINI_API_KEY=       # Google Gemini API key (required for chatbot)
GEMINI_MODEL=         # Model version (default: gemini-2.5-flash-lite)
HUBSPOT_TOKEN=        # HubSpot private app token (required for lead capture)
HUBSPOT_LOLLAPALOOZA_LIST_ID=  # Optional static list ID for Lollapalooza waitlist contacts
VITE_BASE_PATH=       # Base path for deployment (default: /)
VITE_MEDIA_CDN_URL=   # Optional CDN base URL for media assets
ALLOWED_ORIGIN=       # CORS allowed origin for API (default: *)
```

Copy `.env.example` to `.env` for local development.

## Architecture

### Directory Structure

- `/api` - Vercel Edge Functions: `generate.ts` (AI chatbot proxy) and `submit-lead.ts` (HubSpot CRM)
- `/components` - React components; `/ui` for generic UI, `/schemas` for JSON-LD SEO, `/landings` for event landing pages
- `/pages` - Route-level components (Home, BlogList, BlogPost, BlogRedirect, Terms, Privacy, SiteMap)
- `/services` - `geminiService.ts`: client-side Gemini API communication
- `/hooks` - `useLeadCapture.ts`: lead submission hook
- `/types` - TypeScript types (`leadCapture.ts`)
- `/utils` - `whatsapp.ts` (UTM tracking + link generation), `share.ts`, `blog.ts`
- `/data` - `mediaConfig.ts` (media URLs + optimization), `blogData.ts` (static blog content)

### Key Patterns

**Import Alias:** Use `@/` for root-relative imports (e.g., `@/components/Header`).

**Routing:** BrowserRouter with two layout branches in `App.tsx`:
- `/beto-carrero`, `/lollapalooza`, `/orlando`, `/melhor-idade` → Dedicated landing pages (no Header/Footer in MainSiteShell)
- All other routes → MainSiteShell (Header + AIChat + Footer)
- `/blog` and `/blog/:slug` redirect to an external blog domain via `BlogRedirect.tsx`
- `*` → redirect to `/`
- Pages are lazy-loaded with `React.lazy` + `Suspense`

**AI Chatbot Flow:**
1. `AIChat.tsx` collects conversation history and calls `geminiService.ts`
2. `geminiService.ts` POSTs to `/api/generate` (proxy to Gemini) — uses localhost in dev, `/api/generate` in prod
3. `/api/generate.ts` runs a BANT qualification dialog (Need, Authority, Budget, Timeline) via a state-machine system prompt, enforces single-question-per-response, and calls the `generate_budget_link` tool when qualification is complete
4. The budget link response is displayed with a WhatsApp CTA; under-30-day bookings are handed off to a human agent

**Lead Capture Flow:**
- On budget link generation, `useLeadCapture.ts` submits to `/api/submit-lead.ts`
- `submit-lead.ts` creates/updates a HubSpot contact with BANT summary and UTM attribution
- Error codes: 400 (validation), 401 (bad token), 409 (duplicate email), 500 (server)

**UTM Tracking (`utils/whatsapp.ts`):**
- Captures UTM params and click IDs (gclid, fbclid, ttclid, etc.) from URL on page load
- Extracts GA4 client ID and session ID from cookies
- Persists to `sessionStorage` + cookies (30-day expiry)
- `useWhatsAppLink()` hook appends all tracking params to WhatsApp URLs
- Pushes to GTM `dataLayer` on capture

**Media Assets (`data/mediaConfig.ts`):**
- Cloudinary for hero videos and destination images; Pexels as fallback
- `optimizeRemoteImageUrl()` proxies through wsrv.nl for WebP conversion
- `optimizeCloudinaryUrl()` applies width/format transforms
- `generateSrcSet()` builds responsive srcsets
- To migrate to CDN, set `VITE_MEDIA_CDN_URL`

**API Security (`/api/generate.ts`):**
- Rate limiting: 10 requests/minute per IP (in-memory)
- Message history capped at 50 entries; message size limits enforced
- Block list of 18+ countries/regions (war zones, sanctioned territories)
- Prompt injection prevention in system instruction

**Styling:** Tailwind CSS with brand colors (cyan, blue, yellow, dark, light) and Anhangá palette (`#0056D2`, `#003B8E`, `#FFD600`). Custom animations (`fade-in-up`, `pop-in`, `float`, `blob`) and shadows (`glow`, `hard`, `float`) defined in `tailwind.config.js`. Fonts: Poppins (sans + display/headings — 400/600/700/800/900), Merriweather (serif — blog e pull-quotes).

**SEO:** React Helmet Async for dynamic meta tags. Schema components in `/components/schemas/` emit JSON-LD (LocalBusiness, FAQ, Breadcrumb). GTM (GTM-T2KGS86G) and HubSpot tracking in `index.html`.

### Deployment

- **Vercel** (primary) — `vercel.json` includes security headers, SPA rewrite, and domain redirects (`anhanga.tur.br` → `www.anhanga.tur.br`)
- **Netlify** — `netlify.toml`
- **GitHub Pages** — `pnpm deploy` (requires `VITE_BASE_PATH`)

Build chunks: `react-vendor` and `ai-vendor` (manual split in `vite.config.ts`).

## Git Flow

This project uses **GitHub Flow** — deploy contínuo, sem `develop` branch.

### Branch naming

```
feature/nome-curto       # nova funcionalidade
fix/descricao-do-bug     # correção de bug
chore/o-que-for          # infra, deps, config, refactor
docs/o-que-for           # documentação
```

### Rules

- **Never commit directly to `main`** — always via Pull Request.
- Keep branches short-lived (ideally < 2 days).
- Use **squash merge** into `main` to keep history clean (one commit per feature).
- Use **conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `test:`, `refactor:`.
- The CI job `build-and-test` must pass before merging (enforced by branch protection).
- Resolve all PR conversations before merging.

### Branch protection (active on `main`)

- PR required to merge
- CI `build-and-test` must pass
- Branch must be up to date before merge
- Force push and deletion blocked
- `enforce_admins: false` — admin can bypass for urgent hotfixes (use sparingly)

---

## Rules

This repository uses `/docs/standards/` as the source of truth for engineering rules.

Read these documents before making changes:

1. `/docs/standards/README.md`
2. `/docs/standards/code-style.md`
3. `/docs/standards/testing.md`
4. `/docs/standards/api-conventions.md`
5. `/docs/standards/security.md`

### Agent Contract

- Apply the standards to new code and touched code. Do not expand scope into repo-wide cleanup unless the task explicitly asks for it.
- Keep the current stack and architecture intact: React 19, TypeScript, Vite, Playwright, `node:test`, edge-style API handlers, and shared helpers under `lib/` and `services/`.
- Add or update automated tests for behavior changes. Documentation-only changes do not require runtime tests.
- Validate and sanitize all untrusted input before side effects or outbound provider calls.
- Reuse existing helpers for CORS, client IP extraction, rate limiting, validation, and provider integration instead of creating parallel patterns.
- Do not log secrets, raw tokens, or raw PII. Mask or omit sensitive data in logs.
- When changing or adding API handlers, follow `/docs/standards/api-conventions.md` and use `/docs/standards/templates/api-endpoint-template.md`.
- Record intentional deviations in the appropriate template or PR notes. Silence is not an exception process.

### Working Rule

If tool-specific instruction files exist, use them for workflow details, but use `/docs/standards/` as the engineering source of truth for code style, testing, API behavior, and security expectations.