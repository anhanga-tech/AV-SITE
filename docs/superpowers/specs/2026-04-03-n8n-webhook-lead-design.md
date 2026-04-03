# N8N Webhook Lead Flow Design

## Summary

This design replaces direct HubSpot writes in the public lead-capture API handlers with server-to-server webhook delivery to n8n.

The site remains the trust boundary for:

- request parsing
- validation and normalization
- rate limiting
- request ID generation
- sanitized error responses

Two public flows remain separate because they carry different business meaning and payload complexity:

- `submit-lead` for richer chatbot and homepage lead captures
- `submit-waitlist` for the Lollapalooza waitlist capture flow

The frontend should continue calling the same public API routes. The route handlers will change destination only.

## Goals

- Keep payload validation and normalization in the AV-SITE backend
- Send clean, predictable webhook payloads to n8n
- Preserve separate contracts for rich leads and waitlist submissions
- Remove direct frontend coupling to HubSpot-specific response fields
- Minimize frontend changes and preserve existing user-facing behavior

## Non-Goals

- Rebuild or redesign the chatbot handoff UX
- Change the browser-visible rate limiting behavior
- Move validation responsibility into n8n
- Redesign the waitlist capture product flow
- Remove existing conversion tracking in this change unless implementation needs a scoped follow-up decision

## Current State

### Public Lead Flow

`/api/submit-lead` currently:

1. handles CORS and method gates
2. applies rate limiting
3. parses JSON
4. validates and normalizes with `lib/lead-logic.ts`
5. reads HubSpot configuration from environment variables
6. creates or updates a HubSpot contact
7. enriches contact properties with tracking and UTM fields
8. creates and associates a HubSpot deal
9. returns HubSpot-specific response data
10. triggers conversion tracking asynchronously

### Waitlist Flow

`/api/submit-waitlist` currently:

1. handles CORS and method gates
2. applies rate limiting
3. parses JSON
4. validates and normalizes with `lib/waitlist-logic.ts`
5. reads HubSpot configuration from environment variables
6. creates or updates a HubSpot contact
7. optionally enriches tracking fields
8. optionally adds the contact to the configured HubSpot list
9. adds a note for waitlist context
10. returns HubSpot-specific response data

## Decision

Keep the public API routes and validation behavior, but replace HubSpot orchestration with dedicated n8n webhook delivery.

Recommended structure:

- keep `api/submit-lead.ts` as the public rich lead endpoint
- keep `api/submit-waitlist.ts` as the public waitlist endpoint
- add a focused `services/n8n.ts` transport layer for outbound webhook delivery
- optionally add `lib/n8n-payloads.ts` to build stable webhook payload shapes

## Why This Design

This approach preserves the strongest part of the current implementation: the site already acts as a safe boundary that validates and sanitizes untrusted browser input before any external side effect.

It also avoids pushing CRM-specific assumptions into the frontend or into n8n workflow logic. n8n should receive trusted, predictable payloads and focus on automation, routing, CRM writes, or downstream notifications.

## Contracts

### Public Request Contracts

The browser-facing request contracts remain unchanged for this design.

`submit-lead` continues to accept the existing `SubmitLeadRequest` contract.

`submit-waitlist` continues to accept the existing `SubmitWaitlistRequest` contract.

### Outbound Webhook Contract: Rich Lead

Proposed n8n payload for `submit-lead`:

```json
{
  "requestId": "req_123",
  "source": "submit-lead",
  "lead": {
    "firstName": "Felipe",
    "lastName": "Williams",
    "email": "felipe@example.com",
    "destination": "Orlando, Flórida",
    "bantSummary": "Need: ...",
    "eventId": "lead_abc"
  },
  "utms": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "orlando",
    "utm_term": null,
    "utm_content": null
  },
  "tracking": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "orlando",
    "utm_term": null,
    "utm_content": null,
    "cid": null,
    "sid": null,
    "gclid": "test-gclid",
    "fbclid": null,
    "msclkid": null,
    "ttclid": null,
    "wbraid": null,
    "gbraid": null,
    "fbc": null,
    "fbp": null,
    "extras": {}
  },
  "meta": {
    "receivedAt": "2026-04-03T00:00:00.000Z"
  }
}
```

Notes:

- Payload is already sanitized and normalized
- Optional values may be `null`
- `extras` should only contain already-sanitized additional tracking keys
- `source` is explicit so workflows can route safely inside n8n

### Outbound Webhook Contract: Waitlist

Proposed n8n payload for `submit-waitlist`:

```json
{
  "requestId": "req_456",
  "source": "submit-waitlist",
  "waitlist": {
    "name": "Felipe Williams",
    "email": "felipe@example.com",
    "sourcePage": "/lollapalooza"
  },
  "utms": {
    "utm_source": "instagram",
    "utm_medium": null,
    "utm_campaign": null,
    "utm_term": null,
    "utm_content": null
  },
  "tracking": {
    "utm_source": "instagram",
    "utm_medium": null,
    "utm_campaign": null,
    "utm_term": null,
    "utm_content": null,
    "cid": null,
    "sid": null,
    "gclid": null,
    "fbclid": "fbclid-123",
    "msclkid": null,
    "ttclid": null,
    "wbraid": null,
    "gbraid": null,
    "fbc": null,
    "fbp": null,
    "extras": {}
  },
  "meta": {
    "receivedAt": "2026-04-03T00:00:00.000Z"
  }
}
```

## Public Response Contract

Move away from HubSpot-specific response fields such as `contactId` and `dealId`.

Recommended successful response shape for both endpoints:

```json
{
  "ok": true,
  "requestId": "req_123",
  "message": "Enviado com sucesso"
}
```

Optional warning shape:

```json
{
  "ok": true,
  "requestId": "req_123",
  "message": "Enviado com sucesso",
  "warning": "Mensagem adicional opcional"
}
```

Error shape remains structured:

```json
{
  "ok": false,
  "requestId": "req_123",
  "code": "VALIDATION_ERROR",
  "error": "Mensagem segura para o cliente"
}
```

## Security and Trust Boundary

Validation and normalization must remain server-side before any webhook delivery.

Existing logic to preserve:

- `cleanString`
- `normalizeNullable`
- `normalizeUtms`
- `normalizeTracking`
- `validatePayload`
- `validateWaitlistPayload`
- existing rate limiting via `lib/rate-limit.ts`
- existing CORS and IP extraction via `lib/network.ts`

Recommended webhook authentication:

- site sends `X-Webhook-Secret` using an environment variable
- site sends `X-Request-Id` for traceability
- n8n validates the secret before processing

Optional future hardening:

- add `X-Webhook-Timestamp`
- add request signing if needed later

## Error Handling

The new n8n transport should use explicit timeout behavior and sanitized failures.

Recommended client-visible codes:

- `VALIDATION_ERROR`
- `METHOD_NOT_ALLOWED`
- `RATE_LIMIT_EXCEEDED`
- `SERVER_CONFIG_ERROR`
- `N8N_WEBHOOK_ERROR`

Suggested mapping:

- missing webhook config -> `500 SERVER_CONFIG_ERROR`
- webhook timeout or non-2xx response -> `502 N8N_WEBHOOK_ERROR`
- malformed request body -> `400 VALIDATION_ERROR`
- invalid method -> `405 METHOD_NOT_ALLOWED`
- rate limit exceeded -> `429 RATE_LIMIT_EXCEEDED`

Client-facing success and failure text must avoid leaking upstream response bodies or secrets.

## Proposed File Changes

### Add

- `services/n8n.ts`
  Centralizes webhook fetch behavior, headers, timeout, and error mapping

### Optional Add

- `lib/n8n-payloads.ts`
  Builds outbound webhook payloads for lead and waitlist flows

### Update

- `api/submit-lead.ts`
  Replace HubSpot orchestration with n8n webhook delivery while preserving request validation and rate limiting

- `api/submit-waitlist.ts`
  Replace HubSpot orchestration with the waitlist webhook delivery while preserving request validation and rate limiting

- `types/leadCapture.ts`
  Remove or revise HubSpot-specific success fields in response types

- `types/waitlist.ts`
  Remove or revise HubSpot-specific success fields in response types

- `hooks/useLeadCapture.ts`
  Update success parsing expectations if response fields change

- any tests that assert `contactId`, `dealId`, or HubSpot-specific success text

## Environment Variables

Required:

- `N8N_SUBMIT_LEAD_WEBHOOK_URL`
- `N8N_SUBMIT_WAITLIST_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET`

Recommended:

- `N8N_WEBHOOK_TIMEOUT_MS`

## Testing Plan

Behavior changes require automated test updates.

### Unit and Route Tests

Update:

- `tests/submit-lead.test.ts`
- `tests/submit-waitlist.test.ts`

Expected changes:

- mock one outbound webhook request instead of multiple HubSpot API calls
- assert normalized payload shape sent to n8n
- assert response contract uses `Enviado com sucesso`
- assert timeout and non-2xx webhook failures map to `N8N_WEBHOOK_ERROR`

Keep and extend validation tests around:

- `validatePayload`
- `validateWaitlistPayload`
- tracking normalization
- event ID preservation

### Browser Tests

Review and update:

- `tests/e2e/chatbot-lead-submit.spec.ts`

Expected changes:

- preserve the guarantee that WhatsApp opens immediately
- preserve `/api/submit-lead` request behavior
- remove assumptions about `contactId`, `dealId`, and HubSpot-specific success messaging if present

Waitlist E2E coverage should also be updated if it currently asserts HubSpot-specific response fields.

### Verification Commands

Relevant verification after implementation:

- `pnpm test:regression`
- `pnpm typecheck`
- `pnpm test:e2e` if browser behavior or response-dependent UI changes are touched

## Risks

- Hidden frontend assumptions about `contactId` or `dealId`
- Existing tests tightly coupled to HubSpot mock behavior
- n8n webhook timeout causing degraded perceived reliability if timeout is too long
- workflow-side failures becoming harder to inspect without request ID propagation

## Mitigations

- keep the frontend route URLs unchanged
- keep request validation logic unchanged
- return stable neutral success text
- include `requestId` in responses and outbound webhook headers
- use short explicit timeout in the n8n service wrapper

## Open Implementation Notes

- This design intentionally keeps conversion tracking unchanged for now. During implementation, confirm whether conversions should still fire when webhook delivery succeeds, or whether that logic should move into n8n.
- This design intentionally keeps public route names unchanged to minimize browser-side changes.

## Exceptions

None currently proposed. If implementation reveals a reason to preserve legacy response fields temporarily for compatibility, document that as a temporary exception in implementation notes or PR notes.
