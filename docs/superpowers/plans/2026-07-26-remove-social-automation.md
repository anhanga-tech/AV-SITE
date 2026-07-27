# Dead Social Automation Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the never-completed social-announcement automation and its stale deployment documentation without changing active blog publication or n8n purchase dispatch.

**Architecture:** Treat the workflow, dispatcher, payload builder, runbook, and their three tests as one atomic dead-code unit. Delete the whole unit, then narrow the deployment documentation to the remaining active `purchase-dispatch` use.

**Tech Stack:** GitHub Actions YAML, TypeScript, Node.js test runner, Markdown, pnpm.

## Global Constraints

- Social promotion remains manual in Postiz.
- Do not add a replacement automation.
- Do not change blog publication behavior.
- Keep the active n8n `purchase-dispatch` integration unchanged.
- Remove all seven dead-code artifacts in the same implementation commit.

---

### Task 1: Remove the dead social-announcement unit

**Files:**
- Delete: `.github/workflows/notify-social-automation.yml`
- Delete: `scripts/notify-blog-published.ts`
- Delete: `lib/social-announcement.ts`
- Delete: `docs/ops/social-automation.md`
- Delete: `tests/notify-blog-published.test.ts`
- Delete: `tests/social-announcement.test.ts`
- Delete: `tests/notify-social-automation-workflow.test.ts`
- Modify: `docs/ops/deploy.md:56`

**Interfaces:**
- Consumes: the existing `N8N_WEBHOOK_SECRET` documentation for `purchase-dispatch`.
- Produces: a repository with no social-announcement workflow, implementation, runbook, tests, or outbound n8n claim.

- [ ] **Step 1: Run the acceptance guard and verify the current state fails**

Run:

```bash
node -e 'const fs=require("node:fs"); const targets=[".github/workflows/notify-social-automation.yml","scripts/notify-blog-published.ts","lib/social-announcement.ts","docs/ops/social-automation.md","tests/notify-blog-published.test.ts","tests/social-announcement.test.ts","tests/notify-social-automation-workflow.test.ts"]; const present=targets.filter((file)=>fs.existsSync(file)); if(present.length){console.error(`Dead social automation still present:\n${present.join("\n")}`); process.exit(1)}'
```

Expected: exit 1 listing all seven files. This is the red acceptance check: the repository still contains the unit that issue #1304 requires removing.

- [ ] **Step 2: Delete the seven files atomically**

Use `apply_patch` with one `*** Delete File` hunk for each path:

```text
.github/workflows/notify-social-automation.yml
scripts/notify-blog-published.ts
lib/social-announcement.ts
docs/ops/social-automation.md
tests/notify-blog-published.test.ts
tests/social-announcement.test.ts
tests/notify-social-automation-workflow.test.ts
```

- [ ] **Step 3: Narrow the n8n deployment documentation**

Replace the n8n environment-variable bullet in `docs/ops/deploy.md` with:

```markdown
- **n8n Webhook** (required in prod): `N8N_WEBHOOK_SECRET` — restrito a `purchase-dispatch` (inbound); não é mais usado para intake de formulários
```

- [ ] **Step 4: Re-run the acceptance guard and verify it passes**

Run the exact `node -e` command from Step 1.

Expected: exit 0 with no output.

- [ ] **Step 5: Verify no obsolete references remain outside historical design records**

Run:

```bash
git grep -n -E 'notify-blog-published|social-announcement|N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL|anúncio social do blog' -- ':!docs/superpowers/specs/2026-07-26-remove-social-automation-design.md' ':!docs/superpowers/plans/2026-07-26-remove-social-automation.md'
```

Expected: exit 1 with no matches.

- [ ] **Step 6: Run repository validation**

Run:

```bash
pnpm test:regression
pnpm typecheck
pnpm run build
```

Expected: each command exits 0 with no test failures or TypeScript/build errors.

- [ ] **Step 7: Inspect the final patch**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD
git diff HEAD -- docs/ops/deploy.md
```

Expected: no whitespace errors; exactly seven deletions, the one-line deployment documentation edit, and no generated or unrelated files.

- [ ] **Step 8: Commit the implementation**

```bash
git add .github/workflows/notify-social-automation.yml scripts/notify-blog-published.ts lib/social-announcement.ts docs/ops/social-automation.md tests/notify-blog-published.test.ts tests/social-announcement.test.ts tests/notify-social-automation-workflow.test.ts docs/ops/deploy.md
git commit -m "chore: remove dead social automation"
```
