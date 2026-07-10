# Linting Standard

## Purpose

Catch real correctness and accessibility bugs in new and touched code — unhandled promise rejections, broken React hooks rules, missing accessible names — without blocking unrelated PRs on the pre-existing codebase's debt.

## Applies To

- `**/*.ts`, `**/*.tsx` outside `dist/`, `.prerender-ssr/`, `node_modules/`, and generated files (`data/blogManifest.ts`, `data/blogMarkdown.ts`)

## REQUIRED

- Run `pnpm lint:changed` before considering a change complete when it touches `.ts`/`.tsx` files. CI runs the same command (`.github/workflows/ci.yml`) and is a required check.
- Fix every `error`-level finding `pnpm lint:changed` reports on files your change touches. These are the rules `eslint.config.js` treats as correctness bugs, not style preferences: `react-hooks/rules-of-hooks`, `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`, and the `jsx-a11y` recommended set.
- Do not add `eslint-disable` comments to silence a finding without a one-line reason the finding doesn't apply — matches the existing repo convention for exceptions (`docs/standards/code-style.md` comment guidance).
- Do not widen `eslint.config.js`'s `ignores` list to route around a finding in a file your change touches.

## RECOMMENDED

- Run `pnpm lint` (unscoped, whole repo) periodically to see how much pre-existing debt remains — informational only, not a gate. Use it to find good small cleanup candidates when you're already touching a file for another reason.
- Treat `warn`-level findings (`@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`) as worth fixing in code you're already touching, even though they don't block CI.

## AVOID

- Bulk-fixing lint findings across files unrelated to your change — `docs/standards/code-style.md`'s scope rule applies here too: new and touched code, not repo-wide cleanup in an unrelated PR.
- Adding new ESLint plugins or rules directly in a feature PR. Propose ratchet changes on their own, following the adoption path below.

## How the ratchet works

`eslint.config.js` applies to the whole repository, but enforcement in CI (`pnpm lint:changed`, `scripts/lint-changed.ts`) only lints files that changed relative to the PR's base commit (or the previous push commit, for direct pushes to `main`). The existing codebase predates this config and is not expected to pass it — that's expected, not a bug in the ratchet. Only files your PR actually touches are checked.

## Adoption path (tightening the ratchet over time)

The ratchet is deliberately narrow today. Widen it in small, separate PRs as debt is paid down or confidence grows — never silently as part of an unrelated feature change:

1. **Promote a `warn` rule to `error`** once a `git grep` shows the remaining violation count across the repo is low enough that a follow-up cleanup PR is realistic (e.g. `@typescript-eslint/no-explicit-any` once most legitimate boundary uses are annotated with a reason).
2. **Add a new rule** the same way any other rule was added here: pick one with clear correctness or accessibility value (not a style preference already covered by Prettier-equivalent formatting), verify it doesn't fire on the two or three highest-traffic files in the repo before enabling broadly, and document the addition in this file's REQUIRED section.
3. **Widen enforcement beyond changed files** (e.g. lint an entire directory unconditionally, not just touched files) only after a dedicated cleanup pass gets that directory to zero errors under the current ruleset — track it as its own issue, not a rider on a feature PR.
4. **Drop the changed-files scope entirely** (full-repo enforcement in CI) is the end state, once `pnpm lint` genuinely passes clean on `main` — at that point `scripts/lint-changed.ts` and this adoption section can be deleted, and `pnpm lint` becomes the CI gate directly.

## Examples

- `eslint.config.js` — the ruleset itself, with inline comments explaining why each rule is `error` vs `warn`.
- `scripts/lint-changed.ts` — the changed-files diff logic; base-ref resolution order is documented in its header comment.
- `.github/workflows/ci.yml`'s "Lint changed files" step — how CI computes the base ref safely (via `env:`, never interpolating `${{ github.event.* }}` directly into a `run:` block — see `docs/standards/security.md` and `tests/workflow-command-injection-guard.test.ts`).

## Exceptions

- Generated files (`data/blogManifest.ts`, `data/blogMarkdown.ts`) are excluded entirely — they're machine-written on every build, matching the exception already documented in `docs/standards/code-style.md`.
- `tests/**/*.ts` disables `@typescript-eslint/no-explicit-any` — mock/fixture shaping in tests legitimately needs looser typing than production code at a runtime boundary.
