# Plan 012: Tirar artefatos/dumps obsoletos da raiz e respeitar a regra "root mínima"

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ec3029a..HEAD -- .gitignore "SEO/" "ferramentas/" "Anhangá Viagens Design System/" comparacao-ides.html docs/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" facts against the live tree before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx / docs
- **Planned at**: commit `ec3029a`, 2026-06-21
- **Revised**: 2026-06-21 — Step 5 (mover o folder do design system) **removido**
  após execução: `tests/index-third-party-scripts.test.ts` lê o folder da raiz em
  runtime (`.endsWith('Design System')`) e quebraria. Esse move foi para o
  plano [017](017-move-design-system-folder.md), que inclui o ajuste do teste no
  escopo. Este plano agora cobre só os três ganhos independentes (dead file, dump
  SEO, assinatura de e-mail).

## Why this matters

`CLAUDE.md` documents a hard rule: "Keep the project root minimal — only
`README.md`, `CLAUDE.md`, and code/tooling configs belong there. All other
documentation lives under `/docs/`." It also says reports with sensitive
business data "stay **local only** — add the filename pattern to `.gitignore`
instead of committing." Today the repo root violates both rules: stale SEO
crawl dumps, a dead stray HTML file, an email-signature asset, and a parallel
design-system folder are all tracked at the root. None is referenced by code or
build config. Cleaning this up reduces noise for contributors and agents, and
stops 18 point-in-time crawl exports (business data) from living in git history
going forward. There is precedent: commits `04fa143` and `39d0f62` already
untracked sensitive marketing docs the same way.

## Current state

Verified at commit `ec3029a`. All paths below are **tracked** in git and have
**no references** from any `*.ts/*.tsx/*.mjs/*.json/*.toml/*.html` file outside
the agent-config dirs (`grep` for `Anhangá Viagens Design System`, `/SEO/`,
`comparacao-ides`, `ferramentas/assinatura` returned nothing in code/config).

- `comparacao-ides.html` (root, ~19 KB) — a stray "IDE comparison" HTML page.
  Not part of the site, not imported, not referenced anywhere. **Dead artifact.**
- `SEO/` — 18 files: crawl exports (`*.csv`) plus `All issues - Anhanga1.pdf`,
  all dated `2026-05-28` (a one-off Ahrefs/crawler dump). These are exactly the
  "reports containing sensitive business data" the docs say to keep local-only.
- `ferramentas/assinatura-email.html` — a single email-signature HTML asset
  (one file in the dir). Misplaced; belongs under `docs/`.
- `Anhangá Viagens Design System/` — a design-system reference folder
  (`README.md`, `SKILL.md`, `assets/*.svg`, `colors_and_type.css`, `preview/*.html`).
  This is **not** the same as `docs/design/` (which holds the machine-readable
  `design-system.json` + `design-context.md`). It is a parallel human-facing
  design reference that belongs under `docs/design/`.

Repo conventions to follow:
- `docs/` is organized by domain (`docs/design/`, `docs/seo/`, `docs/marketing/`,
  `docs/ops/`, …). See the table in `CLAUDE.md` ("Documentation Organization").
- `.gitignore` already has a "Marketing reports, audits & campaigns" section
  (lines 46–57) listing patterns for local-only business docs. Add the SEO dump
  pattern in the same spirit.
- Prefer kebab-case, ASCII-only directory names (avoid spaces/accents) for new
  doc folders — the rest of `docs/` follows this.

## Commands you will need

| Purpose            | Command                                              | Expected on success            |
|--------------------|------------------------------------------------------|--------------------------------|
| Regression tests   | `pnpm test:regression`                               | all pass (same as baseline)    |
| Ref check (code)   | `grep -rln "comparacao-ides\|/SEO/\|ferramentas/assinatura\|Anhangá Viagens Design System" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.json" --include="*.toml" --include="*.html" . \| grep -v node_modules` | (empty)  |
| Tracked-at-root    | `git ls-files \| grep -E '^[^/]+$'`                   | no `comparacao-ides.html`      |
| Working tree state | `git status --porcelain`                             | only the intended moves/deletes|

> Note: `pnpm install --frozen-lockfile` first if `node_modules` is absent.
> This plan changes **no** TypeScript, so `pnpm typecheck` and `pnpm build`
> behavior is unchanged from baseline; running the regression suite is enough.

## Scope

**In scope** (the only paths you should modify/move/delete):
- `comparacao-ides.html` (delete)
- `SEO/` (untrack from git + add to `.gitignore`; leave the files on disk)
- `ferramentas/assinatura-email.html` (move → `docs/marketing/email-signature.html`)
- `.gitignore` (add the `SEO/` ignore pattern)

**Out of scope** (do NOT touch, even though they look related):
- `Anhangá Viagens Design System/` (root folder) — do NOT move or delete it here.
  `tests/index-third-party-scripts.test.ts` reads it from the repo root at runtime
  (`fs.readdirSync(process.cwd()).find(e => e.endsWith('Design System'))` + reads
  its `colors_and_type.css`). Moving it breaks that test. Its relocation is
  plan 017, which updates the test in the same change.
- `docs/design/design-system.json`, `docs/design/design-context.md` — the
  canonical token docs; do not merge or overwrite these.
- Any `*.ts/*.tsx` source file — this plan is file-system housekeeping only.
- The agent-config dirs (`.agent/`, `.agents/`, `.Jules/`, `.jules/`, `.qwen/`,
  `.codex/`) — already handled / intentionally local; leave them alone.
- `content/`, `src/`, `public/`, `data/` — legitimate code/content dirs.

## Git workflow

- Branch: `chore/root-housekeeping` (repo uses `feature/`, `fix/`, `chore/`,
  `docs/` prefixes — `chore/` fits file housekeeping).
- Use `git mv` for moves so history is preserved.
- Conventional commit, e.g. `chore: tira artefatos obsoletos da raiz para docs/`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm nothing references the in-scope paths

Run the "Ref check (code)" command from the table above.

**Verify**: command prints nothing (empty output). If it prints any file path
outside the agent-config dirs, **STOP** — something depends on a path you were
about to move/delete.

### Step 2: Delete the dead stray file

```
git rm comparacao-ides.html
```

**Verify**: `git ls-files | grep -E '^[^/]+$' | grep comparacao-ides` → no output.

### Step 3: Untrack the SEO crawl dump and ignore it going forward

Keep the files on disk (operator may still want them locally) but stop tracking:

```
git rm -r --cached SEO/
```

Then append to `.gitignore`, in the "Marketing reports, audits & campaigns"
section (after line 57), a new block:

```
# SEO crawl exports / audit dumps (business data — local only)
SEO/
```

**Verify**:
- `git ls-files SEO/` → no output (untracked).
- `git check-ignore SEO/` → prints `SEO/` (now ignored).
- `ls SEO/ | head -1` → still lists files (kept on disk).

### Step 4: Move the email-signature asset into docs/marketing/

```
mkdir -p docs/marketing
git mv "ferramentas/assinatura-email.html" "docs/marketing/email-signature.html"
```

If `ferramentas/` is now empty, remove the empty dir:
`rmdir ferramentas 2>/dev/null || true`

**Verify**: `git ls-files docs/marketing/email-signature.html` → prints the path;
`git ls-files ferramentas/` → no output.

### Step 5: Confirm the suite is unaffected

```
pnpm test:regression
```

**Verify**: all tests pass (this plan changed no code or test inputs, so the
result must match the pre-change baseline). In particular
`tests/package-scripts.test.ts` and any docs/structure tests still pass.

## Test plan

No new automated tests — this is file-system housekeeping with no behavior
change, which `docs/standards/testing.md` exempts ("Documentation-only changes
do not require runtime tests"). The safety net is:
- the ref-check grep (Step 1) proving nothing imports the moved/deleted paths,
- the full regression suite (Step 6) proving the build/test inputs are intact.

If `pnpm test:regression` references any of these paths (it should not), STOP.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git ls-files | grep -E '^[^/]+$' | grep -q comparacao-ides` → no match (exit 1)
- [ ] `git ls-files SEO/` → empty; `git check-ignore SEO/` → `SEO/`
- [ ] `git ls-files docs/marketing/email-signature.html` → present
- [ ] `Anhangá Viagens Design System/` still tracked at root (NOT moved — that is plan 017): `git ls-files | grep -c "Anhangá Viagens Design System"` → non-zero
- [ ] `pnpm test:regression` exits 0
- [ ] No `*.ts/*.tsx/*.mjs` file modified (`git status --porcelain | grep -E '\.(ts|tsx|mjs)$'` → empty)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The Step 1 ref check finds any code/config reference to an in-scope path.
- `git mv` fails because a target already exists under `docs/` (means the move
  was partially done before, or there's a name collision — report it).
- `pnpm test:regression` fails, or its failure mentions any in-scope path.
- The `SEO/` or design-system folder turns out to be referenced by a GitHub
  Actions workflow under `.github/workflows/` (re-check with
  `grep -rln "SEO/\|Design System\|ferramentas" .github/`).

## Maintenance notes

- For the reviewer: confirm the moved docs render/open from their new `docs/`
  homes and that the `SEO/` ignore did not accidentally also ignore a wanted
  path. The diff should contain only deletes, renames, and one `.gitignore` add.
- Follow-up deliberately deferred: this does NOT consolidate the agent-config
  dirs (`.agent/`, `.qwen/`, …) or the legacy `vercel.json`/`netlify.toml` —
  those were considered and rejected in earlier rounds as low-leverage DX, to be
  done opportunistically.
- If someone later wants the `SEO/` exports versioned for audit history, the
  right home is a dedicated `docs/seo/crawls/` with a `.gitignore` exception —
  but only if there's a concrete need; default is local-only.
