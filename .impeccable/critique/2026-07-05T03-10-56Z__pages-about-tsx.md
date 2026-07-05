---
target: "página sobre (pages/About.tsx) — foco P2 pós PR #1086"
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-05T03-10-56Z
slug: pages-about-tsx
---
Method: dual-agent (A: a1a9d4b6eea9ee411 · B: a9f8c45b07ebe5af6)
⚠️ Browser evidence unavailable this session (no Chrome/Playwright/computer-use tool exposed to either assessment) — both assessments ran as genuinely isolated sub-agents from source code + a clean deterministic scan. Findings below were cross-verified with exact file:line citations from both sides.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Button press-down exists, but no visible feedback for `openContactModal()` beyond the click itself |
| 2 | Match System / Real World | 3 | Concrete real facts (CNPJ, endereço, sócios) match trust criteria; undercut by templated phrasing ("não somos apenas X, somos Y") |
| 3 | User Control and Freedom | 3 | Hash deep-links to 4 sections with smooth scroll; no traps |
| 4 | Consistency and Standards | 2 | 2 icon libraries, `brand-*`/`anhanga-*` mixed in the *same file* (`TrustSection.tsx`), 2 badge shapes |
| 5 | Error Prevention | 3 | No forms on this page; little surface to break |
| 6 | Recognition Rather Than Recall | 3 | Section headers + badges aid scanning |
| 7 | Flexibility and Efficiency | 2 | Reduced-motion now respected (fixed); no other efficiency features expected for this page type |
| 8 | Aesthetic and Minimalist Design | 1 | Blur blobs, glass cards on dark bg, stat tile, rainbow icon cards, borders on every card — the system's own "peso físico só onde se age" principle broken repeatedly |
| 9 | Error Recovery | 3 | N/A — no error states on this static page |
| 10 | Help and Documentation | 4 | FAQ is genuine embedded trust documentation, answer-first, verifiable, feeds JSON-LD |
| **Total** | | **26/40** | **Acceptable — same total as the previous run, despite the 3 P1 fixes** |

**Why the score didn't move**: the last commit (`a81ccf0`) fixed 3 real P1s (bot contradiction, non-signature CTA, motion/no-JS gating) — confirmed still fixed. But this deeper pass surfaced that `TrustSection.tsx` alone concentrates nearly every pattern DESIGN.md explicitly bans, which the prior critique undercounted. Heuristic #8 (Aesthetic/Minimalist) dropping to 1/4 offset the gains elsewhere.

## Anti-Patterns Verdict

**LLM assessment**: Meaningfully de-slopped from before (verified: `ExpertiseSection.tsx:10` no longer contradicts the FAQ; both real CTAs now use the signature `variant="cta"` amber/shadow-hard button; `MotionConfig reducedMotion="user"` + `<noscript>` fallback are in place). But `TrustSection.tsx` — the page's single highest-stakes "prove we're trustworthy" section — still reads as a generic SaaS credentials panel: two decorative `blur-[100px]` blobs, five `bg-white/5 backdrop-blur-sm border border-white/10` glass tiles used as isolated cards on a dark background (DESIGN.md forbids this explicitly: *"Em contexto dark, não usar cards isolados"*), and a `4.9/5 + 100%` stat tile that is structurally identical to the banned hero-metric template even though it isn't on a literal gradient.

**Deterministic scan**: `detect.mjs --json pages/About.tsx components/about/` → exit 0, zero findings. As before, the generic ruleset (gradient text, side-stripe borders, eyebrows, numbered scaffolding) doesn't check this project's own DESIGN.md rules. Manual review (Assessment B) found, with exact file:line evidence:
- **Card borders on every card-like container** — `ExpertiseSection.tsx:46`, `ConsultoresSection.tsx:34`, `TrustFaqSection.tsx:36`, `HistoriaSection.tsx:30`, `TrustSection.tsx:63/69/75/81/87` (×5, border-only, no shadow at all), `CtaSection.tsx:17` — directly against *"Border: Nenhuma... nunca border."*
- **Four different corner radii** in the same page composition: `rounded-2xl`, `rounded-3xl`, `rounded-[2.5rem]`, `rounded-[3rem]` — none of the card containers actually use the documented `rounded-2xl` standard.
- **Legacy `brand-*` tokens** (explicitly commented `LEGADO — não usar em código novo` in `tailwind.config.mjs`) still used 14+ times, concentrated in `TrustSection.tsx`, which mixes `brand-*` and `anhanga-*` *in the same file* for the same visual role — a half-migrated component, not a stale leftover.
- **Off-palette colors**: `bg-orange-100`/`text-orange-600`, `bg-emerald-100`/`text-emerald-600` in `ExpertiseSection.tsx:11,23` — neither color exists anywhere in the documented palette.
- **`tracking-tighter` on 4 uppercase labels** in `TrustSection.tsx:65,71,77,83`, directly contradicting the Label token's `0.1em` spec — and inconsistent within the same file, since lines 90/95 correctly use `tracking-widest`.

**Visual overlays**: Not available — no browser/screenshot/JS-execution tool was exposed to either assessment this session. Nothing here is a live-render claim.

## Overall Impression

The three P1s from the last run are genuinely fixed — that work held up under a fresh, independent re-check. But this pass went one section deeper and found that `TrustSection.tsx` — precisely the section whose job is proving the agency is trustworthy and not a cold, templated operation — is the most template-coded part of the entire page. It also surfaced something the prior run missed entirely: the "Corporativo/eventos" segment that PRODUCT.md names as one of exactly two user segments has zero presence anywhere on `/sobre`. The P2 cluster (borders, radii, token drift, off-palette color, touch targets, dual icon libraries) is real and adds up, but it's `TrustSection.tsx`'s concentration of banned patterns that should be fixed first — it's the one place where "looks AI-generated" and "undermines the page's actual job" are the same finding.

## What's Working

1. **`TrustFaqSection` + shared `TRUST_FAQ_ITEMS`** (`About.tsx:30-56`) — answer-first, single source of truth feeding both the visible FAQ and `FAQPageSchema` JSON-LD. Concrete, checkable claims (CNPJ, endereço, sócios nomeados) instead of generic trust badges — genuinely strong GEO + human-trust writing at once.
2. **Named `Person` entities in `ConsultoresSection`** — real consultants, bios, socials, directly operationalizing "acolhedora e pessoal" and countering the "luxo frio impessoal" anti-reference.
3. **Real edge-case care**: hash deep-linking with a settle timer before `scrollIntoView` (`About.tsx:64-77`), and a deliberate `<noscript>` CSS override for no-JS (`About.tsx:81-90`) — the kind of correctness work a templated page usually skips.

## Priority Issues

**[P1] `TrustSection.tsx` concentrates nearly every pattern DESIGN.md explicitly bans, in the page's highest-stakes section.**
Why it matters: this is the section whose entire job is proving the agency isn't a cold, generic operation — and it's currently the most SaaS-template-coded part of the page (2 decorative blur blobs, 5 isolated glass cards on a dark background, a hero-metric stat tile, mixed legacy/current color tokens in the same file, `tracking-tighter` labels against spec, and pure white text where the "Regra do Branco Rebaixado" requires `white/90`).
Fix: remove the two blur blobs (lines 9-10); replace the 5 glass-panel tiles with the documented "seção com fundo próprio" pattern instead of isolated dark-context cards; fold the 4.9/5 + 100% stat pair into running text or the bulleted list rather than a boxed tile; migrate every `brand-*` class in this file to `anhanga-*`; fix the 4 `tracking-tighter` labels to `tracking-[0.1em]`; change `text-white` to `text-white/90`.
Suggested command: `/impeccable distill` then `/impeccable colorize`

**[P1] The "Corporativo/eventos" segment — one of PRODUCT.md's exactly two named user segments — has zero presence on `/sobre`.**
Why it matters: every section (Historia, Expertise, Trust's credentials, Consultores, FAQ) speaks only to the leisure segment (Beto Carrero, Hopi Hari, NCL). A corporate/events decision-maker vetting the agency before a group trip or incentive event finds no relevant credential, no case study, and no signposted path to `/corporativo` — the page silently fails half its own named audience.
Fix: add one FAQ item or Trust bullet addressing group/corporate capability, or route that persona toward `/corporativo` from the CTA copy.
Suggested command: `/impeccable clarify`

**[P2] Card border rule and corner-radius inconsistency, stacked across every section.**
Every card-like container on the page has a border (`ExpertiseSection.tsx:46`, `ConsultoresSection.tsx:34`, `TrustFaqSection.tsx:36`, `HistoriaSection.tsx:30`, `TrustSection.tsx` ×5, `CtaSection.tsx:17`) despite DESIGN.md's explicit "Border: Nenhuma." Radii fragment into four different values (`rounded-2xl`/`rounded-3xl`/`rounded-[2.5rem]`/`rounded-[3rem]`) with none using the documented 16px standard.
Why it matters: individually small, but stacked across 6 components it's the clearest "assembled in separate passes, never swept for consistency" tell — and it directly contradicts the system's own flagship card rule.
Fix: drop borders everywhere, rely on `shadow-float` + tonalized backgrounds per spec; standardize all card radii to `rounded-2xl`.
Suggested command: `/impeccable polish`

**[P2] Token and palette drift: legacy `brand-*` classes, off-palette colors, dual icon libraries.**
14+ legacy `brand-*` occurrences remain (explicitly marked "LEGADO — não usar em código novo" in `tailwind.config.mjs`), concentrated in a half-migrated `TrustSection.tsx` that mixes `brand-*` and `anhanga-*` for the identical bullet-dot role in the same list. `ExpertiseSection.tsx` uses off-palette `orange-100`/`emerald-100` tints that exist nowhere in the documented palette. Two icon libraries (`lucide-react` + `@phosphor-icons/react`) load simultaneously for one page.
Why it matters: this is the exact kind of unmanaged sprawl `tests/tailwind-brand-namespace-guard.test.ts` exists to prevent elsewhere in the codebase — `/sobre` appears to have been built or edited before/outside that migration.
Fix: migrate all `brand-*` → `anhanga-*` tokens in `components/about/`; replace `orange-100`/`emerald-100` with palette-consistent tints; standardize on one icon library (likely `lucide-react`, used in 5 of 7 files).
Suggested command: `/impeccable polish`

**[P2] Accessibility and motion details: sub-44px touch targets, no FAQ progressive disclosure, a stagger-delay bug.**
`ConsultoresSection.tsx:62,73`'s Instagram/LinkedIn links are `size-9` (36px), under the 44×44px minimum for real interactive elements. `TrustFaqSection.tsx:32-47` renders all 5 FAQ answers fully expanded with no accordion — directly against PRODUCT.md's own "baixa carga cognitiva" note for the mobile-at-night persona. Separately: `CtaSection.tsx` is the only animated section missing the `custom={i}` prop every sibling section passes to `fadeUp`'s variants (`aboutMotion.ts:10` computes `delay: i * 0.1`), meaning `i` is `undefined` there and the delay resolves to `NaN` — a real, if minor, motion bug.
Why it matters: the touch targets and FAQ density work directly against the stated mobile-first, low-cognitive-load design principle; the NaN delay is a small correctness bug in an otherwise-consistent animation API.
Fix: bump social icons to `size-11`; convert the FAQ to an accordion; pass `custom={i}` to `CtaSection`'s motion wrapper.
Suggested command: `/impeccable harden`

## Persona Red Flags

**Jordan (confused first-timer, leisure family, mobile, at night, deciding "em quem confiar?")**: The Hero's opening line breaks the brand's mandated second-person voice ("Na Anhangá Viagens, acreditamos que..." instead of addressing "você" directly) at the exact moment Jordan most needs to feel personally addressed. Scrolling further, she hits `TrustSection`'s dark glass-panel "dashboard" with a 4.9/5 stat tile — visually closer to a SaaS pricing page than "conversa, não transação." If she wants one specific FAQ answer, she must scroll past 4 other fully-expanded paragraphs first.

**Corporativo buyer (PRODUCT.md's own named second segment — empresas/grupos, eventos, incentivo)**: Finds only leisure-tourism credentials (Cadastur, Beto Carrero, Hopi Hari, NCL) in Trust; the FAQ's "how service works" answer is framed entirely around one traveler's personal itinerary; both CTAs ("Solicitar Orçamento," "Começar Planejamento") read as individual-traveler asks with no link toward `/corporativo`. This segment is invisible on its own agency's About page.

**Riley (stress-tester, screen reader/keyboard, inspects edge cases)**: 36px social-link touch targets fail the 44px floor immediately. Decorative icons (Sparkles, ShieldCheck, Heart, Award, Anchor, Ship, Coffee) carry no `aria-hidden="true"` across any file, so a screen reader announces redundant icon noise around every heading. `CtaSection`'s missing `custom={i}` prop produces a `NaN` animation delay — the one broken instance in an otherwise-consistent motion contract.

## Minor Observations

- H1 (`HeroSection.tsx:23`) uses `leading-tight` (1.25) with no tracking utility — DESIGN.md's Display token specifies `line-height 0.9`, `letter-spacing -0.02em`; neither is hit.
- All `<h2>` section headings use `font-black` (900) at fixed Tailwind sizes, not the documented Headline token (weight 800, fluid `clamp(1.5rem,3vw,2.5rem)`).
- `TrustSection.tsx` is the only section with no scroll-reveal wrapper at all (every sibling uses `initial="hidden" whileInView="visible"`) — breaks the page's otherwise-consistent animation rhythm right at its highest-stakes section.
- `opacity-50` on small labels sitting on `bg-white/5 backdrop-blur-sm` panels in `TrustSection.tsx` is worth a real contrast check once browser tooling is available — at 14px bold this sits right at the WCAG large-text threshold.
- The same four credential facts (Cadastur, Beto Carrero, Hopi Hari, NCL) are repeated near-verbatim in three places (bullets → card grid → FAQ) — good for GEO extraction, redundant for a human reading start to finish.

## Questions to Consider

1. If "Border: Nenhuma" is the design system's single loudest card rule, and every card on this page has one, was that rule ever actually enforced anywhere — or is `/sobre` the first place someone looked closely enough to notice?
2. `TrustSection` is the only section not wrapped in scroll-reveal, and the only file mixing `brand-*` and `anhanga-*` tokens for the same role — was it built in a different pass than the rest of the page?
3. PRODUCT.md names two user segments with equal weight. If a corporate/events prospect can read the entire About page and find zero evidence the agency serves that segment, is `/sobre` actually the company's About page, or quietly just the leisure family's About page?
