# Sentinel's Security Journal - Anhangá Viagens

This journal documents critical security learnings and vulnerabilities found in the Anhangá Viagens codebase.

---

## 2025-05-15 - Information Exposure in Edge Functions
**Vulnerability:** Leaking internal error messages to the client via the `details` field in API responses.
**Learning:** Returning the `error.message` directly in the response body can expose sensitive backend configuration, such as missing environment variables or specific API failure reasons, which can be leveraged by attackers.
**Prevention:** Genericize error messages for the client (e.g., "Error processing request") while maintaining detailed logs on the server side.

## 2025-05-15 - Resource Exhaustion (DoS) Risk in Chat History
**Vulnerability:** Unvalidated input array length for chat history (`contents`).
**Learning:** APIs that accept arrays without size limits are vulnerable to resource exhaustion. An attacker could send a massive array to consume server memory or excessive API quotas.
**Prevention:** Always validate input types and enforce maximum length/size limits for arrays in request payloads.

## 2025-05-16 - Rate Limiting and Input Validation in Lead Submission
**Vulnerability:** Lack of rate limiting and input length limits in the `api/submit-lead.ts` endpoint.
**Learning:** Publicly accessible endpoints that interact with third-party CRM APIs (like HubSpot) are prime targets for DoS and spam. Without rate limiting, an attacker could exhaust API quotas or flood the database. Missing length limits on string fields also pose a memory exhaustion risk.
**Prevention:** Implement in-memory rate limiting (even if basic) and enforce strict length validation on all user-provided fields in serverless functions.

## 2025-05-16 - IP Spoofing in Rate Limiting
**Vulnerability:** Trusting the first value of the `x-forwarded-for` header for client IP identification.
**Learning:** In many proxy configurations (including Vercel), the `x-forwarded-for` header is a comma-separated list where the client can prepend arbitrary IPs. Trusting the first value allows attackers to spoof their IP and bypass rate limits.
**Prevention:** Always use the last value in the `x-forwarded-for` chain if the infrastructure (like Vercel or Cloudflare) is known to append the true client IP at the end. Better yet, use platform-specific utilities like `ipAddress(request)` from `@vercel/functions` when available.

## 2025-05-17 - Resource Exhaustion via Tracking Payload and Unmanaged Maps
**Vulnerability:** Resource Exhaustion (DoS) due to unmanaged in-memory Rate Limit Maps and unvalidated lengths for nested tracking data in `api/submit-lead.ts`.
**Learning:** In-memory Maps in serverless/Edge functions can grow indefinitely if many unique keys (IPs) are sent, especially on warm instances. Furthermore, nested objects (like `tracking.extras`) are often overlooked in validation, allowing attackers to inflate payloads with large numbers of keys or very long strings.
**Prevention:** Always implement periodic cleanup for in-memory stores (e.g., GC when Map size exceeds 1000) and enforce strict hard capacity limits. For nested data, enforce both collection size limits (e.g., max 15 entries) and character length limits for both keys and values.
