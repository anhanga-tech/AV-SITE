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
