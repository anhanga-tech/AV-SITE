# Engineering Standards

This directory is the source of truth for how work should be done in AV-SITE.

It is written for both humans and coding agents. `docs/ops/agents.md` is the fast entry point. These documents hold the full rules.

## Scope

These standards apply to:

- New code
- Touched code
- New tests
- New or modified API handlers
- Security-sensitive fixes

They do not require repo-wide cleanup when a task touches a small, legacy area.

## How To Use This Pack

1. Start here and identify the areas your change touches.
2. Read the relevant domain guides before editing code.
3. Use the templates in `/docs/standards/templates/` when planning work, changing APIs, or preparing review notes.
4. If you intentionally break a rule, document the exception and the follow-up plan.

## Standards Map

- [`code-style.md`](./code-style.md)
  TypeScript, React, file boundaries, imports, naming, comments, hooks, and Tailwind usage.
- [`linting.md`](./linting.md)
  The progressive lint ratchet (`pnpm lint:changed`), what's enforced today, and the adoption path for widening it.
- [`testing.md`](./testing.md)
  Expectations for `node:test`, Playwright, regression coverage, and completion checks.
- [`api-conventions.md`](./api-conventions.md)
  Rules for handlers under `/api`, shared validation, JSON responses, request IDs, and provider integrations.
- [`security.md`](./security.md)
  Rules for sanitization, secrets, logging, webhooks, rate limits, AI safety boundaries, and safe HTML handling.

## Templates

- [`templates/pr-checklist.md`](./templates/pr-checklist.md)
  Use during review or before finalizing a change.
- [`templates/change-plan-template.md`](./templates/change-plan-template.md)
  Use when scoping implementation work or writing a change brief.
- [`templates/api-endpoint-template.md`](./templates/api-endpoint-template.md)
  Use for any new endpoint or significant API behavior change.

## Rule Levels

- `REQUIRED`
  The default rule. Breaking it requires an explicit exception.
- `RECOMMENDED`
  Strong default. You may deviate if there is a concrete reason.
- `AVOID`
  Anti-pattern. Use only with a documented reason and follow-up.

## Exception Process

Document exceptions in the closest operational artifact:

- PR notes or review checklist for small changes
- Change plan for scoped implementation work
- API endpoint template for route-level decisions

Each exception should include:

- What rule is being bypassed
- Why the exception is needed now
- Whether it is temporary or permanent
- What follow-up, if any, should remove the exception later

## Notes

- `docs/ops/security.md` is the vulnerability reporting policy.
- `docs/standards/security.md` is the engineering standard for building safely inside the codebase.
