# Plan 014: Atualização automática de reviews do Google via GitHub Actions agendado

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ec3029a..HEAD -- scripts/fetch-google-reviews.ts package.json .github/workflows/generate-blog-manifest.yml data/googleReviews.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction (ops/DX)
- **Planned at**: commit `ec3029a`, 2026-06-21

## Why this matters

The site shows Google reviews (average rating, testimonials) sourced from
`data/googleReviews.json`. That file is regenerated only when a human manually
runs `pnpm reviews:fetch` and commits the result — there is **no scheduled
automation** (`grep -rn "schedule:" .github/workflows/` returns nothing). So the
social proof on the homepage silently goes stale until someone remembers to
refresh it. The repo already has the exact pattern for fixing this:
`generate-blog-manifest.yml` runs a generator script and opens a PR with the
changed data file. This plan adds an analogous **scheduled** workflow for
reviews, so the testimonials stay current with zero manual effort, and changes
still land via reviewable PR (not a silent commit to `main`).

## Current state

Verified at commit `ec3029a`.

- `scripts/fetch-google-reviews.ts` — the generator. Run via the npm script
  `reviews:fetch` (`package.json:22` → `tsx scripts/fetch-google-reviews.ts`).
  - **Required** env: `OUTSCRAPER_API_KEY`, `GOOGLE_PLACE_ID` (throws "Missing …"
    if absent — see `loadConfig()` at lines 118–131).
  - **Optional** env (photo upload to R2): `R2_BUCKET_NAME`, `R2_CDN_BASE_URL`,
    `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`. If the R2 vars are unset the
    script still runs and just emits empty `photoUrl`s (see `canUpload` guard,
    lines 260–272).
  - Writes `data/googleReviews.json` (line 292–293) and prints a JSON summary.
  - Reads `data/reviewsBlocklist.json` and `data/reviewAnnotations.json` (kept in
    git) to filter/annotate — these stay as-is.
- `.github/workflows/generate-blog-manifest.yml` — **the exemplar to copy.** It:
  checks out with `secrets.GITHUB_TOKEN`, installs pnpm + Node + deps, runs the
  generator, then `git add <data file>`, skips if no diff, else creates a branch
  `chore/…-${{ github.run_id }}`, commits, pushes, and `gh pr create`s. Match
  this structure. (Note: that file pins Node `22.13.1`; the repo's canonical
  version is Node 24 — use **24** in the new workflow to match `.node-version`
  and `ci.yml`. Do not "fix" the old workflow here — out of scope.)

Conventions:
- Workflows live in `.github/workflows/`, kebab-case `.yml`.
- `permissions: { contents: write, pull-requests: write }` for PR-opening jobs.
- Conventional-commit PR titles in Portuguese (see existing workflow body).

## Commands you will need

| Purpose                | Command                                                | Expected on success            |
|------------------------|--------------------------------------------------------|--------------------------------|
| YAML lint (local)      | `node -e "import('js-yaml').then(y=>y.load(require('fs').readFileSync('.github/workflows/refresh-reviews.yml','utf8'))).then(()=>console.log('ok'))"` if `js-yaml` is available; otherwise `python3 -c "import yaml,sys;yaml.safe_load(open('.github/workflows/refresh-reviews.yml'));print('ok')"` | prints `ok` |
| Regression suite       | `pnpm test:regression`                                 | all pass (unchanged baseline)  |
| Confirm npm script     | `node -e "console.log(require('./package.json').scripts['reviews:fetch'])"` | prints the tsx command |

> This plan adds **only** a workflow YAML file — no TypeScript, so typecheck/test
> behavior is unchanged. The workflow itself can only be truly exercised on
> GitHub with secrets present (see Preconditions).

## Preconditions (human, outside the executor's control)

These repo secrets must exist in GitHub → Settings → Secrets → Actions for the
workflow to succeed at runtime. The executor cannot set these; list them in the
PR description so the maintainer adds them before enabling the schedule:
- `OUTSCRAPER_API_KEY` (required), `GOOGLE_PLACE_ID` (required).
- `R2_BUCKET_NAME`, `R2_CDN_BASE_URL`, `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_API_TOKEN` (optional — only if review author photos should be
  re-uploaded to R2; omit to skip photos).

Do **not** put any secret value in the workflow file or anywhere in the repo —
reference them only via `${{ secrets.NAME }}`.

## Scope

**In scope** (the only files you should create/modify):
- `.github/workflows/refresh-reviews.yml` (create)

**Out of scope** (do NOT touch):
- `scripts/fetch-google-reviews.ts` — the generator works; do not modify it.
- `.github/workflows/generate-blog-manifest.yml` — copy its shape, don't edit it
  (including its stale Node version).
- `data/googleReviews.json`, `data/reviewsBlocklist.json`,
  `data/reviewAnnotations.json` — the workflow regenerates the first at runtime;
  do not hand-edit any of them in this plan.

## Git workflow

- Branch: `chore/automate-reviews-refresh`.
- Conventional commit: `chore(ci): workflow agendado para atualizar reviews do Google`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the scheduled workflow

Create `.github/workflows/refresh-reviews.yml` modeled on
`generate-blog-manifest.yml`, with these differences:

- `name: Refresh Google Reviews`
- Triggers:
  ```yaml
  on:
    schedule:
      - cron: "0 6 * * 1"   # toda segunda 06:00 UTC (~03:00 BRT)
    workflow_dispatch: {}     # permite execução manual para teste
  ```
- `permissions: { contents: write, pull-requests: write }`
- Job steps (mirror the exemplar): checkout (`token: ${{ secrets.GITHUB_TOKEN }}`),
  `pnpm/action-setup@v6.0.8`, `actions/setup-node@v6` with `node-version: 24` and
  `cache: "pnpm"`, `pnpm install --frozen-lockfile`.
- Run the generator with the env wired from secrets:
  ```yaml
  - name: Fetch Google reviews
    env:
      OUTSCRAPER_API_KEY: ${{ secrets.OUTSCRAPER_API_KEY }}
      GOOGLE_PLACE_ID: ${{ secrets.GOOGLE_PLACE_ID }}
      R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}
      R2_CDN_BASE_URL: ${{ secrets.R2_CDN_BASE_URL }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    run: pnpm run reviews:fetch
  ```
- Open-PR step: identical pattern to the exemplar, but `git add data/googleReviews.json`,
  branch `chore/update-google-reviews-${{ github.run_id }}`, commit message
  `chore: atualiza data/googleReviews.json`, PR title the same, PR body in
  Portuguese explaining it's an automated weekly refresh. Keep the
  `if git diff --cached --quiet; then … exit 0` no-op guard so empty refreshes
  don't open PRs.

**Verify**: the YAML lint command (table) prints `ok`.

### Step 2: Confirm the suite is unaffected

```
pnpm test:regression
```

**Verify**: all tests pass (no code/test inputs changed).

### Step 3: Sanity-check the workflow references

- `grep -n "reviews:fetch" .github/workflows/refresh-reviews.yml` → matches.
- `grep -n "node-version: 24" .github/workflows/refresh-reviews.yml` → matches.
- `grep -rn "secrets\." .github/workflows/refresh-reviews.yml` → only `${{ secrets.* }}` refs, **no literal values**.

**Verify**: all three greps behave as described.

## Test plan

No runtime unit test — this is a CI workflow (infra), which the testing standard
does not require unit coverage for, and the generator's pure helpers are already
covered by `tests/fetch-google-reviews.test.ts` (`filterReviews`, `applyBlocklist`,
`mergeAnnotations`, `sanitizeReviewText`). The safety net here is:
- YAML validity (Step 1),
- the existing regression suite still green (Step 2),
- a manual `workflow_dispatch` run by the maintainer after secrets are set
  (documented in the PR), which is the real end-to-end check.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `.github/workflows/refresh-reviews.yml` exists and is valid YAML (lint prints `ok`)
- [ ] It triggers on both `schedule` and `workflow_dispatch`
      (`grep -E "schedule:|workflow_dispatch" .github/workflows/refresh-reviews.yml` → both)
- [ ] It runs `pnpm run reviews:fetch` and uses `node-version: 24`
- [ ] No secret literal appears in the file (only `${{ secrets.* }}`)
- [ ] `pnpm test:regression` exits 0
- [ ] No file other than the new workflow is modified (`git status --porcelain`)
- [ ] `plans/README.md` status row updated
- [ ] PR description lists the required GitHub secrets (Preconditions section)

## STOP conditions

Stop and report back (do not improvise) if:

- `package.json` no longer has a `reviews:fetch` script, or it points elsewhere.
- `scripts/fetch-google-reviews.ts` no longer writes `data/googleReviews.json`
  (the open-PR `git add` path would be wrong).
- The exemplar `generate-blog-manifest.yml` is gone or radically restructured
  (you have no pattern to copy — report and ask).

## Maintenance notes

- For the reviewer: this only adds the automation; the **maintainer must add the
  GitHub secrets** before the first scheduled run, or the job will fail at
  `loadConfig()` with "Missing OUTSCRAPER_API_KEY". Confirm secrets exist, then
  trigger one manual `workflow_dispatch` run to validate end-to-end.
- The cron is weekly (Mondays 06:00 UTC). Adjust frequency to match Outscraper
  cost tolerance — each run is a paid API call.
- Pre-existing drift noted but intentionally NOT fixed here: `generate-blog-manifest.yml`
  pins Node 22.13.1 while the repo standard is Node 24. If someone normalizes CI
  Node versions later, include that file.
- If photo re-upload to R2 is wanted, the four optional Cloudflare/R2 secrets
  must also be set; otherwise reviews refresh with empty `photoUrl` (the UI
  already tolerates this).
