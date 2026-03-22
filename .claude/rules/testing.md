# Testing Standard

## Purpose

Make behavior changes safe by choosing the smallest meaningful automated test first, while still covering the user-critical flows that matter most in this project.

## Applies To

- All changes that alter behavior
- New or changed TypeScript helpers
- API handlers under `api/`
- Browser flows involving chat, lead capture, waitlists, SEO, navigation, or tracking

## REQUIRED

- Add or update automated tests for every behavior change. If behavior changes and no automated test changes, explain why.
- Put pure logic, validation, normalization, and provider-shaping tests in `tests/*.test.ts` using `node:test` and `assert/strict`.
- Use Playwright for browser-visible flows when the change crosses the UI and network boundary or affects critical conversion paths.
- Mock outbound provider calls and browser route traffic in tests. Do not hit live Gemini, HubSpot, Meta, or GA endpoints from automated tests.
- Test observable behavior, public outputs, and response contracts. Do not anchor tests to internal implementation details unless there is no stable external seam.
- Add a regression test for every bug fix that has a clear reproducible failure mode.
- Keep tests deterministic:
  - avoid shared mutable state across tests
  - generate fresh request IDs or IPs when rate limiting matters
  - stub network and timing where feasible
- Run the relevant verification command before closing the task:
  - `pnpm test:regression` for unit and regression coverage
  - `pnpm test:e2e` when the change affects Playwright-covered browser behavior
  - `pnpm typecheck` when the change touches TypeScript code in a way that could break compile-time contracts

## RECOMMENDED

- Start with the smallest useful test surface:
  - helper or validation change -> `node:test`
  - route contract or provider orchestration change -> `node:test`
  - browser interaction, accessibility, or navigation change -> Playwright
- Prefer page objects and reusable helpers for complex Playwright flows, following the pattern in `tests/e2e/pages/`.
- Name tests as behavior statements, not implementation hints.
- Keep each test focused on one scenario or one contract guarantee.
- When touching content or generation scripts, verify the scripts that feed runtime behavior, as `tests/package-scripts.test.ts` already does.
- Treat snapshot updates as intentional product changes and mention them in review notes.

## AVOID

- Using E2E tests for logic that can be covered faster and more clearly in `node:test`.
- Depending on external services, network availability, or real production credentials in test runs.
- Writing selectors that depend on brittle DOM structure when role, label, or visible text is available.
- Asserting internal helper call counts when the user-facing result or returned payload is the real contract.
- Leaving flaky waits or arbitrary sleeps in Playwright when route waits, locator expectations, or polling can prove the behavior directly.

## Examples

- `tests/submit-lead.test.ts` covers an edge-style handler with mocked provider requests and contract-level assertions.
- `tests/api-generate-normalization.test.ts` covers AI response shaping and safety guardrails at the server boundary.
- `tests/e2e/chatbot-lead-submit.spec.ts` covers a full browser flow where chat output, lead submission, and WhatsApp handoff must stay aligned.
- `tests/e2e/destructive.spec.ts` is a good model for security-sensitive browser regression coverage.

## Exceptions

- Documentation-only changes do not require runtime tests.
- Very small copy-only changes in static content may rely on existing coverage if no behavior changes and no rendering branch changes.
- If a legacy area cannot be tested safely within scope, document the risk, explain why, and record the follow-up work needed to create a test seam.
