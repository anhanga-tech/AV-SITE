# Giant Component Decomposition (Issue #481)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose 7 components with 300+ lines into smaller, focused sub-components following the single-responsibility principle.

**Architecture:** Extract logical sections that have their own props/state and don't read sibling state into co-located sub-component files. Keep state ownership in the parent; pass data down via props. No new packages or abstractions — just structural splits.

**Tech Stack:** React 19, TypeScript, Tailwind CSS

---

## Scope Check

This plan covers all 7 components from the issue, ordered by priority. Each task is independent — decomposing one component does not affect another. They share a commit-per-component cadence.

## Test Coverage

**This refactoring does not change behavior** — it is a structural-only decomposition. No new features, no removed features, no changed props, no changed rendering. Per the testing standard, no new tests are required, but existing E2E coverage must continue to pass.

| Component | Existing E2E Coverage | Verification |
|-----------|----------------------|--------------|
| NPS.tsx | None | Manual: `pnpm dev` → `/nps?firstname=Test&email=test@test.com` |
| CallToAction.tsx | `tests/e2e/contact-form.spec.ts` | Run: `npx playwright test tests/e2e/contact-form.spec.ts` |
| BrazilPromotionDayLanding.tsx | `tests/e2e/brazil-promotion-day.spec.ts` | Run: `npx playwright test tests/e2e/brazil-promotion-day.spec.ts` |
| Privacy.tsx | None (covered by `smoke.spec.ts` navigation) | Manual: `pnpm dev` → `/politica-privacidade` |
| Solution.tsx (Beto Carrero) | None (landing partially in `smoke.spec.ts`) | Manual: `pnpm dev` → `/beto-carrero` |
| VenueMap.tsx (Lollapalooza) | `tests/e2e/lollapalooza-waitlist.spec.ts` (partial) | Run + Manual: `/lollapalooza` map interaction |
| OrlandoApp.tsx | `tests/e2e/orlando_seo.spec.ts` (SEO only) | Run + Manual: `/orlando` full page |

**All chunks:** Run `pnpm typecheck` after each decomposition. Run `pnpm build` at the end to confirm no production regressions.

## File Structure Overview

### Task 1: NPS.tsx (445 → ~120 + sub-components)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `pages/nps/NpsScoreGrid.tsx` | Score buttons 0–10 with hover state |
| Create | `pages/nps/NpsTextarea.tsx` | Textarea with focus ring + char counter (move existing) |
| Create | `pages/nps/NpsThankPromoter.tsx` | Thank-you card with countdown + Google CTA |
| Create | `pages/nps/NpsThankOther.tsx` | Thank-you card with WhatsApp CTA |
| Create | `pages/nps/nps-styles.ts` | `PAGE_STYLES` string constant + `SCORE_LABELS` |
| Modify | `pages/NPS.tsx` | Orchestrator: state, effects, layout shell, imports sub-components |

### Task 2: CallToAction.tsx (326 → ~90 + sub-components)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/cta/CtaContactForm.tsx` | Form with 4 inputs + opt-in + submit buttons |
| Create | `components/cta/BoardingPassStub.tsx` | Right-side ticket stub (fully static) |
| Create | `components/cta/TicketBarcode.tsx` | Barcode SVG lines + ticket number |
| Modify | `components/CallToAction.tsx` | Orchestrator: state, ticket container layout, imports |

### Task 3: BrazilPromotionDayLanding.tsx (715 → ~100 + sub-components)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `pages/landings/brazil-promotion-day/BpdHero.tsx` | Hero section with gradient, animations, pills |
| Create | `pages/landings/brazil-promotion-day/BpdPillars.tsx` | 3-pillar card grid |
| Create | `pages/landings/brazil-promotion-day/BpdWhatsAppBand.tsx` | Dark CTA band |
| Create | `pages/landings/brazil-promotion-day/BpdContactForm.tsx` | Contact form + success state |
| Create | `pages/landings/brazil-promotion-day/BpdNav.tsx` | Fixed navigation header |
| Create | `pages/landings/brazil-promotion-day/BpdFooter.tsx` | Footer with company info |
| Create | `pages/landings/brazil-promotion-day/constants.ts` | PILLARS, SOCIAL_LINKS, WHATSAPP_MESSAGE, fadeUp |
| Modify | `pages/landings/BrazilPromotionDayLanding.tsx` | Orchestrator: state, GTM push, SEO, layout composition |

### Task 4: Privacy.tsx (384 → ~50 + data)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `pages/privacy/PrivacySection.tsx` | Reusable section renderer (title + content) |
| Create | `pages/privacy/privacy-sections.ts` | Array of `{ id, title, content }` objects |
| Modify | `pages/Privacy.tsx` | Layout shell + map over sections |

### Task 5: Solution.tsx — Beto Carrero (381 → ~100 + sub-components)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/landings/beto-carrero/solution/TicketCard.tsx` | Single ticket card |
| Create | `components/landings/beto-carrero/solution/PhoneMockup.tsx` | Phone + app screenshot |
| Create | `components/landings/beto-carrero/solution/StickerButton.tsx` | Floating sticker CTA |
| Create | `components/landings/beto-carrero/solution/SolutionModal.tsx` | WhatsApp modal overlay |
| Modify | `components/landings/beto-carrero/Solution.tsx` | Orchestrator: modal state, layout, imports |

### Task 6: VenueMap.tsx — Lollapalooza (396 → ~120 + sub-components)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/landings/lollapalooza/venue-map/PoiListItem.tsx` | Single POI list entry |
| Create | `components/landings/lollapalooza/venue-map/poi-data.ts` | POI array + `getPoiStyle` helper |
| Modify | `components/landings/lollapalooza/VenueMap.tsx` | Map init, scroll sync, click handler, layout |

### Task 7: OrlandoApp.tsx (838 → ~150 + sub-components)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/landings/orlando/OrlandoHero.tsx` | Hero with grain overlay, navigation, headline |
| Create | `components/landings/orlando/OrlandoFeatures.tsx` | Features grid section |
| Create | `components/landings/orlando/OrlandoParks.tsx` | Parks gallery (Disney/Universal/Other groups) |
| Create | `components/landings/orlando/OrlandoItinerary.tsx` | Sample itinerary section |
| Create | `components/landings/orlando/OrlandoFooter.tsx` | Footer with runtime metadata |
| Create | `components/landings/orlando/orlando-constants.tsx` | SITE_URL + shared Card/Badge/WashiTape components |
| Modify | `components/landings/orlando/OrlandoApp.tsx` | Orchestrator: parallax effect, layout composition |

---

## Chunk 1: NPS.tsx Decomposition

### Task 1: Decompose NPS.tsx

**Files:**
- Create: `pages/nps/nps-styles.ts`
- Create: `pages/nps/NpsScoreGrid.tsx`
- Create: `pages/nps/NpsTextarea.tsx`
- Create: `pages/nps/NpsThankPromoter.tsx`
- Create: `pages/nps/NpsThankOther.tsx`
- Modify: `pages/NPS.tsx`
- Test: `pnpm typecheck`

#### Step 1.1: Extract constants

- [ ] **Create `pages/nps/nps-styles.ts`**

```ts
export const GOOGLE_REVIEW_URL = 'https://g.page/r/Ca7sLORX6EQ7EBM/review';
export const WHATSAPP_URL = 'https://wa.me/551152833309';

export const SCORE_LABELS: Record<number, string> = {
  0: 'Nada provável',
  5: 'Neutro',
  10: 'Extremamente provável',
};

export const PAGE_STYLES = `
  .nps-score-btn:focus-visible {
    outline: 2px solid #0ea5e9;
    outline-offset: 2px;
  }
  .nps-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 2rem;
    font-size: 0.875rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: 0.5rem;
    text-decoration: none;
    transform: translate(-1px, -1px);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .nps-cta:hover { transform: translate(0, 0); }
  .nps-cta:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }
  .nps-cta-yellow {
    background: #FFD600; color: #0f172a;
    border: 2px solid #0f172a; box-shadow: 4px 4px 0 #0f172a;
  }
  .nps-cta-yellow:hover { box-shadow: 2px 2px 0 #0f172a; }
  .nps-cta-whatsapp {
    background: #25D366; color: #ffffff;
    border: 2px solid #0f172a; box-shadow: 4px 4px 0 #0f172a;
  }
  .nps-cta-whatsapp:hover { box-shadow: 2px 2px 0 #0f172a; }
  .nps-submit:not(:disabled):active {
    transform: translate(0, 0) !important;
    box-shadow: 2px 2px 0 #003B8E !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .nps-score-btn, .nps-cta, .nps-submit { transition: none !important; }
    .nps-thank-card { animation: none !important; opacity: 1 !important; transform: none !important; }
  }
`;
```

#### Step 1.2: Extract NpsTextarea

- [ ] **Create `pages/nps/NpsTextarea.tsx`**

Move the existing `NpsTextarea` function (lines 388–445 of `pages/NPS.tsx`) into its own file with the same interface and implementation. Add the `useState` import.

```tsx
import { useState } from 'react';

interface NpsTextareaProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
  required?: boolean;
  maxLength?: number;
}

export function NpsTextarea({ id, value, onChange, placeholder, rows, required, maxLength }: NpsTextareaProps) {
  // ... exact same implementation from lines 399–444
}
```

#### Step 1.3: Extract NpsScoreGrid

- [ ] **Create `pages/nps/NpsScoreGrid.tsx`**

Extract the score fieldset (lines 163–210) into a standalone component.

```tsx
import { useState } from 'react';
import { SCORE_LABELS } from './nps-styles';

interface NpsScoreGridProps {
  score: number | null;
  onScoreChange: (score: number) => void;
}

export function NpsScoreGrid({ score, onScoreChange }: NpsScoreGridProps) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  return (
    <fieldset className="mb-8">
      {/* ... legend + grid from lines 163–210, using props instead of parent state */}
    </fieldset>
  );
}
```

Key changes:
- `hoveredScore` state moves **into** this component (it's only used here)
- `score` and `setScore` become props `score` and `onScoreChange`

#### Step 1.4: Extract NpsThankPromoter

- [ ] **Create `pages/nps/NpsThankPromoter.tsx`**

Extract lines 286–331 into a component.

```tsx
import { GOOGLE_REVIEW_URL } from './nps-styles';

interface NpsThankPromoterProps {
  firstname: string;
  countdown: number;
}

export function NpsThankPromoter({ firstname, countdown }: NpsThankPromoterProps) {
  return (
    <div className="nps-thank-card animate-fade-in-up text-center py-8">
      {/* ... exact JSX from lines 288–331 using props */}
    </div>
  );
}
```

#### Step 1.5: Extract NpsThankOther

- [ ] **Create `pages/nps/NpsThankOther.tsx`**

Extract lines 334–374 into a component.

```tsx
import { WHATSAPP_URL } from './nps-styles';

interface NpsThankOtherProps {
  // no props needed — fully static
}

export function NpsThankOther() {
  return (
    <div className="nps-thank-card animate-fade-in-up text-center py-8">
      {/* ... exact JSX from lines 335–374 */}
    </div>
  );
}
```

#### Step 1.6: Refactor NPS.tsx to use sub-components

- [ ] **Modify `pages/NPS.tsx`**

Replace inline sections with imported sub-components. Remove moved code. The parent keeps:
- URL params (`firstname`, `email`)
- Form state (`score`, `reason`, `highlight`, `pageState`, `submitting`, `errorMessage`, `countdown`)
- Effects (title, countdown redirect)
- `handleSubmit`
- Layout shell (header, accent bar, main, footer)

```tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';
import { PAGE_STYLES } from './nps/nps-styles';
import { NpsScoreGrid } from './nps/NpsScoreGrid';
import { NpsTextarea } from './nps/NpsTextarea';
import { NpsThankPromoter } from './nps/NpsThankPromoter';
import { NpsThankOther } from './nps/NpsThankOther';

// ... parent keeps state, effects, handleSubmit, layout
```

Expected result: `pages/NPS.tsx` drops from 445 → ~120 lines.

#### Step 1.7: Verify

- [ ] **Run `pnpm typecheck`**

Expected: no type errors.

- [ ] **Run `pnpm dev` and test NPS page manually at `/nps?firstname=Test&email=test@test.com`**

Verify: score grid, textareas, form submit flow, thank-you pages render identically.

#### Step 1.8: Commit

- [ ] **Commit**

```bash
git add pages/nps/ pages/NPS.tsx
git commit -m "refactor(NPS): decompose into focused sub-components (#481)"
```

---

## Chunk 2: CallToAction.tsx Decomposition

### Task 2: Decompose CallToAction.tsx

**Files:**
- Create: `components/cta/TicketBarcode.tsx`
- Create: `components/cta/BoardingPassStub.tsx`
- Create: `components/cta/CtaContactForm.tsx`
- Modify: `components/CallToAction.tsx`
- Test: `pnpm typecheck`

#### Step 2.1: Extract TicketBarcode

- [ ] **Create `components/cta/TicketBarcode.tsx`**

Extract lines 274–308 (barcode lines + ticket number). Fully static, no props needed.

```tsx
import { DeviceMobile } from '@phosphor-icons/react';

export function TicketBarcode() {
  return (
    <div className="pt-2 border-t border-gray-200">
      {/* barcode lines from lines 277–298 */}
      {/* ticket number from lines 301–307 */}
    </div>
  );
}
```

#### Step 2.2: Extract BoardingPassStub

- [ ] **Create `components/cta/BoardingPassStub.tsx`**

Extract lines 208–315 (entire right stub). Uses `TicketBarcode` internally.

```tsx
import { AirplaneTilt } from '@phosphor-icons/react';
import { TicketBarcode } from './TicketBarcode';

export function BoardingPassStub() {
  return (
    <div className="w-full md:w-[30%] bg-gray-50 p-6 flex flex-col relative">
      {/* stub header, passenger, flight grid, boarding info, TicketBarcode, watermark */}
    </div>
  );
}
```

#### Step 2.3: Extract CtaContactForm

- [ ] **Create `components/cta/CtaContactForm.tsx`**

Extract the form (lines 74–181). Receives the `useContactForm` return value as props.

```tsx
import { WhatsappLogo, SpinnerGap } from '@phosphor-icons/react';
import type { ContactFormFields } from '../../types/contactCapture';

interface CtaContactFormProps {
  fields: ContactFormFields;
  setField: (key: keyof ContactFormFields, value: string | boolean) => void;
  isValid: boolean;
  isSubmitting: boolean;
  error: string | null;
  submit: (action: 'whatsapp' | 'callback') => Promise<void>;
}

export function CtaContactForm({ fields, setField, isValid, isSubmitting, error, submit }: CtaContactFormProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit('whatsapp'); }} className="flex flex-col gap-3 w-full" noValidate>
      {/* ... form inputs and buttons from lines 82–180 */}
    </form>
  );
}
```

Types sourced from `hooks/useContactForm.ts`: `ContactFormFields` has `firstName`, `lastName`, `whatsapp`, `email` (strings) and `emailOptIn` (boolean). The `setField` key is `keyof ContactFormFields`, and `submit` takes `'whatsapp' | 'callback'`.

#### Step 2.4: Refactor CallToAction.tsx

- [ ] **Modify `components/CallToAction.tsx`**

Replace inline sections with imports. Parent keeps:
- `formState` state + `useContactForm` hook
- `useEffect` for submitted sync
- Ticket container layout (background, container, left side shell, divider)

Expected: ~90 lines.

#### Step 2.5: Verify

- [ ] **Run `pnpm typecheck`**

- [ ] **Run `pnpm dev` and verify CTA section on homepage**

Test: closed state → click button → form opens → fill → submit → success. Boarding pass stub renders correctly.

#### Step 2.6: Commit

- [ ] **Commit**

```bash
git add components/cta/ components/CallToAction.tsx
git commit -m "refactor(CallToAction): extract form and boarding pass sub-components (#481)"
```

---

## Chunk 3: BrazilPromotionDayLanding.tsx Decomposition

### Task 3: Decompose BrazilPromotionDayLanding.tsx

**Files:**
- Create: `pages/landings/brazil-promotion-day/constants.ts`
- Create: `pages/landings/brazil-promotion-day/BpdNav.tsx`
- Create: `pages/landings/brazil-promotion-day/BpdHero.tsx`
- Create: `pages/landings/brazil-promotion-day/BpdPillars.tsx`
- Create: `pages/landings/brazil-promotion-day/BpdWhatsAppBand.tsx`
- Create: `pages/landings/brazil-promotion-day/BpdContactForm.tsx`
- Create: `pages/landings/brazil-promotion-day/BpdFooter.tsx`
- Modify: `pages/landings/BrazilPromotionDayLanding.tsx`
- Test: `pnpm typecheck`, E2E: `tests/e2e/brazil-promotion-day.spec.ts`

#### Step 3.1: Extract constants

- [ ] **Create `pages/landings/brazil-promotion-day/constants.ts`**

Move `WHATSAPP_MESSAGE`, `SOCIAL_LINKS`, `PILLARS`, `fadeUp` from lines 27–72.

#### Step 3.2: Extract BpdNav

- [ ] **Create `pages/landings/brazil-promotion-day/BpdNav.tsx`**

Extract fixed nav bar (lines ~155–177). Receives `onContact: () => void` prop.

#### Step 3.3: Extract BpdHero

- [ ] **Create `pages/landings/brazil-promotion-day/BpdHero.tsx`**

Extract hero section (lines ~180–315). Receives `onContact: () => void` prop for CTA buttons.

#### Step 3.4: Extract BpdPillars

- [ ] **Create `pages/landings/brazil-promotion-day/BpdPillars.tsx`**

Extract pillars grid (lines ~318–400). Imports `PILLARS` from constants.

#### Step 3.5: Extract BpdWhatsAppBand

- [ ] **Create `pages/landings/brazil-promotion-day/BpdWhatsAppBand.tsx`**

Extract dark CTA band (lines ~403–439). Receives `whatsappUrl: string` prop.

#### Step 3.6: Extract BpdContactForm

- [ ] **Create `pages/landings/brazil-promotion-day/BpdContactForm.tsx`**

Extract contact form section (lines ~442–687). This is the only section with state. Move form state (`form`, `submitState`, `errorMessage`, `isLocallySubmitting`) and `handleSubmit` **into** this component since they're scoped entirely to it.

Props: `submitLead` from `useLeadCapture`, `whatsappUrl` from parent, `isSubmitting` from hook.

#### Step 3.7: Extract BpdFooter

- [ ] **Create `pages/landings/brazil-promotion-day/BpdFooter.tsx`**

Extract footer (lines ~690–709). Static content.

#### Step 3.8: Refactor BrazilPromotionDayLanding.tsx

- [ ] **Modify `pages/landings/BrazilPromotionDayLanding.tsx`**

Parent keeps:
- `useLeadCapture()` + `useWhatsAppLink()` hooks
- GTM dataLayer push effect
- SEO component
- Layout composition with sub-components
- `openContactModal` callback threading

Expected: ~100 lines.

#### Step 3.9: Verify

- [ ] **Run `pnpm typecheck`**

- [ ] **Run existing E2E test: `npx playwright test tests/e2e/brazil-promotion-day.spec.ts`**

- [ ] **Run `pnpm dev` and manually verify `/brazil-promotion-day` page**

#### Step 3.10: Commit

```bash
git add pages/landings/brazil-promotion-day/ pages/landings/BrazilPromotionDayLanding.tsx
git commit -m "refactor(BrazilPromotionDay): decompose landing into focused sections (#481)"
```

---

## Chunk 4: Privacy.tsx Decomposition

### Task 4: Decompose Privacy.tsx

**Files:**
- Create: `pages/privacy/PrivacySection.tsx`
- Create: `pages/privacy/privacy-sections.tsx`
- Modify: `pages/Privacy.tsx`
- Test: `pnpm typecheck`

#### Step 4.1: Extract section data

- [ ] **Create `pages/privacy/privacy-sections.tsx`**

Create an array of objects with `{ id: string; title: string; body: React.ReactNode }` for each of the 15 privacy sections. The `body` field holds the **original JSX** that was inside each `<section>` — not HTML strings. This file uses `.tsx` because it contains JSX.

```tsx
import type { ReactNode } from 'react';

export interface PrivacySectionData {
  id: string;
  title: string;
  body: ReactNode;
}

export const PRIVACY_SECTIONS: PrivacySectionData[] = [
  {
    id: 'disposicoes-gerais',
    title: '1. Disposições Gerais',
    body: (
      <div className="space-y-2 font-inter text-muted-foreground">
        <h3 className="font-merriweather font-semibold">1.1 Escopo e Aplicação</h3>
        <p>A presente Política de Privacidade ...</p>
        {/* ... exact JSX from original section */}
      </div>
    ),
  },
  // ... remaining 14 sections with their original JSX
];
```

**Important:** Do NOT convert the existing JSX into HTML strings. The original component uses pure JSX — preserve that exactly. This avoids introducing `dangerouslySetInnerHTML` where none existed.

#### Step 4.2: Extract PrivacySection component

- [ ] **Create `pages/privacy/PrivacySection.tsx`**

```tsx
import type { PrivacySectionData } from './privacy-sections';

export function PrivacySection({ id, title, body }: PrivacySectionData) {
  return (
    <section id={id} className="space-y-2">
      <h2 className="text-xl md:text-2xl font-merriweather font-semibold">{title}</h2>
      {body}
    </section>
  );
}
```

No `dangerouslySetInnerHTML` — just renders the `ReactNode` directly.

#### Step 4.3: Refactor Privacy.tsx

- [ ] **Modify `pages/Privacy.tsx`**

Replace 15 inline sections with a `.map()` over the imported `PRIVACY_SECTIONS` array, rendering each via `<PrivacySection>`.

Expected: ~50 lines.

#### Step 4.4: Verify

- [ ] **Run `pnpm typecheck`**

- [ ] **Run `pnpm dev` and verify `/politica-privacidade` renders all 15 sections**

#### Step 4.5: Commit

```bash
git add pages/privacy/ pages/Privacy.tsx
git commit -m "refactor(Privacy): extract sections into data-driven renderer (#481)"
```

---

## Chunk 5: Solution.tsx (Beto Carrero) Decomposition

### Task 5: Decompose Solution.tsx

**Files:**
- Create: `components/landings/beto-carrero/solution/TicketCard.tsx`
- Create: `components/landings/beto-carrero/solution/PhoneMockup.tsx`
- Create: `components/landings/beto-carrero/solution/StickerButton.tsx`
- Create: `components/landings/beto-carrero/solution/SolutionModal.tsx`
- Modify: `components/landings/beto-carrero/Solution.tsx`
- Test: `pnpm typecheck`

#### Step 5.1: Extract TicketCard

- [ ] **Create `components/landings/beto-carrero/solution/TicketCard.tsx`**

Each of the 3 ticket cards (lines ~71–152) follows the same pattern. Create a reusable component with props for icon, title, items, accent color, etc.

#### Step 5.2: Extract PhoneMockup

- [ ] **Create `components/landings/beto-carrero/solution/PhoneMockup.tsx`**

Lines ~198–277. Fully presentational.

#### Step 5.3: Extract StickerButton

- [ ] **Create `components/landings/beto-carrero/solution/StickerButton.tsx`**

Lines ~156–194. Receives `onClick: () => void` prop.

#### Step 5.4: Extract SolutionModal

- [ ] **Create `components/landings/beto-carrero/solution/SolutionModal.tsx`**

Lines ~282–375. Receives `isOpen: boolean` and `onClose: () => void` props.

#### Step 5.5: Refactor Solution.tsx

- [ ] **Modify `components/landings/beto-carrero/Solution.tsx`**

Parent keeps: `isModalOpen` state, wave styles, layout columns.

Expected: ~100 lines.

#### Step 5.6: Verify

- [ ] **Run `pnpm typecheck`**

- [ ] **Run `pnpm dev` and verify `/beto-carrero` landing, specifically the Solution section and modal**

#### Step 5.7: Commit

```bash
git add components/landings/beto-carrero/solution/ components/landings/beto-carrero/Solution.tsx
git commit -m "refactor(BetoCarrero/Solution): extract ticket cards, phone mockup, and modal (#481)"
```

---

## Chunk 6: VenueMap.tsx (Lollapalooza) Decomposition

### Task 6: Decompose VenueMap.tsx

**Files:**
- Create: `components/landings/lollapalooza/venue-map/poi-data.ts`
- Create: `components/landings/lollapalooza/venue-map/PoiListItem.tsx`
- Modify: `components/landings/lollapalooza/VenueMap.tsx`
- Test: `pnpm typecheck`

#### Step 6.1: Extract POI data and helper

- [ ] **Create `components/landings/lollapalooza/venue-map/poi-data.ts`**

Move the `pois` data array and `getPoiStyle` helper out of the component body. Read the source to find exact locations — they are inside the component function, not at module level.

```ts
export interface PoiItem {
  name: string;
  type: string;
  lat: number;
  lng: number;
  description: string;
  // ... other fields
}

export const POI_DATA: PoiItem[] = [ /* ... */ ];

export function getPoiStyle(type: string): { bg: string; text: string; icon: string } {
  // ... from lines 72–84
}
```

#### Step 6.2: Extract PoiListItem

- [ ] **Create `components/landings/lollapalooza/venue-map/PoiListItem.tsx`**

Extract the POI list item rendering (lines ~265–363).

```tsx
import type { PoiItem } from './poi-data';
import { getPoiStyle } from './poi-data';

interface PoiListItemProps {
  poi: PoiItem;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export const PoiListItem = React.forwardRef<HTMLButtonElement, PoiListItemProps>(
  ({ poi, index, isActive, onClick }, ref) => {
    // ... render POI entry
  }
);
```

#### Step 6.3: Refactor VenueMap.tsx

- [ ] **Modify `components/landings/lollapalooza/VenueMap.tsx`**

Parent keeps: `activeIndex`, refs, map initialization effect, scroll sync effect, click handler, two-column layout.

Expected: ~120 lines.

#### Step 6.4: Verify

- [ ] **Run `pnpm typecheck`**

- [ ] **Run `pnpm dev` and verify `/lollapalooza` landing, VenueMap section with map clicks and list scrolling**

#### Step 6.5: Commit

```bash
git add components/landings/lollapalooza/venue-map/ components/landings/lollapalooza/VenueMap.tsx
git commit -m "refactor(Lollapalooza/VenueMap): extract POI data and list item (#481)"
```

---

## Chunk 7: OrlandoApp.tsx Decomposition

### Task 7: Decompose OrlandoApp.tsx

**Files:**
- Create: `components/landings/orlando/orlando-constants.tsx`
- Create: `components/landings/orlando/OrlandoHero.tsx`
- Create: `components/landings/orlando/OrlandoFeatures.tsx`
- Create: `components/landings/orlando/OrlandoParks.tsx`
- Create: `components/landings/orlando/OrlandoItinerary.tsx`
- Create: `components/landings/orlando/OrlandoFooter.tsx`
- Modify: `components/landings/orlando/OrlandoApp.tsx`
- Test: `pnpm typecheck`

#### Step 7.1: Extract shared components and constants

- [ ] **Create `components/landings/orlando/orlando-constants.tsx`**

Move `WashiTape`, `Card`, `Badge` components (lines 18–61) and `SITE_URL`/`LOGO_URL` constants.

```ts
// WashiTape, Card (forwardRef), Badge — pure presentational components
// SITE_URL, LOGO_URL constants
```

#### Step 7.2: Extract OrlandoHero

- [ ] **Create `components/landings/orlando/OrlandoHero.tsx`**

Extract hero section (lines ~96–239). Includes grain overlay SVG, nav bar, headline, and hero cards. Cards use `forwardRef` for parallax — pass refs down.

Props: `cardsRef: React.MutableRefObject<(HTMLDivElement | null)[]>`, `onContact: () => void`

#### Step 7.3: Extract OrlandoFeatures

- [ ] **Create `components/landings/orlando/OrlandoFeatures.tsx`**

Lines ~241–320. Fully presentational features grid.

#### Step 7.4: Extract OrlandoParks

- [ ] **Create `components/landings/orlando/OrlandoParks.tsx`**

Lines ~322–709. The largest section. Contains 3 park group sub-sections (Disney, Universal, Other). Each group is a styled card with images, tags, and descriptions.

Props: `onContact: () => void` (for CTA buttons within park cards).

**Note:** OrlandoParks covers ~387 lines (3 park groups: Disney, Universal, Other). Since the groups are purely presentational with no independent state, a single file is acceptable. If the implementer finds it unwieldy, splitting into `DisneyParks`, `UniversalParks`, `OtherParks` sub-components is a valid follow-up but not required for this issue.

#### Step 7.5: Extract OrlandoItinerary

- [ ] **Create `components/landings/orlando/OrlandoItinerary.tsx`**

Lines ~711–778. Static itinerary sample.

Props: `onContact: () => void`

#### Step 7.6: Extract OrlandoFooter

- [ ] **Create `components/landings/orlando/OrlandoFooter.tsx`**

Lines ~780–833. Uses `useFooterRuntimeMetadata()`.

Note: Move the `useFooterRuntimeMetadata()` call into this component since it's only used here.

#### Step 7.7: Refactor OrlandoApp.tsx

- [ ] **Modify `components/landings/orlando/OrlandoApp.tsx`**

Parent keeps: `cardsRef`, parallax `useEffect`, layout container with `landing-orlando` class, composition of sub-components.

Expected: ~150 lines.

#### Step 7.8: Verify

- [ ] **Run `pnpm typecheck`**

- [ ] **Run `pnpm dev` and verify `/orlando` landing page**

Test: parallax on desktop, responsive layout, all park cards, itinerary, footer metadata.

#### Step 7.9: Commit

```bash
git add components/landings/orlando/ 
git commit -m "refactor(Orlando): decompose 838-line monolith into section components (#481)"
```

---

## Final Verification

- [ ] **Run full typecheck: `pnpm typecheck`**
- [ ] **Run regression tests: `pnpm test:regression`**
- [ ] **Run E2E tests: `npx playwright test tests/e2e/brazil-promotion-day.spec.ts`**
- [ ] **Build: `pnpm build`**
- [ ] **Visual spot-check all 7 pages in dev server**

---

## Summary

| Component | Before | After (parent) | Sub-components |
|-----------|--------|----------------|----------------|
| NPS.tsx | 445 | ~120 | 5 files |
| CallToAction.tsx | 326 | ~90 | 3 files |
| BrazilPromotionDayLanding.tsx | 715 | ~100 | 7 files |
| Privacy.tsx | 384 | ~50 | 2 files |
| Solution.tsx | 381 | ~100 | 4 files |
| VenueMap.tsx | 396 | ~120 | 2 files |
| OrlandoApp.tsx | 838 | ~150 | 6 files |
| **Total** | **3485** | **~730** | **29 new files** |
