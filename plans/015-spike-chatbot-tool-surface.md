# Plan 015 (SPIKE): Definir como expandir a superfície de tools do chatbot além de `generate_budget_link`

> **Executor instructions**: This is a SPIKE — its deliverable is a written
> design document plus a non-wired prototype, **not** shipped behavior. Do NOT
> change the live chatbot. Investigate, write the doc, answer the open questions
> honestly (including "don't build this"), and stop. If a STOP condition occurs,
> report instead of improvising. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ec3029a..HEAD -- lib/ai/ api/generate.ts`
> If these changed since this plan was written, re-read them before writing the
> doc — your architecture map must reflect the live code.

## Status

- **Priority**: P3
- **Effort**: M (investigation + writing)
- **Risk**: LOW (doc + unwired prototype only)
- **Depends on**: none
- **Category**: direction (spike)
- **Planned at**: commit `ec3029a`, 2026-06-21

## Why this matters

The AI chatbot is the core product surface, and its tool layer is cleanly
isolated — but it currently exposes exactly **one** tool, `generate_budget_link`
(`lib/ai/tools.ts`). The architecture makes adding structured tools
*disproportionately cheap in theory*, yet the request handler's routing is
hardwired to that single tool, so the real cost of a second tool is hidden until
someone tries. This spike makes the cost explicit and decides **whether** a
second tool is worth building (product value is currently unproven — treat "not
yet" as a valid outcome). The output is a decision aid, not a feature.

## Current state (facts to anchor the doc — verify, don't trust blindly)

Verified at commit `ec3029a`:

- `lib/ai/tools.ts` — defines the single `budgetTool: FunctionDeclaration`
  (name `generate_budget_link`).
- `api/generate.ts` wires tools at one point:
  `requestModelResponse()` → `config.tools = [{ functionDeclarations: [budgetTool] }]`
  (around line 280).
- The tool-call → handoff pipeline is **hardcoded to `generate_budget_link`** in
  three spots that any second tool must generalize:
  - `extractModelOutput()` (~line 337) and `extractBudgetToolCallFromText` —
    text-fallback extraction assumes the budget tool shape.
  - `normalizeBudgetToolResponse()` (~line 400) — early-returns unless
    `responseFunctionCall?.name === 'generate_budget_link'`, then runs
    `validateBudgetToolArgs`.
  - `buildStructuredHandoff()` (~line 429) — returns `undefined` unless the name
    is `generate_budget_link`, then calls `buildGenerateHandoff`.
- `lib/ai/handoff.ts` — `buildGenerateHandoff(args: BudgetToolArgs, …)` is
  budget-specific (BANT summary, IATA, etc.). `GenerateHandoff` is a
  budget-shaped interface.
- `lib/ai/validation.ts` — `validateBudgetToolArgs`, `buildSafetyMessage`,
  `buildRefinementMessage`: all budget-specific.
- Safety/discipline constraints the prompt enforces (`lib/ai/prompt.ts`):
  single-question-per-response, no manual CTAs/links, handoff only via the tool.
  A second tool must not erode these (the `repairTextualHandoff` machinery exists
  precisely to defend the budget handoff).
- Tests that encode the current contract (read them before proposing changes):
  `tests/ai-handoff.test.ts`, `tests/api-generate-normalization.test.ts`,
  `tests/tool-call-fallback.test.ts`, `tests/chatbot-regressions.test.ts`.

## Commands you will need

| Purpose          | Command                          | Expected            |
|------------------|----------------------------------|---------------------|
| Read AI tests    | `pnpm test:regression`           | all pass (baseline) |
| Find tool wiring | `grep -rn "generate_budget_link\|functionDeclarations\|buildStructuredHandoff\|normalizeBudgetToolResponse" api/ lib/ai/` | the sites listed above |

## Scope

**In scope** (create only):
- `docs/product/chatbot-tool-expansion-spike.md` (the design doc — the deliverable)

**Out of scope** (do NOT modify):
- Any file under `lib/ai/`, `api/generate.ts`, the prompt, or any test. This spike
  ships **no** behavior change. A prototype `FunctionDeclaration` goes **inside
  the doc as a fenced code block**, not as a wired source file.

## Steps

### Step 1: Map the current tool architecture

Trace and record (with `file:line`) how a tool call flows today: prompt → Gemini
`functionDeclarations` → `extractModelOutput` → `normalizeBudgetToolResponse` →
`buildStructuredHandoff`/`buildGenerateHandoff` → client `handoff`. Note every
place that hardcodes `generate_budget_link`.

**Verify**: the doc's "Current architecture" section names each hardcoded site
from "Current state" with a line reference, confirmed by the `grep` command.

### Step 2: Propose ONE concrete candidate tool

Pick a single, grounded candidate and specify it — do not enumerate ten ideas.
Grounded options (pick one, justify):
- `check_destination_status` — surface the existing blocked-destination logic
  (`detectBlockedDestination` in `lib/ai/validation.ts`) as a user-facing answer
  ("is X bookable?") instead of only a safety gate.
- `lookup_faq` — structured answers to common questions, reducing free-text
  hallucination risk.

For the chosen tool, write a draft `FunctionDeclaration` (parameters, required
fields, description) as a code block, mirroring `budgetTool`'s style.

**Verify**: the doc has exactly one proposed tool with a complete draft
declaration and a one-paragraph product justification.

### Step 3: Specify the integration cost (the generalization)

Describe precisely what must change to route N tools instead of one:
- Generalize the three hardcoded sites (Step 1) into a per-tool dispatch (e.g. a
  registry keyed by tool name → its validator + result builder).
- Whether `GenerateHandoff` must become a union, or the new tool returns a
  different response shape (e.g. an inline answer, not a handoff).
- Prompt changes needed so the model knows when to use which tool without
  breaking single-question discipline.
- Which existing tests would need to change and what **new** tests are required.

**Verify**: the doc's "Integration cost" section references the exact functions
to refactor and lists the test impact.

### Step 4: Open questions + recommendation

List the unknowns that block a build decision (product value/measurement, prompt
regression risk, added latency, maintenance). End with an explicit
recommendation: **build now / build behind a flag / defer** — and why. "Defer"
is an acceptable, even likely, conclusion.

**Verify**: the doc ends with a dated recommendation and a numbered open-questions
list.

### Step 5: Confirm nothing shipped

```
git status --porcelain
pnpm test:regression
```

**Verify**: the only changed/added file is `docs/product/chatbot-tool-expansion-spike.md`
(plus the `plans/README.md` status row). All tests pass (you changed no code).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `docs/product/chatbot-tool-expansion-spike.md` exists with sections:
      Current architecture, Proposed tool (+ draft declaration), Integration cost,
      Open questions, Recommendation.
- [ ] No file under `lib/ai/`, `api/`, or `tests/` modified
      (`git status --porcelain | grep -E '^.{1,2} (lib/ai/|api/|tests/)'` → empty)
- [ ] `pnpm test:regression` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The tool-routing code has already been generalized (no longer hardcodes
  `generate_budget_link`) — then this spike's premise is stale; report what you
  found.
- You conclude you cannot pick a grounded candidate tool without product input —
  document the blockers and stop rather than inventing a use case.

## Maintenance notes

- For the maintainer: this is a decision document. If the recommendation is
  "build", it becomes the input to a separate implementation plan; this spike
  deliberately ships nothing.
- Keep the doc honest about the speculative product value flagged when this was
  raised (`/improve next`, rodada 3): the architecture makes it cheap, but cheap
  ≠ worth it without demand signal.
