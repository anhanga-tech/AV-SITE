---
target: página sobre (pages/About.tsx)
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-07-05T01-56-44Z
slug: pages-about-tsx
---
Method: dual-agent (A: a63053ce753f4e91e · B: a5a3cb12cf2e25ff2)
⚠️ Browser evidence unavailable this session (no Playwright/computer-use tool exposed to either assessment, confirmed via ToolSearch) — both assessments ran as genuinely isolated sub-agents (the hard invariant that matters most), but judged from source code + a clean deterministic scan rather than a live render. Screenshots/console overlay could not be produced. Findings below were spot-verified against the actual source after synthesis.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Static page, nothing async to signal; non-issue |
| 2 | Match System / Real World | 2 | "Nada de bots" directly contradicts the FAQ's own "primeiro contato pode ser pelo chat com IA" |
| 3 | User Control and Freedom | 3 | No traps; external links use rel=noopener |
| 4 | Consistency and Standards | 1 | `brand-*`/`anhanga-*` mixed in one list, borders on every card despite "Nenhuma" rule, 4 different radii, 2 icon libraries |
| 5 | Error Prevention | 3 | No forms on this page; little surface to break |
| 6 | Recognition Rather Than Recall | 3 | Credentials restated 3x — helps recall, costs density |
| 7 | Flexibility and Efficiency | 2 | Anchor IDs exist (#certificacoes, #consultores, #perguntas-frequentes) but no in-page nav uses them |
| 8 | Aesthetic and Minimalist Design | 2 | Decorative blur blobs, hero-metric stat tile, inconsistent radii, banned patterns stacked |
| 9 | Error Recovery | 3 | N/A — no error states on this page |
| 10 | Help and Documentation | 4 | FAQ functions as real embedded trust documentation, answer-first, verifiable |
| **Total** | | **26/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Would read as AI-generated on close inspection — not the copy (CNPJ, address, named partners are specific and real) but the chrome around it. The page trips several of its *own* project's explicit DESIGN.md bans: the hero-metric stat tile (4.9/5 + 100% in a bg-white/5 tile), decorative glassmorphism blur blobs with no functional role, uniform icon-badge-title card grids (Expertise ×3, credential grid ×4) with no variation in weight/size, and borders on every single card despite the spec explicitly saying "Border: Nenhuma... nunca border." Off-palette `orange-100`/`emerald-100` tints appear nowhere else in the documented palette. Sparkles icon repeats 3x across the page (Hero badge, Hero CTA, footer CTA) — a recognizable generic-AI-marketing tic.

**Deterministic scan**: `detect.mjs --json pages/About.tsx components/about/` → exit 0, zero findings. The detector's ruleset (gradient text, side-stripe borders, tiny-uppercase eyebrows, numbered scaffolding, generic grids) didn't fire, but it also doesn't check against *this specific* project's DESIGN.md bans (borders on cards, card-radius/token consistency, palette-token drift) — those are checked by hand against source below, all confirmed:
- `TrustSection.tsx` lines 24-52, 64-79, 94: `bg-brand-cyan` and `bg-anhanga-action` used for the identical visual role (bullet dots, icon tints, stat text) inside the same component — token drift, not a false positive.
- `TrustSection.tsx` lines 65/71/77/83: `tracking-tighter` on uppercase labels, where DESIGN.md's Label token specifies wide tracking (`0.1em`).
- Card borders confirmed present in `ExpertiseSection.tsx`, `ConsultoresSection.tsx`, `TrustFaqSection.tsx`, `TrustSection.tsx`, `CtaSection.tsx` — every card on the page, against the explicit "no border" rule.
- Corner radii confirmed inconsistent: `rounded-2xl` / `rounded-3xl` / `rounded-[2.5rem]` / `rounded-[3rem]` all appear across sections vs. the documented 16px card standard.
- `ExpertiseSection.tsx` line 10: "Nada de bots ou respostas automáticas" confirmed verbatim, contradicting FAQ item 4's "O primeiro contato pode ser pelo chat com IA."

**Visual overlays**: Not available — no browser/screenshot/JS-execution tool was exposed in this session to either assessment (confirmed independently by both agents and by a parent-level ToolSearch). No visual render, contrast measurement, or console-injected overlay was produced; nothing here should be read as a live-render claim.

## Overall Impression

The bones are good — real credentials, a named human team, a genuinely well-written FAQ that does double duty as GEO-friendly structured trust content. But the visual assembly around that content reaches for the exact templated moves ("O Diário de Bordo" DESIGN.md was written specifically to reject: stat tiles, decorative blur, uniform card grids, cards with borders. The biggest opportunity isn't more content — it's making the chrome as considered as the Historia section's polaroid treatment already is, everywhere else on the page.

## What's Working

1. **HistoriaSection's photo treatment** — the tilted/torn polaroid framing (`rotate-2 hover:rotate-0`) with the floating "Paixão por Pessoas" badge is the one moment that actually earns the "Diário de Bordo" register: physical, tactile, specific. It's the model the rest of the page should follow.
2. **FAQ content quality** — answer-first, specific, independently verifiable (exact CNPJ, address, partner names). This is genuinely strong E-E-A-T/GEO writing, not filler.
3. **ConsultoresSection** puts real named consultants with bios and socials front and center, directly serving "conversa não transação" and functioning as a real trust peak.

## Priority Issues

**[P1] Self-contradicting trust claim.** ExpertiseSection.tsx line 10: *"Nada de bots ou respostas automáticas. Você fala com especialistas."* Two sections later, TrustFaqSection's own FAQ #4 recommends *"O primeiro contato pode ser pelo chat com IA no site."* On a page whose entire job is building trust — and whose content is explicitly written to be quoted by AI answer engines — a self-contradiction is the worst possible failure mode, for both a skeptical human reader and a GEO crawler citing the page.
**Why it matters**: Undermines the exact trust the page exists to build; risks an LLM citing the contradiction back as "this agency's own site disagrees with itself."
**Fix**: Rewrite ExpertiseSection's line to something honest, e.g. "O chat com IA faz a triagem inicial; quem desenha seu roteiro é sempre um humano."
**Suggested command**: `/impeccable clarify`

**[P1] The page's real CTAs never use the brand's signature button.** Both HeroSection and CtaSection buttons use `bg-brand-vibrant` (sky blue) + `shadow-xl` + `hover:scale-105`. DESIGN.md reserves amber + `shadow-hard` + the full press-down sequence specifically for "o botão de conversão máxima" — and states it should appear on the one dominant CTA per screen. Across this 7-section page, amber never appears as a CTA at all.
**Why it matters**: The page's two actual conversion moments skip the one interaction the whole system was built around (the "carimbo de passaporte" press-down), so the moments that matter most feel generic rather than signature.
**Fix**: Swap both CTAs to the `button-cta` treatment (amber bg, dark text, `shadow-hard`, rest→hover→active press sequence).
**Suggested command**: `/impeccable polish`

**[P1] Reveal animations gate content invisible, with no reduced-motion path.** Every section (`ExpertiseSection.tsx`, `HistoriaSection.tsx`, etc.) uses `aboutMotion.ts`'s `fadeUp` with `initial="hidden"` (opacity 0) + `whileInView="visible"` — and zero `prefers-reduced-motion` handling, while `components/Hero.tsx` and `components/Testimonials.tsx` elsewhere in this same codebase already implement it. This is both an a11y regression against DESIGN.md's REQUIRED rule and a robustness risk: if `whileInView` never fires (a headless render, a slow/failed hydration), the credential and FAQ content — the exact content this page's GEO investment depends on — ships at opacity 0.
**Why it matters**: The trust content this page was just re-built to carry (AggregateRating, FAQPage, Person schema) can end up invisible on the one path (crawlers, degraded clients) where visibility matters most.
**Fix**: Wrap `/sobre`'s sections in `MotionConfig reducedMotion="user"` (the pattern already used in `CorporativoLanding.tsx`), and treat `initial="hidden"` as a decorative enhancement over already-visible markup, not a gate.
**Suggested command**: `/impeccable harden`

**[P2] Stacked templated-assembly patterns the project's own DESIGN.md explicitly bans.** In one page: a hero-metric stat tile (4.9/5 + 100%), decorative `blur-[100px]` glow blobs with no functional role, uniform icon-badge-title cards (Expertise ×3, credential grid ×4) with no variation in size/weight, borders on every card despite "Border: Nenhuma," and off-palette `orange-100`/`emerald-100` tints absent from the documented palette.
**Why it matters**: Each of these is individually small; stacked, they're what makes the page read as templated despite genuinely good underlying content.
**Fix**: Vary card weight/size (one dominant credential + a supporting list, not 4 equal tiles), drop or reframe the stat tile as prose near the schema data, remove the blur blobs or give them a stated function, drop card borders per spec, replace off-palette colors with `anhanga-*` tokens.
**Suggested command**: `/impeccable distill` then `/impeccable colorize`

**[P2] Token/consistency drift and small a11y gaps.** `TrustSection.tsx` mixes `bg-brand-cyan` and `bg-anhanga-action` for the identical visual role within the same bullet list (legacy token not fully migrated); labels use `tracking-tighter` where the Label spec calls for `0.1em` wide tracking; `ConsultoresSection`'s social icons are `size-9` (36px), under the 44×44px minimum touch target; two icon libraries (`lucide-react` + `@phosphor-icons/react`) are mixed on one page.
**Why it matters**: Individually minor, collectively these are the "stitched together in passes, never given a final consistency sweep" tell.
**Fix**: Migrate the page fully to `anhanga-*` tokens, fix label tracking, bump social icons to `size-11`, standardize on one icon library.
**Suggested command**: `/impeccable polish`

## Persona Red Flags

**Jordan (confused first-timer, deciding whether to trust this agency, mobile, at night)**: Reads "Nada de bots" in Expertise, then two screens later reads the FAQ recommending the AI chat as first contact — catching an agency contradict itself on its own About page is the worst thing that can happen mid-evaluation. The FAQ's 5 answers render fully expanded with no accordion, so she can't scan just the question she cares about when tired from scrolling at night (per PRODUCT.md's own stated context).

**Casey (distracted, thumb-only, interrupted mid-scroll)**: ConsultoresSection's Instagram/LinkedIn tap targets are 36px with only 12px between them — a real mis-tap risk for a one-handed thumb user. If she's interrupted and returns later, there's no anchor/sticky nav to jump back to a section despite the IDs (`#certificacoes`, `#consultores`, `#perguntas-frequentes`) already existing in code — she has to re-scroll from the top.

**Project-specific — "Corporativo" buyer (PRODUCT.md's own named second segment: empresas/grupos, eventos, incentivo)**: This page speaks 100% leisure register — Sparkles icons, "colecionar histórias," polaroid photos, "Pronto para sua próxima história?" There's no case study, group-booking credential, or B2B trust signal anywhere. A corporate decision-maker vetting this agency before an incentive trip finds nothing written for them here.

## Minor Observations

- H2 headings use `font-black` (900) where DESIGN.md's Headline token specifies weight 800.
- The same four credential facts (Cadastur, Beto Carrero, Hopi Hari, NCL) are stated near-verbatim in three places (bullets → card grid → FAQ) — good for GEO extraction, redundant for a human reading start to finish.
- The 4.9/5 stat duplicates the `AggregateRating` JSON-LD figure as a bare number tile rather than integrating it into surrounding prose.
- No in-page anchor nav despite three section IDs already existing in the DOM.

## Questions to Consider

1. If the four credential facts are already machine-readable via FAQPageSchema/OrganizationSchema for AI engines to cite, does the human page need to repeat them three times — or is that repetition serving GEO at the direct expense of a tired mobile reader's patience?
2. The page says "Nada de bots" and two screens later recommends AI chat as a valid first contact. Which sentence do you actually want an LLM — or a skeptical visitor — to quote back as "the truth" about this agency?
3. The brand's signature amber/hard-shadow/press-down button is unused on both of this page's real conversion CTAs. Was that deliberate, or did `/sobre` just never get wired into the actual button component library?
