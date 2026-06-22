# Plan 017: Mover o folder do design system da raiz para `docs/design/brand-system/` e atualizar o teste que o referencia

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. Touch
> only the files listed as in scope. If a STOP condition occurs, stop and report.
> Commit your work in the worktree following the git workflow section. SKIP
> updating `plans/README.md` if a reviewer dispatched you and said they maintain
> the index; otherwise update it.
>
> **Drift check (run first)**:
> `git diff --stat ec3029a..HEAD -- "Anhangá Viagens Design System/" tests/index-third-party-scripts.test.ts docs/design/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3 (optional aesthetics — see "Why")
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (independent of plan 012)
- **Category**: dx / docs
- **Planned at**: commit `ec3029a`, 2026-06-21

## Why this matters

`CLAUDE.md` says non-code documentation belongs under `/docs/`, yet the
human-facing design-system reference (`Anhangá Viagens Design System/`, with
`README.md`, `SKILL.md`, brand SVGs, `colors_and_type.css`, preview HTML) sits at
the repo root. Plan 012 deliberately left this folder alone because it is **not
inert clutter**: `tests/index-third-party-scripts.test.ts` reads it from the root
at runtime and asserts its `colors_and_type.css` documents the production Poppins
weights. So relocating it is only safe if the test is updated in the same change.
This plan does exactly that. It is genuinely optional — the folder is "load-bearing
via a test," so the only gain is honoring the root-minimal convention; skip it if
not worth the churn.

## Current state

Verified at commit `ec3029a`.

- `Anhangá Viagens Design System/` (repo root) — tracked folder. Files include
  `README.md`, `SKILL.md`, `assets/*.svg`, `colors_and_type.css`, `preview/*.html`.
  No code references it except the test below; the literal string
  `Anhangá Viagens Design System` does not appear in any `.ts/.tsx/.mjs/.json`.
- `tests/index-third-party-scripts.test.ts` — at **module load** (top level, not
  inside a `test()`), lines 6–13:
  ```ts
  const designSystemDir = fs.readdirSync(process.cwd()).find((entry) => entry.endsWith('Design System'));
  assert.ok(designSystemDir, 'design system directory should exist');
  const designSystemCssPath = path.resolve(process.cwd(), designSystemDir, 'colors_and_type.css');
  const designSystemCss = fs.readFileSync(designSystemCssPath, 'utf8');
  ```
  and the test `design system documents the production Poppins font weights`
  (lines 62–69) asserts `designSystemCss` contains the `@import` Google Fonts URL
  with `Poppins:wght@400;600;700;900`, no `800`, and the string
  `Poppins is loaded with 400/600/700/900 only`.
  The `.endsWith('Design System')` discovery is why a literal grep misses it.
- `docs/design/` already exists (holds `design-system.json`, `design-context.md`).
  The moved folder goes to `docs/design/brand-system/` (kebab-case, ASCII, no spaces).

Convention: ASCII kebab-case dir names under `docs/`; `node:test` + `assert/strict`.

## Commands you will need

| Purpose           | Command                                                    | Expected                       |
|-------------------|------------------------------------------------------------|--------------------------------|
| Install (once)    | `pnpm install --frozen-lockfile`                           | exit 0 (fresh worktree)        |
| This test only    | `tsx --test tests/index-third-party-scripts.test.ts`       | all pass                       |
| Full regression   | `pnpm test:regression`                                     | all pass                       |
| Old-ref check     | `git ls-files \| grep -c "Anhangá Viagens Design System"`   | `0` after the move             |

## Scope

**In scope** (the only files you should modify/move):
- `Anhangá Viagens Design System/` → `docs/design/brand-system/` (move)
- `tests/index-third-party-scripts.test.ts` (update the path resolution only)

**Out of scope** (do NOT touch):
- The *contents* of any moved file (move only; do not edit `colors_and_type.css`,
  the SVGs, etc.).
- `docs/design/design-system.json`, `docs/design/design-context.md`.
- The other 11 tests in `index-third-party-scripts.test.ts` — change only the
  top-level folder-resolution lines; leave every `test()` body intact.
- Anything plan 012 touches (dead file, `SEO/`, email signature) — independent.

## Git workflow

- Branch: `chore/move-design-system-docs`.
- Use `git mv` for the move (preserve history).
- Conventional commit: `chore: move design system para docs/design/brand-system`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Move the folder

```
git mv "Anhangá Viagens Design System" "docs/design/brand-system"
```

**Verify**: `git ls-files "docs/design/brand-system/" | head` lists the files;
`git ls-files | grep -c "Anhangá Viagens Design System"` → `0`.

### Step 2: Point the test at the new location

In `tests/index-third-party-scripts.test.ts`, replace the runtime discovery
(lines ~8 and ~12) with a direct path to the new home. Change:

```ts
const designSystemDir = fs.readdirSync(process.cwd()).find((entry) => entry.endsWith('Design System'));
assert.ok(designSystemDir, 'design system directory should exist');
const designSystemCssPath = path.resolve(process.cwd(), designSystemDir, 'colors_and_type.css');
```

to:

```ts
const designSystemCssPath = path.resolve(process.cwd(), 'docs/design/brand-system', 'colors_and_type.css');
assert.ok(fs.existsSync(designSystemCssPath), 'design system colors_and_type.css should exist at docs/design/brand-system');
```

Leave the `designSystemCss = fs.readFileSync(designSystemCssPath, 'utf8')` line
and all `test()` blocks unchanged. Do not touch the unrelated `fs`/`path` imports.

**Verify**: `tsx --test tests/index-third-party-scripts.test.ts` → all pass,
including `design system documents the production Poppins font weights`.

### Step 3: Full suite

```
pnpm test:regression
```

**Verify**: all tests pass.

## Test plan

No new test file. The behavior being preserved is exactly what
`tests/index-third-party-scripts.test.ts` already guards (the design-system CSS
documents the production font weights); this plan keeps that test green against
the new path. The regression suite (Step 3) is the safety net.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git ls-files | grep -c "Anhangá Viagens Design System"` → `0`
- [ ] `git ls-files docs/design/brand-system/colors_and_type.css` → present
- [ ] `tsx --test tests/index-third-party-scripts.test.ts` exits 0
- [ ] `pnpm test:regression` exits 0
- [ ] Only the move + that one test file changed
      (`git status --porcelain` shows renames under `docs/design/brand-system/`
      and a modified `tests/index-third-party-scripts.test.ts`, nothing else)
- [ ] `docs/design/design-system.json` / `design-context.md` unchanged
- [ ] `plans/README.md` status row updated (unless reviewer maintains it)

## STOP conditions

Stop and report back if:

- The folder `Anhangá Viagens Design System/` no longer exists at the root (maybe
  plan 012 was run with the old scope, or it was already moved) — report what you
  find; do not guess.
- After Step 2, the Poppins-weights test fails — it means `colors_and_type.css`
  did not move intact or the new path is wrong; do not edit the CSS to force a
  pass.
- Any OTHER test in `index-third-party-scripts.test.ts` starts failing — you
  changed more than the folder-resolution lines; revert and report.

## Maintenance notes

- For the reviewer: the diff should be a folder rename plus a 2-line change in one
  test. Confirm no `test()` body was altered and the CSS content is byte-identical
  to before the move.
- This makes the design-system reference's location no longer "magic" (a literal
  path instead of a `.endsWith` scan), which is also why a future grep will find
  it. Worth noting in the PR.
