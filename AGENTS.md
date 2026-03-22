# AGENTS.md

This repository uses `/docs/standards/` as the source of truth for engineering rules.

Read these documents before making changes:

1. `/docs/standards/README.md`
2. `/docs/standards/code-style.md`
3. `/docs/standards/testing.md`
4. `/docs/standards/api-conventions.md`
5. `/docs/standards/security.md`

## Agent Contract

- Apply the standards to new code and touched code. Do not expand scope into repo-wide cleanup unless the task explicitly asks for it.
- Keep the current stack and architecture intact: React 19, TypeScript, Vite, Playwright, `node:test`, edge-style API handlers, and shared helpers under `lib/` and `services/`.
- Add or update automated tests for behavior changes. Documentation-only changes do not require runtime tests.
- Validate and sanitize all untrusted input before side effects or outbound provider calls.
- Reuse existing helpers for CORS, client IP extraction, rate limiting, validation, and provider integration instead of creating parallel patterns.
- Do not log secrets, raw tokens, or raw PII. Mask or omit sensitive data in logs.
- When changing or adding API handlers, follow `/docs/standards/api-conventions.md` and use `/docs/standards/templates/api-endpoint-template.md`.
- Record intentional deviations in the appropriate template or PR notes. Silence is not an exception process.

## Working Rule

If tool-specific instruction files exist, use them for workflow details, but use `/docs/standards/` as the engineering source of truth for code style, testing, API behavior, and security expectations.
