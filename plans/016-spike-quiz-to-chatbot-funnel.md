# Plan 016 (SPIKE): Decidir se o resultado do quiz deve semear o chatbot em vez de ir direto ao WhatsApp

> **Executor instructions**: This is a SPIKE — deliverable is a written design
> document with a recommendation, **not** a behavior change. Do NOT modify the
> quiz or the chatbot. Investigate the two existing funnels, write the doc,
> answer the open questions honestly (including "leave it as-is"), and stop. If a
> STOP condition occurs, report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ec3029a..HEAD -- pages/landings/QuizAnhangaLanding.tsx hooks/useQuizCapture.ts utils/aiChat.ts components/AIChat.tsx lib/quiz-scoring.ts`
> If these changed since this plan was written, re-read them before writing the
> doc.

## Status

- **Priority**: P3
- **Effort**: M (investigation + writing)
- **Risk**: LOW (doc only)
- **Depends on**: none
- **Category**: direction (spike)
- **Planned at**: commit `ec3029a`, 2026-06-21

## Why this matters

The site runs **two independent lead funnels that don't connect**:

1. **Chatbot** — a cold visitor chats; the AI runs BANT qualification and hands
   off to a human (`api/generate.ts`, `lib/ai/handoff.ts`).
2. **Quiz** — `/quiz` computes a travel *profile* and a `bantSummary`, captures
   the lead, then sends the user straight to **WhatsApp**
   (`pages/landings/QuizAnhangaLanding.tsx`, result CTA `getWhatsAppLink`,
   `data-tracking="result-quiz-whatsapp"`).

The quiz already produces the *same kind of structured signal* (profile + BANT
summary) that the chatbot spends a whole conversation building — yet it bypasses
the chatbot entirely. Meanwhile a seam to seed the chatbot already exists:
`openAiChat({ message })` (`utils/aiChat.ts`) dispatches a `toggle-ai-chat`
CustomEvent carrying a seed message, consumed by `components/AIChat.tsx`. So
routing a warm quiz-taker into the chatbot (pre-seeded with their profile) is an
*adjacent-possible* — but it might also **hurt** conversion (quiz-takers already
gave contact info and may convert better via direct WhatsApp). This spike decides
which, instead of guessing. Likely outcome: "measure before changing."

## Current state (anchor the doc — verify)

Verified at commit `ec3029a`:

- `lib/quiz-scoring.ts` — `matchProfile()` → `ProfileKey`/profile name.
- `hooks/useQuizCapture.ts` — `submitQuiz()` posts `{ profileKey, profileName,
  bantSummary, destinos, … }` to `/api/submit-quiz` and fires a Salesforce lead;
  it has **no** reference to the chatbot.
- `pages/landings/QuizAnhangaLanding.tsx` — the result step (`WhatsAppUpgrade`,
  ~lines 695–860) builds a WhatsApp link via `getWhatsAppLink` and renders it as
  the primary CTA (`data-tracking="result-quiz-whatsapp"`). No `openAiChat` call.
- `utils/aiChat.ts` — `openAiChat({ message })` dispatches
  `new CustomEvent('toggle-ai-chat', { detail: { message } })`. **This is the
  seam** a quiz→chat route would use.
- `components/AIChat.tsx` — listens for `toggle-ai-chat` and (per `openAiChat`'s
  contract) can receive a seed `message`. Trace exactly how it consumes
  `detail.message` (does it inject as a user turn? open the panel? support more
  than a plain string?).

## Commands you will need

| Purpose            | Command                                                        | Expected |
|--------------------|----------------------------------------------------------------|----------|
| Trace the seam     | `grep -rn "toggle-ai-chat\|openAiChat\|detail" components/AIChat.tsx utils/aiChat.ts` | the listener + dispatcher |
| Quiz result CTA    | `grep -n "getWhatsAppLink\|openAiChat\|result-quiz" pages/landings/QuizAnhangaLanding.tsx` | the WhatsApp CTA, no chat |
| Baseline tests     | `pnpm test:regression`                                         | all pass |

## Scope

**In scope** (create only):
- `docs/product/quiz-to-chatbot-funnel-spike.md` (the deliverable)

**Out of scope** (do NOT modify):
- `pages/landings/QuizAnhangaLanding.tsx`, `hooks/useQuizCapture.ts`,
  `utils/aiChat.ts`, `components/AIChat.tsx`, `lib/quiz-*` — no behavior change.

## Steps

### Step 1: Document both funnels and the seed seam

In the doc, describe funnel 1 (chatbot/BANT) and funnel 2 (quiz→WhatsApp) with
`file:line` anchors, and precisely how `openAiChat({ message })` →
`toggle-ai-chat` → `AIChat.tsx` works today, including what `AIChat` does with
`detail.message` (the contract a quiz seed would rely on).

**Verify**: the doc's "Current funnels" section cites the quiz result CTA, the
`openAiChat` seam, and AIChat's handling of the seed, each with a line reference.

### Step 2: Define the proposed seed contract

Specify what a quiz→chat route would pass: a seed message built from
`profileName` + `bantSummary` + chosen `destinos`, and whether AIChat would need
to accept a richer payload than a plain string (e.g. pre-seed BANT state so the
AI doesn't re-ask what the quiz already learned). Note any change AIChat/`openAiChat`
would require to honor that.

**Verify**: the doc has a "Proposed seed contract" section with the exact shape
to pass and the AIChat change (if any) it implies.

### Step 3: Weigh it against the current WhatsApp handoff

Honest trade-off analysis:
- Why the current WhatsApp CTA may already be optimal (warm lead, human touch,
  contact already captured).
- What seeding the chatbot could add (continue qualification, richer handoff) and
  for which audience.
- The risk of replacing a working conversion path without data.
- How to **measure** (A/B the result CTA; the quiz already pushes `dataLayer`
  events in `useQuizCapture.ts` — note `quiz_lead`/`form_submission` as the
  measurement hook).

**Verify**: the doc has a "Trade-offs & measurement" section naming the existing
`dataLayer` events as the A/B instrumentation point.

### Step 4: Recommendation

End with an explicit, dated recommendation: **A/B test / build behind a flag /
leave as-is** — and the reasoning. Do not recommend a full build without a
measurement plan.

**Verify**: the doc ends with a dated recommendation + numbered open questions.

### Step 5: Confirm nothing shipped

```
git status --porcelain
pnpm test:regression
```

**Verify**: only `docs/product/quiz-to-chatbot-funnel-spike.md` (and the
`plans/README.md` row) changed; all tests pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `docs/product/quiz-to-chatbot-funnel-spike.md` exists with sections:
      Current funnels, Proposed seed contract, Trade-offs & measurement,
      Recommendation.
- [ ] No `*.ts/*.tsx` source modified
      (`git status --porcelain | grep -E '\.(ts|tsx)$' | grep -v '^.. docs/'` → empty)
- [ ] `pnpm test:regression` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The quiz result already routes into the chatbot (the asymmetry is gone) — then
  this spike's premise is stale; report what you found.
- `openAiChat`/`toggle-ai-chat` no longer exists or AIChat ignores `detail.message`
  — the seed seam you'd build on is gone; report it.

## Maintenance notes

- For the maintainer: decision document only. If the recommendation is to test,
  it feeds a separate implementation plan (add a secondary "Continuar com nossa
  IA" CTA on the quiz result that calls `openAiChat` with the seed, A/B against
  the WhatsApp CTA).
- Keep honest about the framing from `/improve next` (rodada 3): the asymmetry is
  real, the value is **unproven** — the current quiz→WhatsApp path converts a
  warm lead and should not be replaced on intuition.
