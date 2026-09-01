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
- For an isolated component's rendered DOM behavior (what shows up, what attribute a toggle sets) that doesn't need a full route composition or real browser accessibility semantics, use the third tier: `node:test` + happy-dom + `@testing-library/react` (`import './helpers/dom-setup.ts';` first, then `render()`/`fireEvent`, with `afterEach(cleanup)`). See `docs/standards/dom-testing-tier-decision.md` for the jsdom-vs-happy-dom rationale, measured CI-time impact, and what this tier does *not* replace (route composition already goes through `ssr.tsx` without any DOM in memory — `tests/parques-brasil-hub.test.ts` is the model; real accessibility-tree assertions still belong in Playwright). Don't reach for this tier as a default — most of the suite is pure logic and doesn't need a DOM at all.
- Use Playwright for browser-visible flows when the change crosses the UI and network boundary or affects critical conversion paths.
- Mock outbound provider calls and browser route traffic in tests. Do not hit live Gemini, Meta, or GA endpoints from automated tests.
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
- Visual regression tests (`tests/e2e/visual.spec.ts`) are tagged `@visual` and **excluded from the default `pnpm test:e2e`** run, because their baselines are generated on CI (Linux) and font antialiasing differs per platform — so they always diff locally without being a real regression.
  - Run them explicitly with `pnpm test:e2e:visual` (reliable only on Linux / the CI image).
  - Update baselines intentionally via the `update-snapshots.yml` workflow (`workflow_dispatch`), not by committing locally-generated snapshots. CI runs raw `playwright test`, which includes `@visual`, so a visual diff still gates `main`.

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
- `tests/orlando-imagens.test.ts` is the model for the third tier: real component rendering via happy-dom + `@testing-library/react` instead of regex over a component's source text.

## Exceptions

- Documentation-only changes do not require runtime tests.
- Very small copy-only changes in static content may rely on existing coverage if no behavior changes and no rendering branch changes.
- If a legacy area cannot be tested safely within scope, document the risk, explain why, and record the follow-up work needed to create a test seam.
