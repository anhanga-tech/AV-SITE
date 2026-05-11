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
