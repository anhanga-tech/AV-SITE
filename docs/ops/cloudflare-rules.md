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
| Speed Brain and Web Analytics | Cloudflare dashboard (Pages project toggle **and** zone RUM — see [Duplicated Web Analytics beacon](#duplicated-web-analytics-beacon-investigated-2026-09-09-issue-1604)) | Response header `speculation-rules`, Cloudflare Web Analytics UI, and `curl` with a browser `Accept` header |
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
| Bot Fight Mode / AI bot controls | Resolved 2026-08-22 | See below |

The Security Insights CSV is evidence of Cloudflare recommendations, not proof that
the controls are enabled. Treat each row as a review queue item.

### AI crawler access (Bot Fight Mode)

Bot Fight Mode (Security → Settings) is enabled for the zone and was found to be
challenging known AI crawlers (GPTBot, ClaudeBot, ChatGPT-User, PerplexityBot,
Google-Extended, Applebot-Extended, DeepSeekBot, Claude-User, Claude-SearchBot,
OAI-SearchBot), which was the root cause of a 6/100 score on an external agent-readiness
scan (is-agentic.com) — the scanner's crawler couldn't get past the challenge to
evaluate anything else. `AI Crawl Control → Security` already had "Block AI training
bots" set to allow, so that setting was not the cause.

Fixed with a WAF custom rule (`Security → Security rules → Custom rules`, named
"Allow AI crawlers (skip Bot Fight Mode)") that matches those user agents and applies
action **Skip → All Super Bot Fight Mode Rules**, leaving Bot Fight Mode active for
everything else. Verified via `curl -A "<bot-name>" https://www.anhanga.tur.br/`
(and the apex-domain redirect) returning `200` with `cf-cache-status: DYNAMIC` and no
`cf-mitigated` header, for both `anhanga.tur.br` and `www.anhanga.tur.br`.

## Speed Brain and Web Analytics

Speed Brain is considered enabled when responses include:

```text
speculation-rules: "/cdn-cgi/speculation"
```

Cloudflare Web Analytics is dashboard-owned. The baseline from 2026-05-23 found that
zone-level Core Web Vitals were dominated by internal subdomains, not by
`www.anhanga.tur.br`. Do not use aggregate zone metrics as proof of public-site
improvement without a host or route filter.

### Duplicated Web Analytics beacon (investigated 2026-09-09, issue #1604)

Production serves **two independent Cloudflare Web Analytics beacons** on the same
navigation, with two different site tokens. Neither is injected by this repository —
`grep -rn cloudflareinsights` over the source tree returns nothing, and neither script
appears in `index.html`, in `scripts/prerender.mjs` output, or in `functions/`. Both are
edge injections owned by the Cloudflare dashboard.

| Script tag in the served HTML | Token | Injected by | SPA-aware |
|---|---|---|---|
| `<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "93a3a040…"}'>`, wrapped in `<!-- Cloudflare Pages Analytics -->` comments | `93a3a040…` | **Pages project** `av-site` → Settings → Web Analytics toggle | No (`data-cf-beacon` has no `spa` flag — initial document only) |
| `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/v31edd…" data-cf-beacon='{"version":"2024.11.0","token":"fcec1bea…","r":1,"spa":2}'>` | `fcec1bea…` | **Zone** `anhanga.tur.br` → Web Analytics (RUM auto-injection) | Yes (`"spa":2` — reports client-side route changes) |

Both URLs return the same beacon build (`etag: W/"2026.9.1"`, ~10.1 KiB gzipped each),
but the versioned and unversioned paths are separate cache entries, so the browser
downloads the payload twice: **2 requests / ~20.2 KiB instead of 1 / ~10.1 KiB**.

#### How to reproduce

The zone-level injection only happens for requests that look like a browser navigation.
A bare `curl` **misses it** and shows a single beacon — that is a false negative, not a
fix. Always send a full browser `Accept` header:

```bash
curl -sS https://www.anhanga.tur.br/ \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8' \
  --compressed | grep -o '<script[^>]*cloudflareinsights[^>]*>'
```

In-browser confirmation (both scripts execute, both report to `/cdn-cgi/rum`):

```js
[...document.querySelectorAll('script[src*="cloudflareinsights"]')]
  .map((s) => ({ src: s.src, beacon: s.getAttribute('data-cf-beacon') }));
performance.getEntriesByType('resource').filter((r) => /cdn-cgi\/rum/.test(r.name));
```

#### Evidence captured before any change (2026-09-09, `https://www.anhanga.tur.br/`)

- Two `<script>` tags for `static.cloudflareinsights.com/beacon.min.js`, distinct tokens.
- Both fetched by the browser (`PerformanceResourceTiming`, `initiatorType: "script"`).
- Cross-origin without `Timing-Allow-Origin`, so `transferSize` reads `0` in the browser;
  wire size measured directly instead: `curl --compressed` returns 10 125 B and 10 114 B.
- `POST https://cloudflareinsights.com/cdn-cgi/rum` observed on load and again on
  `pagehide` — the collection endpoint is shared, so the duplication is in the payload
  volume and in the split of the dataset across two Web Analytics sites, not in a second
  endpoint.

#### Decision

**Keep the zone-level beacon (`fcec1bea…`); disable the Pages project one (`93a3a040…`).**

Rationale, in order of weight:

1. The zone beacon is the one the recorded history comes from.
   [`docs/baselines/cloudflare-2026-05-23.md`](../baselines/cloudflare-2026-05-23.md)
   reports Web Analytics data containing `n8n.`, `mkt.` and `cal.` subdomains. The Pages
   beacon can only ever run on the `av-site` Pages project, so a view showing those
   subdomains must be the zone-scoped site. Disabling the zone beacon would orphan that
   dataset.
2. Only the zone beacon carries `"spa":2`. This site is a client-side-routed React SPA
   (`App.tsx`), so the Pages beacon reports the initial document only and undercounts
   every in-app navigation.
3. The Pages toggle is a single switch with a trivial rollback (see below).

If the token actually being read in the dashboard turns out to be `93a3a040…`, invert
the decision — but then also accept the loss of SPA route reporting, or re-enable the
zone RUM with `spa` before turning the zone one off.

#### How to apply, verify and roll back

- **Apply (done 2026-09-09):** the two controls live in *different* places, which is the
  main reason this took a while to find:
  - Zone beacon — account → **Analytics & Logs → Web Analytics** → `anhanga.tur.br` →
    *Manage site* → **Real User Measurements (RUM)**. Set to *Enable, excluding visitor
    data in the EU*. The site entry lists its hostname as `anhanga.tur.br`, but it does
    cover `www.` and the internal subdomains — verified by capturing this beacon on
    `www.anhanga.tur.br` before the change.
  - Pages beacon — **Workers & Pages → `av-site` → Metrics tab → scroll to the bottom** →
    *Web Analytics* card → **Disable**. It is *not* under Settings, and not on the
    account Web Analytics list: that list shows this entry (hostnames
    `av-site-8ex.pages.dev, www.anhanga.tur.br`) with the message "Manage this site using
    Cloudflare Pages, where it was created" and offers no toggle of its own.
- **Propagation gotcha:** disabling the Pages beacon reports "Changes will take effect on
  the next deployment". The zone beacon re-appears immediately (edge injection), but the
  Pages `<script>` stays in the served HTML until `av-site` is redeployed. Measuring right
  after the toggle still shows two beacons — that is propagation, not a failed change.
- **Verify (pending the next `av-site` deployment):** re-run the `curl` above and confirm
  exactly one beacon remains, and that it is the versioned `fcec1bea…` one. Then confirm
  in Web Analytics (zone site, filtered to `www.anhanga.tur.br`) that page views and Core
  Web Vitals keep arriving for at least 24 h.
- **Roll back:** re-enable the same toggle. Treat the data collected under `93a3a040…`
  as non-recoverable — a re-enabled Pages project may be issued a new site token, and
  that was not verified here. This is why the verification window above should run
  before, not after, the Pages beacon is considered gone for good.

#### Evidence after the change (2026-09-10, post-deploy `58c039b`)

The Pages beacon left the served HTML on the first `av-site` deployment after the toggle.
Measured on production with the same browser-`Accept` `curl` as the before capture:

| | Before | After |
|---|---|---|
| Beacon `<script>` tags | 2 | **1** (`fcec1bea…`, versioned, `"spa":2`) |
| Beacon script downloads | 2 × ~10,1 KiB gzip | **1 × ~10,1 KiB gzip** |
| Collection endpoint | `cloudflareinsights.com/cdn-cgi/rum` | **`www.anhanga.tur.br/cdn-cgi/rum`** |

Net: **−1 request, −~10,1 KiB** per navigation, telemetry preserved.

The endpoint change is the independent confirmation that the surviving beacon is the
zone one. Per the [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/),
automatic (proxied) setup reports to your own domain's `/cdn-cgi/rum`, while a manually
installed snippet reports to `cloudflareinsights.com/cdn-cgi/rum`. Before the change the
site reported to the latter — the Pages snippet — and now reports first-party.

Checked on `/`, `/orlando/`, `/blog/` and `/cruzeiros/`: one beacon each, always token
`fcec1bea…`. `n8n.anhanga.tur.br` also serves one beacon, confirming the zone entry covers
internal subdomains despite listing only `anhanga.tur.br` as its hostname. (`mkt.` and
`cal.` no longer resolve in DNS, so the 2026-05-23 baseline's subdomain mix is stale —
unrelated to this change.)

Not verified: whether `"spa":2` actually emits soft-navigation events. A synthetic
`pushState` + `popstate` made the router change route without producing an additional
`/cdn-cgi/rum` request, which may be beacon batching or an artifact of the synthetic
navigation. The flag is declared in the tag; event-level SPA coverage was not observed.

#### Explicitly out of scope

The same navigation also loads `/cdn-cgi/challenge-platform/scripts/jsd/main.js`
(Bot Fight Mode), `/cdn-cgi/scripts/…/email-decode.min.js` (Email Address Obfuscation)
and `/cdn-cgi/zaraz/s.js` (Zaraz). None of them is a Web Analytics beacon and none was
touched. Per issue #1604, anti-bot protection, Zaraz and unrelated trackers must not be
disabled on the assumption that they are part of this duplication.

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
