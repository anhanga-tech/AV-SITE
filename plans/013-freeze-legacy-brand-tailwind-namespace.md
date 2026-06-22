# Plan 013: Congelar o namespace Tailwind legado `brand-*` com guard ratchet + documentar `anhanga-*` como canônico

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ec3029a..HEAD -- tailwind.config.mjs lib/design-tokens.ts tests/tailwind-bare-yellow-guard.test.ts .claude/CLAUDE.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `ec3029a`, 2026-06-21

## Why this matters

The Tailwind config defines **two overlapping color namespaces**: `brand.*`
(legacy) and `anhanga.*` (canonical). `lib/design-tokens.ts` is the declared
source of truth and maps every semantic token to `anhanga-*` classes, and the
config itself comments the `anhanga` entries as "(antigo brand-cyan / brand-vibrant)".
Yet `brand-*` is still used ~629 times across `components/` and `pages/`, and
**nothing stops new code from adding more** — so the two systems keep growing in
parallel, which confuses contributors about which token to reach for.

A full migration of all ~629 usages is high-risk (visual regressions, gated only
by snapshot tests) and low-value, so it is explicitly **not** in scope here.
Instead this plan stops the bleeding cheaply: a "ratchet" guard test that fails
CI when the count of legacy `brand-*` utilities **increases** past today's
baseline, plus a one-line deprecation note pointing future work at `anhanga-*`.
New code is nudged to the canonical namespace; the legacy usages migrate
opportunistically as files are touched, lowering the baseline over time. This
mirrors the existing `tests/tailwind-bare-yellow-guard.test.ts` pattern.

## Current state

Verified at commit `ec3029a`.

- `tailwind.config.mjs:18-45` — `theme.extend.colors` defines both namespaces:
  ```js
  colors: {
      brand: {
          cyan: '#0ea5e9', cyanDark: '#0284c7', blue: '#1e40af',
          vibrant: '#0ea5e9', yellow: '#FFD600', dark: '#0f172a',
          light: '#f0f9ff', surface: '#fffdf5',
      },
      // ...
      anhanga: {
          action:     '#0ea5e9',   // cor de ação (antigo brand-cyan / brand-vibrant)
          actionDark: '#0284c7',   // hover de ação (antigo brand-cyanDark)
          dark:       '#0f172a',
          blue: '#0056D2', darkBlue: '#003B8E',
          yellow: '#FFD600', yellowHover: '#E5C000',
          light: '#F4F8FF', whatsapp: '#25D366',
      },
  },
  ```
- `lib/design-tokens.ts` — canonical semantic tokens, **all** resolving to
  `anhanga-*` (e.g. `action: 'anhanga-action'`, `accent: 'anhanga-yellow'`,
  `dark: 'anhanga-dark'`). This is the authority that makes `anhanga-*` canonical
  and `brand-*` legacy.
- `tests/tailwind-bare-yellow-guard.test.ts` — **the exemplar to copy.** A
  `node:test` that walks `SCAN_DIRS = ['components','pages','services','utils','data']`
  with extensions `.tsx/.ts/.jsx/.js`, matches a regex per line via `matchAll`,
  and asserts an offender list. Match your new guard's structure to this file
  exactly (imports, `collectTailwindFiles`, `ROOT`, scan dirs/exts).
- Baseline count (measured with the regex this plan specifies, same scan scope):
  **≈ 629** occurrences (`components` 419, `pages` 204, `utils` 6, `services`/`data` 0).
  You will re-measure and pin the exact number in Step 2 — do not hardcode 629
  blindly; use what the guard actually counts in the current tree.

Conventions to follow:
- `node:test` + `assert/strict`, run via `tsx --test` (see `docs/standards/testing.md`).
- Portuguese comments matching the surrounding test files; explain the *why*
  (the ratchet intent), like the bare-yellow guard's header comment does.

## Commands you will need

| Purpose             | Command                                                    | Expected on success        |
|---------------------|------------------------------------------------------------|----------------------------|
| Run only this test  | `tsx --test tests/tailwind-brand-namespace-guard.test.ts`  | 1 test, pass               |
| Full regression     | `pnpm test:regression`                                     | all pass                   |
| Measure baseline    | (see Step 2 — a `grep -rohE … \| wc -l` over the scan dirs) | a single integer (~629)    |

> Run `pnpm install --frozen-lockfile` first if `node_modules` is absent. This
> plan adds a test + doc/comment only; no runtime code changes.

## Scope

**In scope** (the only files you should modify/create):
- `tests/tailwind-brand-namespace-guard.test.ts` (create)
- `tailwind.config.mjs` (add a deprecation comment above the `brand` block — no
  value/key changes)
- `.claude/CLAUDE.md` (one line in the "Styling" section noting `anhanga-*` is
  canonical and `brand-*` is frozen/legacy)

**Out of scope** (do NOT touch):
- Any `components/**` or `pages/**` file — do **not** migrate existing `brand-*`
  usages in this plan. That is deliberate; mass migration is a separate, risky
  effort to be done opportunistically.
- `lib/design-tokens.ts` — already canonical; leave it.
- The `brand` keys/values in `tailwind.config.mjs` — keep them working (629 live
  usages depend on them). You are only adding a comment.
- `tests/tailwind-bare-yellow-guard.test.ts` — copy its shape into the new file;
  do not edit the original.

## Git workflow

- Branch: `test/freeze-brand-namespace` (or `chore/`; repo uses
  `feature/`/`fix/`/`chore/`/`docs/` and `test:` conventional commits).
- Commit message style (conventional, matches `git log`):
  `test(guard): congela namespace legado brand-* com ratchet`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the guard test (without the baseline number yet)

Create `tests/tailwind-brand-namespace-guard.test.ts`, structured like
`tests/tailwind-bare-yellow-guard.test.ts`. Use this regex (based on the
bare-yellow prefix list, **extended** with `placeholder` and `ring-offset` so
those legacy utilities can't slip past the guard; matches legacy
`-brand-<subtoken>` color utilities and not the `anhanga-*` canonical ones):

```ts
const LEGACY_BRAND =
  /(?<![\w-])(text|bg|border|fill|stroke|ring(?:-offset)?|placeholder|from|to|via|divide|decoration|outline|accent|caret|shadow)-brand-[a-z][a-zA-Z]*(?![\w-])/g;
```

(The ~629 baseline was measured with these same prefixes, so the count stays
aligned. Re-measure in Step 1 regardless and pin what the guard actually counts.)

Reuse the exemplar's `SCAN_DIRS`, `TARGET_EXTENSIONS`, `ROOT`, and
`collectTailwindFiles` verbatim. Count every match across all scanned files into
a single integer `total`. Add a header comment explaining the ratchet intent:
this namespace is legacy (canonical is `anhanga-*`, see `lib/design-tokens.ts`);
the count must never grow; lower the baseline when you migrate usages away.

For now write the assertion as a temporary print so you can read the count:

```ts
test('legacy brand-* namespace does not grow (ratchet)', () => {
  const files = SCAN_DIRS.flatMap(collectTailwindFiles);
  assert.ok(files.length > 0, 'Expected to scan at least one Tailwind file');
  let total = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    total += [...text.matchAll(LEGACY_BRAND)].length;
  }
  console.log('CURRENT_BRAND_COUNT=', total); // TEMP — removed in Step 2
  assert.ok(true);
});
```

**Verify**: `tsx --test tests/tailwind-brand-namespace-guard.test.ts` → passes
and prints `CURRENT_BRAND_COUNT= <N>`. Confirm `<N>` is in the **620–640** range.
If it is wildly different (e.g. < 400 or > 800), the tree drifted from this
plan's baseline — **STOP** and report `<N>`.

### Step 2: Pin the baseline and make the assertion a real ratchet

Replace the temporary body: introduce a constant set to the `<N>` you just
observed, remove the `console.log`, and assert no growth. Example shape:

```ts
// Baseline medido em <YYYY-MM-DD> (commit ec3029a-descendant). Ao migrar
// usos de brand-* para anhanga-*, ABAIXE este número para travar o ganho.
const BRAND_NAMESPACE_BASELINE = <N>;

test('legacy brand-* namespace does not grow (ratchet)', () => {
  const files = SCAN_DIRS.flatMap(collectTailwindFiles);
  assert.ok(files.length > 0, 'Expected to scan at least one Tailwind file');
  const offenders: string[] = [];
  let total = 0;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(LEGACY_BRAND)) {
        total += 1;
        offenders.push(`${path.relative(ROOT, file)}:${i + 1} → ${m[0]}`);
      }
    });
  }
  assert.ok(
    total <= BRAND_NAMESPACE_BASELINE,
    `Uso de brand-* (legado) cresceu para ${total} (baseline ${BRAND_NAMESPACE_BASELINE}).\n` +
    `Use o namespace canônico anhanga-* (ver lib/design-tokens.ts). Novos usos:\n${offenders.join('\n')}`,
  );
});
```

**Verify**: `tsx --test tests/tailwind-brand-namespace-guard.test.ts` → 1 test,
pass. There must be **no** remaining `console.log` in the file
(`grep -n "console.log" tests/tailwind-brand-namespace-guard.test.ts` → empty).

### Step 3: Self-check that the ratchet actually catches growth

Temporarily append a single fake legacy class to any scanned file (e.g. add the
string `text-brand-cyan` inside a comment in `components/Footer.tsx`), re-run the
test, and confirm it now **fails** with the offender listed. Then revert the edit.

**Verify**: with the temporary class present →
`tsx --test tests/tailwind-brand-namespace-guard.test.ts` exits non-zero and the
message lists the offender. After `git checkout -- components/Footer.tsx`
(or whichever file you touched) → test passes again. `git status --porcelain`
shows only the new test file (+ Steps 4–5 docs) as changes.

### Step 4: Add the deprecation comment in the config

In `tailwind.config.mjs`, immediately above the `brand:` object (line ~19), add:

```js
// LEGADO — não usar em código novo. Namespace canônico: `anhanga-*`
// (ver lib/design-tokens.ts). Congelado por tests/tailwind-brand-namespace-guard.test.ts;
// migre usos de brand-* → anhanga-* oportunisticamente e abaixe o baseline do guard.
```

Do not change any color key or value.

**Verify**: `pnpm test:regression` still passes (config still parses; no token
removed). `git diff tailwind.config.mjs` shows only added comment lines.

### Step 5: Note the canonical namespace in CLAUDE.md

In `.claude/CLAUDE.md`, in the "### Styling" section (the paragraph that lists
the brand palette), add one sentence: the canonical Tailwind color namespace is
`anhanga-*` (semantic tokens in `lib/design-tokens.ts`); `brand-*` is legacy and
frozen by `tests/tailwind-brand-namespace-guard.test.ts` — new code must use
`anhanga-*`.

**Verify**: `git diff --stat .claude/CLAUDE.md` shows a small additive change.

### Step 6: Full suite

```
pnpm test:regression
```

**Verify**: all tests pass, including the new guard and the existing
`tailwind-bare-yellow-guard`.

## Test plan

- **New test**: `tests/tailwind-brand-namespace-guard.test.ts` — one ratchet test
  asserting `total <= BRAND_NAMESPACE_BASELINE`. Cases proven: (1) passes at
  baseline (Step 2), (2) fails on a synthetic new `brand-*` usage (Step 3).
- **Pattern to follow**: `tests/tailwind-bare-yellow-guard.test.ts` (structure,
  scan dirs, regex style, offender-list assertion).
- **Verification**: `pnpm test:regression` → all pass, including the 1 new test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `tests/tailwind-brand-namespace-guard.test.ts` exists and
      `tsx --test tests/tailwind-brand-namespace-guard.test.ts` exits 0
- [ ] `grep -n "console.log" tests/tailwind-brand-namespace-guard.test.ts` → empty
- [ ] `grep -n "BRAND_NAMESPACE_BASELINE" tests/tailwind-brand-namespace-guard.test.ts` → shows a numeric constant in 620–640
- [ ] `pnpm test:regression` exits 0
- [ ] No file under `components/` or `pages/` modified
      (`git status --porcelain | grep -E '^.{1,2} (components|pages)/'` → empty)
- [ ] `tailwind.config.mjs` diff is comment-only (no key/value changed)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The Step 1 count is outside 620–640 (tree drifted; the baseline number and the
  excerpts in "Current state" no longer match reality).
- The new guard fails at baseline (means the regex over-matches `anhanga-*` or
  numeric scales — report the offender list; do NOT migrate components to make it
  pass).
- Step 3 shows the ratchet does **not** fail on a synthetic new `brand-*` usage
  (the regex is wrong).
- You find yourself needing to edit a `components/`/`pages/` file to pass — that
  means scope crept into migration; stop.

## Maintenance notes

- For the reviewer: the diff must be additive — one new test + comments only,
  zero component changes and zero token removals. Confirm the baseline constant
  equals the measured count, not a guess.
- The ratchet permits net-zero churn (adding one `brand-*` while removing another
  keeps the count flat). That is acceptable: the goal is "no growth + nudge to
  `anhanga-*`," not perfect prevention. Tightening to per-file/changed-lines
  enforcement is a possible future upgrade, not needed now.
- When anyone migrates `brand-*` → `anhanga-*` usages, they should **lower**
  `BRAND_NAMESPACE_BASELINE` to the new count in the same PR, so the ratchet only
  ever tightens.
- Explicitly deferred (and why): the full `brand-*` → `anhanga-*` migration of
  ~629 usages — L effort, MED–HIGH visual-regression risk, gated only by
  snapshots; not worth a big-bang. Do it opportunistically as files are touched.
