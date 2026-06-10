# Cloudflare rules and production operations

This document is the repo-visible operating map for Cloudflare settings that affect
production but are not fully represented by code files. It should be updated when a
Cloudflare dashboard rule changes, when `wrangler.toml` changes, or when live
verification shows drift.

Related evidence:

- Baseline measurements: [`docs/baselines/cloudflare-2026-05-23.md`](./baselines/cloudflare-2026-05-23.md)
- Media cache rule details: [`docs/ops/cloudflare-cache-rules.md`](./cloudflare-cache-rules.md)
- Cloudflare Security Insights export: [`docs/cloudflare-security-insights-20260510-2123.csv`](./cloudflare-security-insights-20260510-2123.csv)
- Repo regression guard: [`tests/cloudflare-config.test.ts`](../tests/cloudflare-config.test.ts)

## Source of truth boundaries

| Area | Source of truth | How to verify |
|---|---|---|
| Pages project name, output directory, compatibility flags, build/runtime vars | `wrangler.toml`, `.node-version` | `pnpm exec tsx --test tests/cloudflare-config.test.ts` |
| Cloudflare Pages response headers | `public/_headers` | `curl -sSI https://www.anhanga.tur.br/` and `tests/cloudflare-config.test.ts` |
| Path redirects that do not depend on hostname | `public/_redirects` | `tests/cloudflare-config.test.ts` |
| Host-based redirects and cross-host canonicalization | Cloudflare dashboard Redirect Rules | `curl -sSI https://anhanga.tur.br/` and `curl -sSI http://www.anhanga.tur.br/` |
| Media/video cache behavior | Cloudflare dashboard Cache Rules, documented in `docs/ops/cloudflare-cache-rules.md` | Repeated GET requests with `Range` headers; do not rely on HEAD for cache population |
| Speed Brain and Web Analytics | Cloudflare dashboard | Response header `speculation-rules` and Cloudflare Web Analytics UI |
| WAF and rate-limit rules | Cloudflare dashboard; paid-plan feature for this zone | Record as unavailable or unverified until the plan supports it |
| SSL/TLS and HSTS decisions | Cloudflare dashboard plus `public/_headers` | `curl -sSI https://www.anhanga.tur.br/` and Cloudflare SSL/TLS UI |

Repo files are authoritative only for the settings they can actually deploy. Dashboard
settings are authoritative for Cloudflare products that are not expressible in Pages
files. Live HTTP checks are the tie-breaker when repo and dashboard expectations disagree.

## Pages project and runtime assumptions

- Pages project: `av-site`.
- Build output directory: `dist`.
- Node runtime target: `.node-version` must stay at `24`; `wrangler.toml` also sets
  `NODE_VERSION = "24"`.
- Compatibility date: `2024-09-23`.
- Compatibility flags: `nodejs_compat`.
- Production placement: `[env.production.placement] mode = "smart"`.
- Top-level `[vars]` and `[env.production.vars]` must remain mirrored when a variable
  applies to production. Cloudflare does not inherit top-level vars into an environment
  once `[env.production]` exists.

Critical variables to keep aligned:

| Variable | Expected production role |
|---|---|
| `ALLOWED_ORIGIN` | Canonical browser origin, currently `https://www.anhanga.tur.br` |
| `SITE_URL` | Canonical public site URL, currently `https://www.anhanga.tur.br` |
| `VITE_MEDIA_BASE_URL` | Managed media zone, currently `https://media.anhanga.tur.br` |
| `VITE_MEDIA_TRANSFORM_ZONE_URL` | Cloudflare Image Transformations zone, currently `https://media.anhanga.tur.br` |
| `VITE_MEDIA_ENABLE_TRANSFORMS` | Enables transformed media URLs; expected `true` |
| `AI_GATEWAY_ENABLED` and `CLOUDFLARE_AI_GATEWAY_ID` | Gemini routing through Cloudflare AI Gateway |
| `GA4_MEASUREMENT_ID`, `META_PIXEL_ID`, conversion IDs | Client analytics and conversion tracking identifiers |

Do not document secrets in this file. If a Cloudflare Pages secret is required, document
the variable name and verification command, not the secret value.

## Redirect Rules outside `_redirects`

`public/_redirects` is still the source of truth for path-only redirects such as legacy
blog tags, Lollapalooza slug cleanup, admin slash normalization, and `.well-known`
API discovery routes.

The following rules must live in the Cloudflare dashboard because they depend on the
request hostname:

| Rule | Expected behavior | Verification |
|---|---|---|
| Apex canonical host | `https://anhanga.tur.br/*` redirects to `https://www.anhanga.tur.br/$1` with `301` | `curl -sSI https://anhanga.tur.br/` should return `301` and `Location: https://www.anhanga.tur.br/` |
| HTTP canonicalization | `http://www.anhanga.tur.br/*` redirects to HTTPS | `curl -sSI http://www.anhanga.tur.br/` should return `301` and `Location: https://www.anhanga.tur.br/` |
| Beto host landing redirect | `beto.anhanga.tur.br/*` redirects to the Beto Carrero landing route | `curl -sSI https://beto.anhanga.tur.br/` should resolve and return the expected redirect once DNS exists |

Implementation note: keep exact path redirects before splat redirects. The regression
test `Cloudflare splat redirects should come after exact redirects when present` protects
that ordering inside `_redirects`; dashboard rules need the same discipline manually.

Latest live spot-check, 2026-05-23 19:00 UTC:

- `https://anhanga.tur.br/` returned `301` to `https://www.anhanga.tur.br/`.
- `http://www.anhanga.tur.br/` returned `301` to `https://www.anhanga.tur.br/`.
- `beto.anhanga.tur.br` did not resolve via local `curl` or `dig @1.1.1.1`; keep this
  redirect marked as dashboard/DNS-unverified until a DNS record exists.

## Cache Rules

### Hashed Vite assets

Hashed assets under `/assets/*` are repo-owned through `public/_headers`:

```text
Cache-Control: public, max-age=31536000, immutable
```

This is tested by `tests/cloudflare-config.test.ts`. Do not recreate the same policy
as a broad dashboard rule unless the dashboard rule is narrower and documented here.

### Media zone videos

The media zone rule is dashboard-owned and documented in
`docs/ops/cloudflare-cache-rules.md`:

```text
(http.host eq "media.anhanga.tur.br" and starts_with(http.request.uri.path, "/videos/"))
```

Expected settings:

| Setting | Expected value |
|---|---|
| Cache eligibility | Eligible for cache |
| Edge TTL | 1 year / 31536000 seconds |
| Browser TTL | 1 day / 86400 seconds |
| Origin cache headers | Override origin |

Use GET requests with `Range`, not HEAD, when checking whether this rule populates cache:

```bash
curl -sS -o /dev/null -D - -H "Range: bytes=0-1023" \
  https://media.anhanga.tur.br/videos/hero/rio.mp4 \
  | grep -Ei "cf-cache-status|cache-control|accept-ranges"
```

The expected steady-state signal is `cf-cache-status: HIT` on repeated requests from
the same Cloudflare PoP. `REVALIDATED` on the first request can be normal for R2
custom domains.

### Image transformations

Transformed images are served from the media zone through `/cdn-cgi/image/...`.
Current live checks have shown Image Transformations working with Cloudflare-managed
cache headers. Verify with:

```bash
curl -sSI \
  https://media.anhanga.tur.br/cdn-cgi/image/format=webp,quality=85,metadata=none,fit=cover,width=1280,height=720/images/hero/rio-poster.jpg
```

Expected headers include `cf-resized`, `cf-cache-status`, `accept-ranges`, and an
image content type.

## Security, WAF, and rate limiting

Current repo-owned edge headers are in `public/_headers`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security: max-age=15768000`

`Strict-Transport-Security` intentionally does not include `includeSubDomains` yet.
`tests/cloudflare-config.test.ts` protects this until subdomain inventory is complete.

WAF and dashboard rate-limit rules are not implemented for this issue because the
current Cloudflare plan does not expose the required paid-plan controls. Do not mark
WAF coverage as complete in PR notes unless it has been verified in the dashboard.
For now, track the gap as:

| Control | Status | Follow-up |
|---|---|---|
| WAF custom rules for `/api/*` | Not available on current plan | Revisit after plan upgrade |
| Dashboard rate limiting for write/API paths | Not available on current plan | Revisit after plan upgrade; app-level rate limits still live in code where implemented |
| Bot Fight Mode / AI bot controls | Dashboard recommendation from Security Insights export | Verify manually before enabling; watch Cloudflare Security Events after activation |

The Security Insights CSV is evidence of Cloudflare recommendations, not proof that
the controls are enabled. Treat each row as a review queue item.

## Speed Brain and Web Analytics

Speed Brain is considered enabled when responses include:

```text
speculation-rules: "/cdn-cgi/speculation"
```

Cloudflare Web Analytics is dashboard-owned. The baseline from 2026-05-23 found that
zone-level Core Web Vitals were dominated by internal subdomains, not by
`www.anhanga.tur.br`. Do not use aggregate zone metrics as proof of public-site
improvement without a host or route filter.

## SSL/TLS and HSTS decisions

Expected public-site behavior:

- `https://www.anhanga.tur.br/` returns `200`.
- `https://anhanga.tur.br/` redirects to `https://www.anhanga.tur.br/`.
- `http://www.anhanga.tur.br/` redirects to `https://www.anhanga.tur.br/`.
- `Strict-Transport-Security` is present on the global Pages response.
- `includeSubDomains` remains disabled until every relevant subdomain has valid HTTPS
  and an owner-approved redirect or serving model.

Cloudflare Security Insights can flag unrelated or temporary subdomains such as
tracking hosts. Verify the hostname owner and expected lifecycle before changing
zone-wide HSTS or Always Use HTTPS behavior.

## Post-deploy verification

Run these checks after Cloudflare config changes or after a Pages deployment that
touches Cloudflare-related repo files:

```bash
pnpm exec tsx --test tests/cloudflare-config.test.ts

curl -sSI https://www.anhanga.tur.br/
curl -sSI http://www.anhanga.tur.br/
curl -sSI https://anhanga.tur.br/
curl -sSI \
  https://media.anhanga.tur.br/cdn-cgi/image/format=webp,quality=85,metadata=none,fit=cover,width=1280,height=720/images/hero/rio-poster.jpg
curl -sS -o /dev/null -D - -H "Range: bytes=0-1023" \
  https://media.anhanga.tur.br/videos/hero/rio.mp4 \
  | grep -Ei "cf-cache-status|cache-control|accept-ranges"
```

When a dashboard rule cannot be verified because of plan limits or missing dashboard
access, say that in the PR notes. A useful PR note format is:

```text
Cloudflare dashboard notes:
- Verified live:
- Repo-protected by tests:
- Dashboard-only and not verified:
- Paid-plan unavailable:
```
