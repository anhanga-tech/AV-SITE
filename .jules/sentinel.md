# 🛡️ Sentinel Journal - 2024-03-04

## Security: Sanitized Navigation and Lead Attribution

### Finding
During the navigation update, verified that lead attribution parameters (UTMs, GCLID) are correctly persisted across internal links when using React Router `<Link>`.

### Resolution
Ensured that custom landing page Navbars use `<Link to="/">` which preserves state/session context, and validated that manual breadcrumb links don't leak internal routing logic or bypass global tracking scripts (public/utm-tracking.js).

### Pattern Discovery
Standardized the use of `<Link>` for all internal routes to maintain session continuity, which is critical for the AI Chatbot's lead qualification flow that relies on persisted context.

# 🛡️ Sentinel Journal - 2026-03-03

## Security: Regional Safety Blocklist Hardening

### Finding
Implemented a comprehensive regional blocklist for Middle Eastern countries to mitigate risks associated with escalating conflicts.

### Resolution
Centralized destination safety rules in `utils/constants.ts` and integrated them into both the programmatic validation layer (`detectBlockedDestination`) and the AI system prompt. This dual-layer approach ensures that even if the AI attempts to bypass instructions, the validation logic will intercept and enforce the safety policy.

### Pattern Discovery
Established a "Centralized Safety Constants" pattern. By decoupling the list of high-risk destinations from the core logic, we enable faster response times to geopolitical changes without deep code refactoring.

# 🛡️ Sentinel Journal - 2026-03-02

## Security: Stored XSS Prevention in Lead Submission

### Finding
The `api/submit-lead.ts` endpoint was found to be vulnerable to Stored XSS. It was sending unsanitized user inputs (names, emails, tracking data) directly to HubSpot, which could lead to session hijacking if a CRM user views a malicious lead's details.

### Resolution
Implemented regex-based HTML entity escaping for all user-controlled strings in the serverless function. Specifically, `<` and `>` characters are replaced with `&lt;` and `&gt;` before any validation or processing. This ensures that even if malicious scripts are submitted, they are rendered as harmless text in the HubSpot UI.

### Pattern Discovery
Adopted a "Sanitize at the Edge" pattern for serverless functions. Since DOM-based sanitizers like DOMPurify aren't natively efficient in certain edge environments without a JSDOM-like overhead, simple character escaping provides a robust, low-latency defense-in-depth mechanism for structured data APIs.

# 🛡️ Sentinel Journal - 2026-03-05

## Security: Inconsistent Rate Limiting on Public Endpoints

### Finding
Discovered that the `api/submit-waitlist.ts` endpoint was missing rate limiting, unlike `api/submit-lead.ts` and `api/generate.ts`. This created a vulnerability where automated bots could spam the HubSpot waitlist, potentially exhausting CRM quotas or polluting lead data.

### Resolution
Implemented the standard `checkRateLimit` helper in the waitlist handler. Crucially, the check was placed *after* the CORS `OPTIONS` preflight handling to ensure that browser preflight requests do not consume the rate limit quota, which would otherwise lead to false positives for legitimate users.

### Pattern Discovery
Established the "Post-Preflight Rate Limiting" pattern. Rate limit checks in Edge Functions must always follow the `OPTIONS` method check to prevent blocking legitimate cross-origin requests due to preflight overhead.

# 🛡️ Sentinel Journal - 2026-03-06

## Security: Over-permissive CORS Origin Reflection

### Finding
The `api/submit-waitlist.ts` endpoint was reflecting the `Origin` header from incoming requests directly into the `Access-Control-Allow-Origin` header. This bypasses the security provided by the `ALLOWED_ORIGIN` environment variable and allows any website to make cross-origin requests to the endpoint, which is a significant security risk for data ingestion endpoints.

### Resolution
Removed the explicit origin reflection from the `buildCorsHeaders` call. The endpoint now correctly falls back to the standardized `ALLOWED_ORIGIN` configuration (or the safe default) defined in `lib/network.ts`.

### Pattern Discovery
Standardized the "Zero-Trust CORS" pattern for internal APIs. Public-facing endpoints must never reflect the `Origin` header without strict validation against an allowlist. Using a centralized, parameterless `buildCorsHeaders()` call ensures consistency across all serverless functions.

## 2026-03-20 - [Timing-Safe Authorization for Edge Webhooks]
**Vulnerability:** Authorization logic in Edge Functions (e.g., `api/purchase-dispatch.ts`) was using standard string comparison (`===`) for webhook secrets. This is vulnerable to timing attacks, where an attacker can brute-force a secret by measuring slight variations in response time for each character.
**Learning:** Even simple API secrets need constant-time comparison. While Node.js has `crypto.timingSafeEqual`, Edge Runtimes often require a manual implementation using bitwise operations to ensure consistency across environments.
**Prevention:** Always use a `timingSafeEqual` utility for comparing secrets, tokens, or signatures. Ensure the utility is shared across the codebase to maintain a unified security posture.

## 2026-03-22 - [Truncation-based Sanitization Bypass]
**Vulnerability:** In `lib/lead-logic.ts`, a length limit was implemented that returned the truncated string *before* applying HTML entity escaping for XSS prevention. This allowed malicious payloads exceeding the length limit to bypass sanitization entirely.
**Learning:** Defensive measures like length limits must be ordered such that they don't bypass security filters. Truncation should happen first, but the resulting shorter string must still be processed by all security filters.
**Prevention:** Always truncate first, then sanitize. Ensure security-critical functions don't have early return paths that skip mandatory sanitization logic.

## 2026-03-25 - [Memory-Exhaustion DoS via Early Body Parsing]
**Vulnerability:** API endpoints were parsing the JSON request body (potentially up to MBs depending on runtime limits) *before* checking the rate limit. This allowed attackers to force the server to perform expensive serialization/parsing and memory allocation even when they were already over their quota.
**Learning:** Rate limiting must be the very first operation after protocol/method validation. If an endpoint requires an authenticated secret, rate limit should ideally happen after the secret check (to prevent unauthenticated rate limit exhaustion) BUT before any heavy payload processing. In our case, we prioritized DoS protection by placing it even before parsing.
**Prevention:** Always implement an "Early Rate Limiting" pattern. Ensure unit tests verify that rate limit quotas are consumed even by invalid payloads, as this confirms the check happens before validation/parsing.

## 2026-03-25 - [Internal Config Leakage in Error Responses]
**Vulnerability:** The HubSpot webhook handler leaked specific environment variable names (e.g., 'HUBSPOT_TOKEN') in public error responses when configuration was missing. This provides attackers with internal architectural details.
**Learning:** Error responses should never disclose the name or nature of internal configuration keys.
**Prevention:** Standardize on generic, localized error messages for infrastructure-level failures (500/502/503).

## 2026-03-27 - [Privacy-Compliant Observability & Information Disclosure Protection]
**Vulnerability:** The quiz submission API (`api/submit-quiz.ts`) was leaking raw upstream webhook error details to clients and lacked PII masking in server-side logs. Additionally, the `destinos` field was vulnerable to stored XSS as it bypassed standard sanitization filters.
**Learning:** Observability must not come at the cost of privacy. Centralizing PII masking utilities (Email, Phone, Name) ensures consistent protection across all ingestion endpoints. Generic error messages prevent attackers from mapping internal infrastructure via leaked webhook responses.
**Prevention:** Use `maskEmail`, `maskPhone`, and `maskName` from `lib/lead-logic.ts` in all structured logs. Always return sanitized, generic error codes/messages to the frontend, keeping technical details strictly for server-side logs.

## 2026-03-28 - [Loose Origin Validation in OAuth Handshake]
**Vulnerability:** The OAuth callback in `api/auth/callback.ts` used an over-permissive regex for subdomain validation and a wildcard `*` for the initial handshake `postMessage`.
**Learning:** Permissive regex patterns like `.*\.anhanga\.tur\.br` can match crafted origins if not properly anchored. Wildcard `postMessage` targets allow any opened window to intercept handshakes.
**Prevention:** Use restrictive regex patterns that validate specific subdomain structures (e.g., `(?:[a-zA-Z0-9-]+\.)*`). Always specify a target origin for `postMessage` when known, even for non-sensitive handshakes, to maintain a strict security posture.

## 2026-03-30 - [Auth Flow Hardening & Security Utility Centralization]
**Vulnerability:** Insecure (timing-sensitive) token comparison and lack of rate limiting on sensitive OAuth endpoints.
**Learning:** Authentication flows, even if for administrative use, require multi-layered protection including rate limiting and timing-safe comparisons to prevent brute-force and side-channel attacks. Centralizing these utilities ensures consistency across the codebase.
**Prevention:** Centralize security-critical utilities like `timingSafeEqual` in `lib/security.ts`. Enforce rate limits on all public-facing authentication or data ingestion endpoints to provide defense-in-depth against automated abuse.

## 2026-06-22 - [Secrets in Outbound Request URLs (CWE-598)]
**Vulnerability:** `lib/conversions/meta.ts` passed the Meta CAPI `access_token` as a query-string parameter (`?access_token=...`). On Cloudflare Pages Functions, outbound request URLs are exposed to edge/CDN observability, proxies, and APM tooling, while request bodies are not — so a long-lived provider secret rode along in a loggable surface.
**Learning:** The Graph API accepts `access_token` in the POST body; moving it there removes the URL exposure with zero behavior change. NOT all providers can do this — GA4 Measurement Protocol (`lib/conversions/google.ts`) *requires* `api_secret` in the query string, so that one is an unavoidable exception, not a bug to "fix".
**Prevention:** When integrating a provider, prefer sending credentials in headers or the request body. Only place a secret in a URL when the provider's API offers no alternative, and document why. Add a test asserting the secret never appears in the request URL.

## 2026-06-29 - [CSP Added as Source-Agnostic Subset; Full Allowlist Gated]
**Vulnerability:** The global `/*` block in `public/_headers` shipped HSTS, X-Frame-Options, X-CTO, Referrer-Policy and Permissions-Policy but had NO Content-Security-Policy. (CSP was only used per-route in `api/auth/callback.ts` for the OAuth postMessage HTML.)
**Learning:** A full `default-src`/`script-src` CSP can't be dropped in blind here — the SPA loads GTM, Gemini, Leaflet/globe.gl tiles and the `media.anhanga.tur.br` zone, so an un-audited allowlist would break the site. Similarly, `tests/cloudflare-config.test.ts` intentionally forbids HSTS `includeSubDomains` until `beto.anhanga.tur.br` HTTPS is confirmed. Both are deliberate "gated until audited" constraints, not omissions to "fix".
**Prevention:** Added the source-agnostic, non-breaking subset (`base-uri 'self'; object-src 'none'; frame-ancestors 'none'`) which closes base-tag injection, plugin injection and clickjacking without touching resource origins. A regression guard now blocks anyone adding `default-src`/`script-src` without doing the provider-origin audit first.

## 2026-07-20 - [Untrusted Upstream Error Bodies Logged Untruncated]
**Vulnerability:** `lib/conversions/meta.ts` and `google.ts` read the provider error body with `response.text()` and passed it untruncated into `logger.error` (→ Sentry) and into the returned `error` string, which `api/hubspot-webhook.ts` then joins into a log line. Provider error bodies are untrusted (attacker-influenced fields can be echoed back) and unbounded — a single hostile/oversized upstream response could flood logs and Sentry.
**Learning:** The redaction path (`sanitizeForErrorTracking`) only redacts sensitive *keys* in plain objects; a raw *string* value passes through unchanged, so length was never bounded. The security standard's "truncate large upstream error details before logging/storing" applies to strings, not just structured payloads.
**Prevention:** Centralized the read+cap at one boundary helper — `lib/conversions/provider-detail.ts` `readTruncatedProviderDetail()` (300-char cap). Reuse it for any new outbound provider whose error body is read into logs or returned error strings, instead of calling `response.text()` inline.

## 2026-07-27 - [Log Redaction Net Must Track the App's Secret Surface]
**Vulnerability:** The single global log/Sentry redaction net (`sanitizeForErrorTracking`, `lib/error-tracking.ts`) redacted `token`/`secret`/`authorization`/PII but NOT `apiKey`/`api_key` (GEMINI/ODOO keys) or `signature` (HubSpot/NPS webhook signatures) — both named in the security standard as never-to-log. No active leak, but any future `logger.*({ apiKey })` would have shipped the raw key to console + Sentry (`enableLogs: true` in `functions/_middleware.ts`).
**Learning:** This project funnels ALL console output and captured errors through one key-name-based redaction net on the way to Sentry. That net is only as good as its key list, and the list had drifted behind the secrets the app actually handles. Redaction is by key *name*, not value — so `api[-_]?key` (matches `apiKey`) is the right shape, and false-positives (`idempotencyKey`, `gatewayId`) must be guarded by test.
**Prevention:** When adding a new secret/credential/PII field anywhere it could reach a log, confirm its key name matches `SENSITIVE_KEY_PATTERN`; extend the pattern + add a redaction-and-false-positive test in `tests/logger.test.ts` in the same change.

## 2026-08-03 - [Truncation Net Missed the Provider Added After It]
**Vulnerability:** `services/odoo.ts` — the active CRM since the jun/2026 cut-over — built every `ODOO_ERROR:<status>:<detail>` from an untruncated source: `await response.text()` on an HTTP error, or `body.error.data.message` from a JSON-RPC fault. `classifyN8nSubmitError` caps at 600 chars, but the `ODOO_CAMPAIGN_RESOLVE` warn in `lib/odoo-submit-handler.ts` logs `error.message` verbatim, bypassing it — so an unbounded upstream string reached console + Sentry (`enableLogs: true`). Odoo faults echo back the offending field values from the create/write dict, i.e. client-supplied lead content, making the flood reachable from one crafted submit.
**Learning:** The 2026-07-20 entry centralized the cap in `readTruncatedProviderDetail()` for Meta/GA4, but Odoo landed *after* it and was never brought in. The helper also wouldn't have covered Odoo as written: half its leak is a fault message inside an already-parsed JSON payload, not a `Response` body — so a `Response`-only helper silently didn't apply. Same shape as the 2026-07-27 finding: a centralized net only protects what someone remembers to route through it.
**Prevention:** Cap at the *error-construction* choke point (`odooError()`), not at each read site — one function bounds every downstream consumer regardless of how the detail arrived. `truncateProviderDetail()` (pure, string-in) now sits under `readTruncatedProviderDetail()` for providers whose detail isn't a response body. When adding an outbound provider, check both leak shapes: raw body *and* structured fault field.

## 2026-08-10 - [The Redaction Net Only Covered Payloads, Not URLs]
**Vulnerability:** The signed NPS invite token (`/nps?token=…`, `lib/nps-invite.ts`) is a bearer credential — it binds identity server-side and authorizes a write to that customer's Odoo `res.partner` for 30 days. Both Sentry entry points (`lib/sentry-client.ts`, `functions/_middleware.ts`) shipped it verbatim in `event.request.url`. Crucially this was NOT error-only: `tracesSampleRate: 0.1` on both SDKs meant ~10% of ordinary `/nps?token=…` page loads and requests emitted a transaction carrying a live token, with no error required.
**Learning:** Third in the series after 2026-07-27 and 2026-08-03, but a new *shape*. Those were "the net missed a key name / a provider added later" — the net itself was the right net. Here `sanitizeForErrorTracking` was structurally incapable: it walks plain-object keys, and a URL is a single opaque string that never presents `token` as a key. The 2026-06-22 entry already established "credentials must not ride in URLs" for *outbound* provider calls; nobody carried that rule to the *inbound* URL the user is standing on, which telemetry copies wholesale. Also note the sampling multiplier — reasoning about a leak as "only on errors" understates it whenever tracing is on.
**Prevention:** Two rules. (1) When a credential must live in a URL (an emailed invite link has no alternative), the leak surface is telemetry, not just logs — scrub at `beforeSend` AND `beforeSendTransaction` AND `beforeBreadcrumb`; `beforeSend` alone misses the sampled-transaction path entirely. (2) Keep shared scrubbers in `lib/error-tracking.ts` with structural types and no SDK import, so the Cloudflare Pages middleware can reuse them without dragging `@sentry/react` into the Worker bundle — a test asserts the middleware never imports `lib/sentry-client`.
**Still open (follow-up, out of scope here):** the same token also reaches GA4/Mautic as `page_location` on `/nps`. Those tags load lazily on first interaction (`index.html`), so stripping the token from the address bar via `history.replaceState` right after `NpsPage` reads it would close that path before any pageview fires.

## 2026-08-10 - [A Telemetry SDK Copies a URL Into More Places Than You Think]
**Vulnerability:** The first cut of the Sentry URL scrubber (above) redacted `event.request.url` and stopped there. Review found four live bypasses, all confirmed against the pinned SDK: (1) `@sentry/cloudflare` builds `event.request` via `winterCGRequestToRequestData` (`scope-utils.js:16`), which stores `query_string` as its **own field** derived from the same URL — so the NPS token still went out whole on the server path; (2) `beforeSendTransaction` receives `event.spans[]` (`sentrySpan.js:335`), each span holding outbound `url.full`/`http.url` — which matters because GA4 *requires* `api_secret` in the query string (`lib/conversions/google.ts:46`), so that secret rides in a span URL by design; (3) `code`/`state` on `api/auth/callback.ts` match nothing in `SENSITIVE_KEY_PATTERN`, and the OAuth code is exchangeable for a `repo,user` GitHub token; (4) `?%74oken=` is decoded to `token` by `URLSearchParams` but not by a raw-string match.
**Learning:** Two distinct lessons. First: a telemetry SDK does not store "the URL" once — it fans the same string into a request field, a *separate* query-string field, span attributes, and breadcrumbs. Redacting the obvious field and declaring victory is the default failure mode; the only reliable method is to read the installed SDK's event-assembly code and enumerate every field it writes the URL into. Second, and sharper: my own wiring guard asserted `beforeBreadcrumb` on `clientSource` only, so when the middleware was missing that hook the test **covered** the gap instead of catching it. A guard that checks the entry point you got right, and not the one you got wrong, is worse than no guard — it converts a gap into a green check.
**Round 3 addendum:** A third review round found the last field — `Referer`. `Referrer-Policy: strict-origin-when-cross-origin` strips the path only CROSS-origin, so `NpsPage`'s same-origin POST to `/api/submit-nps` sends `Referer: /nps?token=…` in full; `requestdata.js:29` includes headers by default and strips only `cookie`/IP headers. It also reaches Sentry a second way the reviewer didn't mention: `httpHeadersToSpanAttributes` emits `http.request.header.referer` as a span attribute. So the complete field list a URL fans into on this SDK is: `request.url`, `request.query_string`, `request.headers.referer`, `contexts.trace.data`, `spans[].data`, and breadcrumb `data.{from,to,url}` — six places, found over three rounds, none of them guessable from the public types.
**Prevention:** When scrubbing telemetry, grep the SDK build output for the field name (`grep -rn "query_string" node_modules/@sentry/core/build/`) rather than trusting the public type. When a rule must hold for N entry points, write the assertion as a loop over all N — never repeat it per-source and let one drift. And keep URL-only sensitive names (`code`, `state`) in a *separate* pattern from the payload-key net: `code` is a field on nearly every JSON response here, so merging them would erase the error taxonomy in logs while fixing nothing.
