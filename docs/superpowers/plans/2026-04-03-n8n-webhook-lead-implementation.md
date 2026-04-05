# N8N Webhook Lead Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct HubSpot writes in the rich lead and waitlist API handlers with validated server-to-server n8n webhook delivery while preserving existing public route contracts and user-facing flow guarantees.

**Architecture:** Keep `api/submit-lead.ts` and `api/submit-waitlist.ts` as the trust boundary for parsing, validation, sanitization, and rate limiting. Introduce a focused `services/n8n.ts` transport plus optional payload builders so both routes emit stable webhook contracts and return neutral success responses. Frontend callers stay on the same route URLs, with only response-shape expectations updated away from HubSpot-specific fields.

**Tech Stack:** React 19, TypeScript, Vite edge-style API handlers, `node:test`, Playwright, shared helpers in `lib/` and `services/`

---

## File Structure

### New Files

- Create: `services/n8n.ts`
  Centralize webhook transport, timeout handling, auth headers, sanitized error mapping, and typed helper functions for lead and waitlist delivery.

- Create: `lib/n8n-payloads.ts`
  Build clean outbound payloads for the two workflows so route files stay focused on orchestration.

### Modified Files

- Modify: `api/submit-lead.ts`
  Remove HubSpot orchestration, keep validation/rate limiting, call `services/n8n.ts`, preserve async conversion tracking unless implementation uncovers a blocking dependency.

- Modify: `api/submit-waitlist.ts`
  Remove HubSpot orchestration, keep validation/rate limiting, call `services/n8n.ts`.

- Modify: `types/leadCapture.ts`
  Remove HubSpot-specific success response fields and add the new `N8N_WEBHOOK_ERROR` code.

- Modify: `types/waitlist.ts`
  Remove HubSpot-specific success response fields and add the new `N8N_WEBHOOK_ERROR` code.

- Modify: `hooks/useLeadCapture.ts`
  Update success parsing to stop expecting `contactId` and `dealId`, and update the fallback error copy away from HubSpot-specific wording.

- Modify: `tests/submit-lead.test.ts`
  Replace HubSpot API mocking with n8n webhook mocking and assert the normalized outbound contract.

- Modify: `tests/submit-waitlist.test.ts`
  Replace HubSpot API mocking with n8n webhook mocking and assert the normalized outbound contract.

- Modify: `tests/e2e/chatbot-lead-submit.spec.ts`
  Keep the WhatsApp handoff guarantees, but remove HubSpot-specific assertions from mocked responses and expectations.

- Modify: `tests/e2e/lollapalooza-waitlist.spec.ts`
  Adjust any response expectations if they still assume `contactId` or HubSpot-specific messaging.

- Modify: `README.md`
  Update environment variable documentation and integration description from HubSpot direct writes to n8n webhooks if the README still documents the old flow.

## Chunk 1: Shared N8N Transport and Payload Builders

### Task 1: Add typed webhook payload builders

**Files:**
- Create: `lib/n8n-payloads.ts`
- Modify: `types/leadCapture.ts`
- Modify: `types/waitlist.ts`
- Test: `tests/submit-lead.test.ts`
- Test: `tests/submit-waitlist.test.ts`

- [ ] **Step 1: Write failing route-level assertions for the new outbound payload shapes**

Add or update route tests to assert that:

- `submit-lead` sends `requestId`, `source`, `lead`, `utms`, `tracking`, and `meta.receivedAt`
- `submit-waitlist` sends `requestId`, `source`, `waitlist`, `utms`, `tracking`, and `meta.receivedAt`
- response success shape no longer depends on `contactId` or `dealId`

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-lead|submit-waitlist"
```

Expected:

- FAIL because the handlers still call HubSpot and still return legacy response fields

- [ ] **Step 2: Add the response-type changes first**

Update `types/leadCapture.ts`:

- remove `contactId` and `dealId` from `SubmitLeadSuccess`
- keep `warning?`
- keep `message`
- add `'N8N_WEBHOOK_ERROR'` to `SubmitLeadErrorCode`

Update `types/waitlist.ts`:

- remove `contactId` from `SubmitWaitlistSuccess`
- keep `warning?`
- keep `message`
- add `'N8N_WEBHOOK_ERROR'` to `SubmitWaitlistErrorCode`

- [ ] **Step 3: Implement payload builder helpers**

In `lib/n8n-payloads.ts`, add small focused builders:

- `buildN8nLeadPayload(payload: SubmitLeadRequest, requestId: string)`
- `buildN8nWaitlistPayload(payload: SubmitWaitlistRequest, requestId: string)`

Required shape:

```ts
{
  requestId,
  source: 'submit-lead' | 'submit-waitlist',
  lead? / waitlist?,
  utms,
  tracking,
  meta: { receivedAt: new Date().toISOString() }
}
```

Implementation rules:

- do not re-sanitize here; trust validated route input
- keep the shape explicit and stable
- preserve `null` values where the normalized types already produce them

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-lead|submit-waitlist"
```

Expected:

- route tests still fail overall because transport is still HubSpot-based
- type-level and shape-related expectations compile cleanly

- [ ] **Step 5: Commit**

```bash
git add types/leadCapture.ts types/waitlist.ts lib/n8n-payloads.ts tests/submit-lead.test.ts tests/submit-waitlist.test.ts
git commit -m "refactor: define n8n lead and waitlist contracts"
```

### Task 2: Add the shared n8n transport

**Files:**
- Create: `services/n8n.ts`
- Test: `tests/submit-lead.test.ts`
- Test: `tests/submit-waitlist.test.ts`

- [ ] **Step 1: Write failing tests for webhook transport behavior through the route seam**

Extend the route tests so they assert:

- request hits the configured n8n URL
- `X-Webhook-Secret` and `X-Request-Id` headers are sent
- timeout or non-2xx response produces `N8N_WEBHOOK_ERROR`

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-lead|submit-waitlist"
```

Expected:

- FAIL because no n8n transport exists yet

- [ ] **Step 2: Implement `services/n8n.ts`**

Add:

- `getN8nTimeoutMs()`
- `n8nRequest(url: string, secret: string, requestId: string, payload: unknown): Promise<Response>`
- `sendLeadToN8n(...)`
- `sendWaitlistToN8n(...)`

Behavior requirements:

- `Content-Type: application/json`
- `X-Webhook-Secret`
- `X-Request-Id`
- explicit timeout using `AbortController`
- throw sanitized errors on timeout and non-2xx response

Suggested internal error format:

```ts
new Error(`N8N_WEBHOOK_ERROR:${status}:${detail}`)
```

and for timeout:

```ts
new Error(`N8N_WEBHOOK_ERROR:504:Webhook request timed out after ${timeoutMs}ms`)
```

- [ ] **Step 3: Keep the service free of route-specific logic**

Do not:

- read request bodies directly
- perform validation already handled in `lib/`
- shape client responses inside `services/n8n.ts`

Do:

- keep env handling at the route/config boundary
- keep transport only in `services/n8n.ts`

- [ ] **Step 4: Run focused regression tests**

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-lead|submit-waitlist"
```

Expected:

- some route tests may still fail because handlers are not using the service yet
- transport-related assertions should now have an implementation target

- [ ] **Step 5: Commit**

```bash
git add services/n8n.ts tests/submit-lead.test.ts tests/submit-waitlist.test.ts
git commit -m "feat: add n8n webhook transport service"
```

## Chunk 2: Migrate Public API Handlers

### Task 3: Migrate `submit-lead` to n8n delivery

**Files:**
- Modify: `api/submit-lead.ts`
- Modify: `tests/submit-lead.test.ts`

- [ ] **Step 1: Write or update failing tests for the new route behavior**

Cover:

- success returns `201` with `message: "Enviado com sucesso"`
- success does not require `contactId` or `dealId`
- invalid webhook config returns `SERVER_CONFIG_ERROR`
- non-2xx webhook response returns `N8N_WEBHOOK_ERROR`
- outbound request body uses the normalized contract from `lib/n8n-payloads.ts`

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-lead"
```

Expected:

- FAIL with the legacy HubSpot behavior

- [ ] **Step 2: Replace the HubSpot config boundary**

In `api/submit-lead.ts`:

- remove `HUBSPOT_*` config requirements from the route
- add a route-local config function for:
  - `N8N_SUBMIT_LEAD_WEBHOOK_URL`
  - `N8N_WEBHOOK_SECRET`
- keep request ID generation
- keep CORS, method gate, parse, validation, and rate limiting order

- [ ] **Step 3: Remove HubSpot orchestration from the route**

Delete route-local responsibilities that are now obsolete:

- create/update contact flow
- additional property enrichment flow
- deal creation flow
- fallback HubSpot note flow
- HubSpot-specific warning/error parsing

Replace with:

- `buildN8nLeadPayload(validatedPayload, requestId)`
- `sendLeadToN8n(webhookUrl, secret, requestId, outboundPayload)`

- [ ] **Step 4: Return the new success and error contracts**

Success:

```json
{
  "ok": true,
  "requestId": "req_123",
  "message": "Enviado com sucesso"
}
```

Failure on n8n transport:

```json
{
  "ok": false,
  "requestId": "req_123",
  "code": "N8N_WEBHOOK_ERROR",
  "error": "Erro ao enviar lead."
}
```

Keep error copy sanitized and product-neutral.

- [ ] **Step 5: Preserve async conversion tracking unless blocked**

Keep `trackLeadConversions(payload, requestId)` after a successful webhook delivery unless implementation proves that:

- conversions depend on HubSpot IDs
- or the spec must be amended

If blocked, stop and amend the spec rather than making an implicit product decision.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-lead"
```

Expected:

- PASS

- [ ] **Step 7: Commit**

```bash
git add api/submit-lead.ts tests/submit-lead.test.ts
git commit -m "refactor: route submit-lead through n8n webhook"
```

### Task 4: Migrate `submit-waitlist` to n8n delivery

**Files:**
- Modify: `api/submit-waitlist.ts`
- Modify: `tests/submit-waitlist.test.ts`

- [ ] **Step 1: Write or update failing tests for the waitlist route**

Cover:

- success returns `201` with `message: "Enviado com sucesso"` or the approved waitlist-specific success text if product chooses to keep it separate during implementation
- route sends waitlist-specific outbound payload
- missing config returns `SERVER_CONFIG_ERROR`
- n8n failure returns `N8N_WEBHOOK_ERROR`

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-waitlist"
```

Expected:

- FAIL with the current HubSpot behavior

- [ ] **Step 2: Replace the HubSpot-specific flow**

In `api/submit-waitlist.ts`:

- keep method handling
- keep rate limiting
- keep `validateWaitlistPayload`
- remove contact creation, list membership, and note creation logic
- replace with:
  - route-local config lookup for `N8N_SUBMIT_WAITLIST_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET`
  - `buildN8nWaitlistPayload(validatedPayload, requestId)`
  - `sendWaitlistToN8n(...)`

- [ ] **Step 3: Return the new neutral response contract**

Success:

```json
{
  "ok": true,
  "requestId": "req_456",
  "message": "Enviado com sucesso"
}
```

No HubSpot-specific response data should remain.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm test:regression -- --test-name-pattern="submit-waitlist"
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```bash
git add api/submit-waitlist.ts tests/submit-waitlist.test.ts
git commit -m "refactor: route waitlist submissions through n8n webhook"
```

## Chunk 3: Frontend and E2E Compatibility

### Task 5: Update frontend response parsing for the neutral contract

**Files:**
- Modify: `hooks/useLeadCapture.ts`
- Modify: `components/AIChat.tsx`
- Modify: `components/CallToAction.tsx`
- Test: `tests/e2e/chatbot-lead-submit.spec.ts`

- [ ] **Step 1: Write or update the failing browser and hook expectations**

Focus on observable behavior:

- chatbot still opens WhatsApp immediately
- lead submit still happens in the background
- success no longer depends on `contactId` or `dealId`
- any fallback client copy no longer mentions HubSpot

Run:

```bash
pnpm test:e2e -- chatbot-lead-submit
```

Expected:

- FAIL if the browser test still expects HubSpot-specific success payloads or copy

- [ ] **Step 2: Update `hooks/useLeadCapture.ts`**

Adjust:

- `SubmitLeadSuccessResult` to require only `requestId`, `warning?`, and a successful `ok`
- `buildSubmitLeadSuccessResult()` to stop extracting `contactId` and `dealId`
- default error text in `buildSubmitLeadErrorResult()` to change from HubSpot wording to neutral wording such as `Falha ao enviar lead.`

Do not change:

- event ID generation
- tracking capture
- dataLayer behavior

- [ ] **Step 3: Update any UI assumptions if needed**

Review `components/AIChat.tsx` and `components/CallToAction.tsx` for any logic that depends on `contactId`, `dealId`, or HubSpot-specific wording. Keep behavior unchanged if no dependency exists.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm test:e2e -- chatbot-lead-submit
pnpm test:regression -- --test-name-pattern="useLeadCapture|submit-lead"
```

Expected:

- PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useLeadCapture.ts components/AIChat.tsx components/CallToAction.tsx tests/e2e/chatbot-lead-submit.spec.ts
git commit -m "refactor: align lead capture UI with n8n response contract"
```

### Task 6: Update waitlist browser coverage if needed

**Files:**
- Modify: `tests/e2e/lollapalooza-waitlist.spec.ts`

- [ ] **Step 1: Inspect the test for HubSpot-specific assumptions**

Check for:

- mocked response requiring `contactId`
- success copy requiring old CRM-oriented text

- [ ] **Step 2: Update test expectations minimally**

Keep:

- user-visible success behavior
- route URL
- form submission guarantees

Remove:

- provider-specific response assumptions

- [ ] **Step 3: Run focused E2E verification**

Run:

```bash
pnpm test:e2e -- lollapalooza-waitlist
```

Expected:

- PASS

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/lollapalooza-waitlist.spec.ts
git commit -m "test: align waitlist e2e coverage with n8n flow"
```

## Chunk 4: Docs and Final Verification

### Task 7: Update environment and integration docs

**Files:**
- Modify: `README.md`
- Modify: any example env docs that still describe HubSpot as the direct lead destination

- [ ] **Step 1: Write doc changes**

Update:

- required environment variables
- architecture description for lead capture
- any setup wording that still says direct HubSpot submission from the app

Keep docs scoped to touched areas only.

- [ ] **Step 2: Verify docs for accuracy against implementation**

Check that docs reference:

- `N8N_SUBMIT_LEAD_WEBHOOK_URL`
- `N8N_SUBMIT_WAITLIST_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET`

- [ ] **Step 3: Commit**

```bash
git add README.md docs
git commit -m "docs: update lead capture setup for n8n webhooks"
```

### Task 8: Run full verification before completion

**Files:**
- Modify: none unless failures require targeted fixes

- [ ] **Step 1: Run regression coverage**

```bash
pnpm test:regression
```

Expected:

- PASS

- [ ] **Step 2: Run type checks**

```bash
pnpm typecheck
```

Expected:

- PASS

- [ ] **Step 3: Run targeted browser coverage**

```bash
pnpm test:e2e -- chatbot-lead-submit
pnpm test:e2e -- lollapalooza-waitlist
```

Expected:

- PASS

- [ ] **Step 4: Review git diff for scope control**

Run:

```bash
git diff --stat
git diff -- api/submit-lead.ts api/submit-waitlist.ts services/n8n.ts lib/n8n-payloads.ts hooks/useLeadCapture.ts tests/submit-lead.test.ts tests/submit-waitlist.test.ts tests/e2e/chatbot-lead-submit.spec.ts tests/e2e/lollapalooza-waitlist.spec.ts README.md
```

Expected:

- only route, service, payload, type, test, and doc files relevant to the n8n migration are changed

- [ ] **Step 5: Final commit**

```bash
git add api/submit-lead.ts api/submit-waitlist.ts services/n8n.ts lib/n8n-payloads.ts hooks/useLeadCapture.ts types/leadCapture.ts types/waitlist.ts tests/submit-lead.test.ts tests/submit-waitlist.test.ts tests/e2e/chatbot-lead-submit.spec.ts tests/e2e/lollapalooza-waitlist.spec.ts README.md
git commit -m "feat: migrate lead capture flows to n8n webhooks"
```

## Standards Checklist

- [x] `docs/standards/code-style.md`
- [x] `docs/standards/testing.md`
- [x] `docs/standards/api-conventions.md`
- [x] `docs/standards/security.md`

## Notes for the Implementer

- Keep the current route URLs to avoid unnecessary browser churn.
- Reuse the existing validation helpers. Do not move validation responsibility into n8n.
- Keep logs structured and avoid logging secrets, full webhook URLs with secrets, or raw PII.
- If the implementation reveals that conversion tracking should move to n8n, stop and amend the approved spec instead of making that product decision implicitly.
- There is an unrelated existing modification in `index.html` in the working tree. Do not overwrite or revert it.

## Review Constraint

This environment has subagent tooling, but delegation is not permitted unless the user explicitly asks for subagents. Because of that, the plan-document reviewer loop from the skill is intentionally not executed here. If subagent use becomes explicitly authorized later, run a plan review pass before execution.
