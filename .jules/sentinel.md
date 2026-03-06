# 🛡️ Sentinel Journal - 2024-03-04

## Security: Sanitized Navigation and Lead Attribution

### Finding
During the navigation update, verified that lead attribution parameters (UTMs, GCLID) are correctly persisted across internal links when using React Router `<Link>`.

### Resolution
Ensured that custom landing page Navbars use `<Link to="/">` which preserves state/session context, and validated that manual breadcrumb links don't leak internal routing logic or bypass global tracking scripts (public/utm-tracking.js).

### Pattern Discovery
Standardized the use of `<Link>` for all internal routes to maintain session continuity, which is critical for the AI Chatbot's lead qualification flow that relies on persisted context.

# 🛡️ Sentinel Journal - 2026-03-05

## Security: HSTS Header Implementation for MitM Prevention

### Finding
The site lacked the HTTP Strict Transport Security (HSTS) header, which could allow Man-in-the-Middle (MitM) attacks by letting browsers access the site over insecure HTTP.

### Resolution
Added the `Strict-Transport-Security` header to `vercel.json` with `max-age=31536000; includeSubDomains; preload`. This enforces HTTPS for all subdomains and allows the domain to be included in HSTS preload lists.

### Pattern Discovery
Standardized security headers in `vercel.json` to include HSTS as a baseline for all production deployments, complementing existing headers like `X-Frame-Options` and `X-Content-Type-Options`.

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
