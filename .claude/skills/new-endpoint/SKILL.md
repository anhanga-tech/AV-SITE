---
name: new-endpoint
description: Scaffold a new /api endpoint end to end — handler, Cloudflare adapter, schema, dev route, API catalog, tests — per the repo's endpoint template.
disable-model-invocation: true
argument-hint: <endpoint-name> <what it does>
---

# New API endpoint

Arguments: `$ARGUMENTS` — the endpoint name (kebab-case, e.g. `submit-feedback`) and what it does. If either is missing, ask before step 1.

An endpoint is **wired** when every registration point below exists; a handler with no adapter is dead in production, and one missing from the dev route map is dead under `pnpm dev`. Each step ends on its checkbox — don't move on with it unchecked.

## 1. Plan against the template

Read `docs/standards/templates/api-endpoint-template.md`, `.claude/rules/api-conventions.md`, and `.claude/rules/security.md`. Fill every section of the template for this endpoint in chat and confirm it with the user. Anything left blank — rate limit, PII handling, request ID policy — gets an explicit decision, or an "N/A" plus the reason.

- [ ] Template filled, every section decided, user confirmed.

## 2. Pick the handler shape

Pick the closest existing handler and copy its structure, not just its style:

| The endpoint… | Base it on |
|---|---|
| is a form that writes to Odoo (`res.partner` / `crm.lead`) | `createOdooSubmitHandler` (`lib/odoo-submit-handler.ts`); copy `api/submit-waitlist.ts` (partner-only) or `api/submit-contact.ts` (with a lead) |
| needs a signed token or an extra secret | `api/submit-nps.ts` (`checkExtraConfig`, `lib/nps-invite.ts`) |
| receives a webhook | `api/purchase-dispatch.ts`: a shared-secret header (`X-Webhook-Secret`) compared with `timingSafeEqual` before the payload is parsed. This authenticates the caller but gives no payload integrity or replay protection. If the sender signs payloads, verify the HMAC over the raw body instead, following the HMAC-SHA256 pattern in `lib/nps-invite.ts`. |
| is read-only / discovery | `api/health.ts`: same-origin `GET`/`HEAD` only, no CORS. If browsers must call it cross-origin, also answer `OPTIONS` and override `Access-Control-Allow-Methods`, since `buildCorsHeaders()` hard-codes `POST, OPTIONS`. |

Anything outside the shared factory follows the order in `api-conventions.md`, reusing `lib/network.ts` (`buildCorsHeaders`, `getClientIP`, `createRequestId`, `buildJsonResponse`, `buildJsonError`), `lib/rate-limit.ts`, and `lib/logger.ts`. Be exact about the trust mechanism in the step 1 plan: shared-secret auth and HMAC signature verification are different controls. For Odoo field mapping, add a pure adapter in `lib/odoo-lead-mapping.ts`; don't build the payload inside the handler.

- [ ] Handler shape chosen, reason stated.

## 3. Write the code

Create or update each of these:

1. `lib/schemas/<name>.ts` — the Zod schema for the request body. With `createOdooSubmitHandler`, wrap it in the `validate:` function (`safeParse` → `{ ok, data | error }`), as `api/submit-nps.ts` does. `submit-waitlist` and `submit-contact` predate this and validate by hand: copy their structure, not their validation. Put normalization in `lib/` (use `cleanString`, `normalizeNullable` etc. from `lib/lead-logic.ts`).
2. `api/<name>.ts` — the handler, with a default export `(req: Request) => Promise<Response>`.
3. `functions/api/<name>.ts` — the Cloudflare Pages adapter. Copy `functions/api/health.ts` exactly, changing only the import path. Pages routes by file path.
4. `vite.config.ts` → `DEV_API_ROUTES` — add `'/api/<name>': () => import('./api/<name>.ts')`.
5. `lib/api-catalog.ts`, for public endpoints only — add an `API_ENDPOINTS` entry (this feeds both the RFC 9727 catalog and OpenAPI), plus a `### METHOD /api/<name>` section in `buildApiDocs()`. Leave out internal-only webhooks, and say so in the PR.
6. New env vars go in `.env.example` and in the Environment Variables block of `.claude/CLAUDE.md`. Read them only at the handler's config-check boundary.
7. `.claude/CLAUDE.md` → the API Handlers table — add a row.

- [ ] All seven items done, or marked N/A with a reason.

## 4. Test

Write `tests/<name>.test.ts` with `node:test`, modelled on the matching test for the base handler (e.g. `tests/submit-waitlist.test.ts`). Mock every outbound call. For Odoo, use `tests/odoo-mock.ts` (`createOdooMock`, `setOdooEnv`, `clearOdooEnv`). Give each test case its own `x-real-ip` so rate-limit state doesn't leak between tests. Inside the rate-limit test, reuse one fixed IP for every request so the limit is actually reached (see `sharedIP` in `tests/submit-waitlist.test.ts`). Cover every row of the template's Response Contract:

- method gate, plus the CORS preflight for any endpoint browsers call cross-origin
- missing config → the config error comes back **before** any fetch
- invalid JSON / schema failure → 400 with a stable `code`
- rate limit → 429 with `RateLimit-*` headers
- the upstream failure mapping, with no raw upstream text in the body
- the success shape
- any security control you added: signature rejection, masking, replay

For public endpoints, extend `tests/api-catalog.test.ts` so the new path appears in the catalog, the OpenAPI paths and the docs.

- [ ] Every Response Contract row has a test that fails if you delete the code it covers.

## 5. Verify

Run `pnpm typecheck`, `pnpm test:regression`, and `pnpm lint:changed`. If the endpoint backs a browser-visible flow, also run the relevant `pnpm test:e2e` spec.

Run the built-in `security-review` skill on the diff. If the endpoint handles personal data, also check the flow against the `lgpd-brasil` skill (data minimization, consent, legal basis). Fix or rebut each finding.

- [ ] All commands green, output quoted in your summary.

## 6. Hand off

Work on a `feature/` branch. Put the filled template from step 1 in the PR description, and record any rule deviations there. The PR's end state is "ready for merge"; a human does the merge.
