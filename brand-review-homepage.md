# Brand Review — Anhangá Viagens Homepage
**URL:** https://www.anhanga.tur.br
**Reviewed:** 2026-03-04
**Scope:** General review — clarity, consistency, professionalism + legal/compliance flags

---

## Summary

**Overall quality:** Strong. The Anhangá homepage has a distinct, well-executed brand voice — warm, casual, playfully Brazilian, and consistently delivered across all sections. The scrapbook/sticker visual language matches the copy tone perfectly, and the structural flow (Hero → Highlights → How It Works → Destinations → Testimonials → CTA → FAQ → Footer) is logical and conversion-oriented.

**Biggest strengths:** The brand voice is unusually coherent for a small agency site. The copywriting is creative and memorable, and the micro-copy (section badges, card descriptions, CTAs) adds personality without sacrificing clarity. Legal credentials (Cadastur, CNPJ) are properly disclosed in the footer.

**Most important improvements:** One clear grammatical error in a customer testimonial undermines credibility. An unsubstantiated "best prices" claim creates legal exposure. Price figures on destination cards lack the "a partir de" qualifier that the FAQ text includes, creating a pricing expectation gap.

---

## Detailed Findings

| # | Issue | Location | Severity | Suggestion |
|---|-------|----------|----------|------------|
| 1 | **Typo: "Viajem"** — incorrect Portuguese form (the noun is *viagem*; *viajem* is a conjugated verb meaning "let them travel") | Testimonials — William S. quote | **High** | Change to "Viagem mais tranquila da vida." |
| 2 | **Unsubstantiated superlative: "Melhores Preços"** — claims market superiority without evidence | Hero quick-feature badge | **High** | Replace with "Ótimos Preços" or "Preços Competitivos" |
| 3 | **Destination card prices lack "a partir de" (from) qualifier** — cards show "R$ 3.800" as a flat figure; the FAQ correctly states roteiros start at R$ 3.800, but card UI implies a fixed price | Destinations section — price stickers on cards | **High** | Prepend "A partir de" to all price tags, e.g. "A partir de R$ 3.800" |
| 4 | **Service promise "Resposta em até 2h" has no caveat** — no mention of business hours or business days; creates consumer law expectation | Hero — micro-text below search form | **Medium** | Add "(dias úteis)" — "Sem compromisso • Resposta em até 2h (dias úteis)" |
| 5 | **"Verificado" badge on testimonials lacks explanation** — the badge implies an external verification source that isn't identified; may be perceived as misleading under CONAR guidelines | Testimonials — avatar badge | **Medium** | Change to "Cliente Verificado" with a tooltip/footnote explaining source (e.g. "Depoimento verificado pela equipe Anhangá") or link to a public review platform |
| 6 | **Opaque section title "Mural do Amor"** — new visitors may not immediately recognise this as a reviews/testimonials section | Testimonials — section headline | **Medium** | Add a subtitle below: "Depoimentos reais de quem viajou com a gente" |
| 7 | **"Anhangá Airlines" creative metaphor may confuse first-time visitors** — could imply affiliation with an airline company | CTA (ticket) section — header strip | **Low** | Consider adding a small visual indicator that it's a metaphorical design (e.g. "✈ Estilo boarding pass") or keeping as-is if user testing shows no confusion |
| 8 | **Map quote lacks attribution** — "O mundo é um livro e quem não viaja lê apenas uma página" is widely attributed to Saint Augustine but shown without credit | Destinations — map sticky note | **Low** | Add attribution: "— Santo Agostinho" below the quote |
| 9 | **Image alt text too vague** — the highlight section image uses `alt="Praia"` — poor for accessibility and SEO | Highlights — left column image | **Low** | Use descriptive alt text: "Praia paradisíaca com areia branca e água turquesa — roteiro exclusivo Anhangá Viagens" |
| 10 | **"Conteúdo editado por Anhangá Travel Experts"** — introduces a sub-brand name not used elsewhere on the site | Footer — bottom legal strip | **Low** | Change to "Conteúdo da equipe Anhangá Viagens" for brand consistency |

---

## Revised Sections (Top Issues)

### Issue 1 — Typo in testimonial (High)

**Before:**
> "Viajem mais tranquila da vida. Trens, hotéis, tudo organizado perfeitamente."
> — William S., Alemanha

**After:**
> "Viagem mais tranquila da vida. Trens, hotéis, tudo organizado perfeitamente."
> — William S., Alemanha

*File:* `components/Testimonials.tsx` — Line 30, `text:` field for William S.

---

### Issue 2 — Unsubstantiated superlative (High)

**Before:**
```
{ text: "Melhores Preços", icon: <Sparkles ... /> }
```

**After:**
```
{ text: "Ótimos Preços", icon: <Sparkles ... /> }
```

*File:* `components/Hero.tsx` — `QUICK_FEATURES` array, line ~176. Alternatively "Preços Competitivos" if the brand prefers a stronger positioning.

---

### Issue 3 — Destination card prices without qualifier (High)

**Before (destination card price sticker):**
```
R$ 3.800
```

**After:**
```
A partir de R$ 3.800
```

*File:* `components/Destinations.tsx` — The `price` field in each `DESTINATION` object and/or the price badge rendering at line ~601. Either prepend "A partir de " to each `price` string in the data, or modify the rendering template to always include the prefix.

---

### Issue 4 — Service promise without caveat (Medium)

**Before:**
> "Sem compromisso • Resposta em até 2h"

**After:**
> "Sem compromisso • Resposta em até 2h (dias úteis)"

*File:* `components/Hero.tsx` — line ~977.

---

### Issue 5 — "Verificado" badge ambiguity (Medium)

**Before:**
```jsx
<div className="absolute -bottom-2 -right-2 bg-yellow-300 ...">
  Verificado
</div>
```

**After:**
```jsx
<div className="absolute -bottom-2 -right-2 bg-yellow-300 ..." title="Depoimento verificado pela equipe Anhangá Viagens">
  ✓ Cliente Real
</div>
```

*File:* `components/Testimonials.tsx` — line ~113. Changing the label from "Verificado" to "✓ Cliente Real" is more accurate and less susceptible to CONAR challenge. Adding a `title` attribute provides transparency on hover.

---

## Legal / Compliance Flags

| Flag | Location | Risk | Recommended Action |
|------|----------|------|--------------------|
| **"Melhores Preços"** — unsubstantiated price superiority claim | Hero quick-feature | Medium — CDC Art. 37 prohibits misleading advertising | Replace with qualified claim (see Issue 2 above) |
| **"Resposta em até 2h"** — service delivery promise with no business hours caveat | Hero micro-text | Low–Medium — creates consumer expectation under CDC Art. 30 | Add "dias úteis" qualifier |
| **"Conseguimos viagens em 48 horas em casos urgentes"** — specific turnaround promise | FAQ — "Quanto tempo antes..." | Low — vague but creates expectation | Add qualifier: "sujeito a disponibilidade" |
| **Destination prices without "a partir de"** — prices could be read as fixed, not starting prices | Destinations — all price tags | Medium — consumer mismatch expectation | Prefix all with "A partir de" (see Issue 3) |
| **"Verificado" badge without explanation** — implies an external third-party verification | Testimonials | Low — CONAR guideline on testimonial authenticity | Clarify source or change label (see Issue 5) |
| **"First Class Experience" label** — in English inside a Portuguese UI, in the context of "Anhangá Airlines" | CTA section | Very low — no legal risk but brand clarity concern | Consider translating for audience consistency |

---

## Strengths Worth Preserving

- The four-step process section ("Como a mágica acontece?") is clear, friendly, and perfectly on-brand — do not sanitize the informal language.
- The FAQ includes proper Cadastur registration disclosure, which is legally required and well-placed.
- "Sem surpresas!" in the pricing FAQ is a strong trust signal — keep it.
- The CNPJ and Cadastur are properly visible in the footer.
- The AI chat positioning ("Nossa IA Especialista") frames the chatbot as a tool rather than the primary agent — smart for trust-building.

---

## Next Steps

Would you like me to:

1. **Apply the high-severity fixes directly** in the source files (Testimonials typo, "Melhores Preços", destination price tags)?
2. **Fix all issues at once** (all 10 items above)?
3. **Review another page** (e.g. the Orlando or Lollapalooza landing pages) against the same criteria?
4. **Document the Anhangá brand voice** formally so future content can be checked against it?
