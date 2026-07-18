# React Doctor Top Three Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all eight occurrences of the three requested React Doctor rules while preserving user-visible behavior and leaving the other 21 current findings untouched.

**Architecture:** Keep state at its current owner, extract presentation sections into typed components, and isolate Leaflet ownership in lifecycle-focused hooks/effects. Use React 19 `useEffectEvent` for the pending chat callback and explicit matching teardown for every map timer/listener/resource.

**Tech Stack:** React 19, TypeScript, Vite, Leaflet, Framer Motion, node:test, Playwright, React Doctor 0.7.8+

## Global Constraints

- Fix exactly `react-doctor/no-giant-component`, `react-doctor/prefer-use-effect-event`, and `react-doctor/effect-needs-cleanup`.
- Preserve copy, rendered semantics, Tailwind classes, analytics, routes, animations, and conversion behavior.
- Do not add suppressions, edit React Doctor configuration, change dependencies, or fix unrelated diagnostics.
- Use the baseline `npx react-doctor@latest --verbose` output as the RED check and require the final real-tool scan to remove all eight requested occurrences.
- Apply repo standards to every touched TypeScript/TSX file and run `pnpm lint:changed` before completion.

## File Structure

- Create `components/ai-chat/AIChatPanelView.tsx`: chat header, message history/action cards, typing state, and composer.
- Modify `components/AIChatPanel.tsx`: chat state/orchestration, dialog effects, lead submission, pending-message effects, and composition.
- Create `components/destinations/useDestinationMap.ts`: Leaflet map and marker lifecycle.
- Create `components/destinations/DestinationsView.tsx`: filters, framed map, cards, and details dialog.
- Modify `components/Destinations.tsx`: selected destination/filter state and view composition.
- Create `components/search/useSearchFormController.ts`: form state, derived values, and field interactions.
- Create `components/search/useSearchSubmission.ts`: analytics lifecycle, validation, and AI-chat submission.
- Modify `components/SearchForm.tsx`: existing field-component composition only.
- Modify `components/landings/lollapalooza/VenueMap.tsx`: explicit Leaflet teardown.
- Create `components/landings/consultoria/ConsultoriaLandingSections.tsx`: consultoria content sections.
- Modify `pages/landings/ConsultoriaDeViagemLanding.tsx`: metadata, shell, and section composition.
- Create `components/landings/cruzeiros/CruiseOfferCards.tsx`: offer card primitives and offer conversation shaping.
- Create `components/landings/cruzeiros/CruzeirosLandingSections.tsx`: cruzeiros content sections.
- Modify `pages/landings/CruzeirosLanding.tsx`: metadata, offer selection, shell, and section composition.

---

### Task 1: Stabilize pending-chat effects with Effect Events

**Files:**
- Modify: `components/AIChatPanel.tsx:1,114-122,369-387`

**Interfaces:**
- Consumes: `AIChatPanelProps.onConsumePending: () => void`
- Produces: `onConsumePendingEvent: () => void`, callable only from effects

- [ ] **Step 1: Re-run the focused RED check**

Run:

```bash
npx react-doctor@latest --verbose
```

Expected: `react-doctor/prefer-use-effect-event` is reported at `components/AIChatPanel.tsx`.

- [ ] **Step 2: Bind the latest callback with React 19 `useEffectEvent`**

Update the React import and add the binding immediately after props are destructured:

```tsx
import React, {
  memo,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';

const onConsumePendingEvent = useEffectEvent(onConsumePending);
```

Replace the two pending effects with:

```tsx
useEffect(() => {
  if (!initialAutoSendMessage) return;

  const timer = setTimeout(() => {
    void submitMessageRef.current(initialAutoSendMessage, false);
    onConsumePendingEvent();
  }, initialAutoSendDelayMs ?? 500);

  return () => clearTimeout(timer);
}, [initialAutoSendMessage, initialAutoSendDelayMs]);

useEffect(() => {
  if (!initialInputPrefill) return;
  setInput(initialInputPrefill);
  onConsumePendingEvent();
}, [initialInputPrefill]);
```

- [ ] **Step 3: Verify GREEN for the focused rule and contracts**

Run:

```bash
pnpm typecheck
npx react-doctor@latest --verbose
```

Expected: typecheck passes and `prefer-use-effect-event` is absent.

- [ ] **Step 4: Commit the focused fix**

```bash
git add components/AIChatPanel.tsx
git commit -m "fix(chat): stabilize pending message effects"
```

### Task 2: Make VenueMap teardown own every Leaflet allocation

**Files:**
- Modify: `components/landings/lollapalooza/VenueMap.tsx:20-136`

**Interfaces:**
- Consumes: Leaflet `Map`, `Marker`, and timer handles created on mount
- Produces: one idempotent effect cleanup that unregisters marker handlers and removes the map

- [ ] **Step 1: Confirm the RED diagnostic**

Run:

```bash
npx react-doctor@latest --verbose
```

Expected: `effect-needs-cleanup` remains at `VenueMap.tsx:20`.

- [ ] **Step 2: Capture owned resources and matching disposers**

At the top of the effect, replace the uninitialized timer with:

```tsx
let a11yTimer: ReturnType<typeof setTimeout> | undefined;
let ownedMap: L.Map | null = null;
const markerDisposers: Array<() => void> = [];
```

After `L.map(...)`, assign `ownedMap = map`. Replace each anonymous POI registration with a named handler and disposer:

```tsx
const handleMarkerClick = () => {
  setActiveIndex(index);
  map.flyTo(poi.coords, 13, { animate: true, duration: 1 });
};

marker.on('click', handleMarkerClick);
markerDisposers.push(() => marker.off('click', handleMarkerClick));
```

- [ ] **Step 3: Replace the timer-only cleanup with complete teardown**

```tsx
return () => {
  if (a11yTimer !== undefined) clearTimeout(a11yTimer);
  markerDisposers.forEach((dispose) => dispose());
  markersRef.current = [];

  if (ownedMap) {
    ownedMap.off();
    ownedMap.remove();
  }

  if (mapInstanceRef.current === ownedMap) {
    mapInstanceRef.current = null;
  }
};
```

- [ ] **Step 4: Verify the map fix**

Run:

```bash
pnpm typecheck
pnpm exec playwright test tests/e2e/landing-no-aichat.spec.ts
npx react-doctor@latest --verbose
```

Expected: typecheck and Playwright pass; the `VenueMap.tsx` cleanup diagnostic is absent.

- [ ] **Step 5: Commit the focused fix**

```bash
git add components/landings/lollapalooza/VenueMap.tsx
git commit -m "fix(lollapalooza): release venue map resources"
```

### Task 3: Split AIChatPanel presentation from orchestration

**Files:**
- Create: `components/ai-chat/AIChatPanelView.tsx`
- Modify: `components/AIChatPanel.tsx:20-100,389-570`

**Interfaces:**
- Produces: exported `ChatMessage` type and `AIChatPanelView` component
- Consumes: messages, refs, loading/input state, close/input/submit handlers, and lead-form callbacks

- [ ] **Step 1: Confirm the giant-component RED diagnostic**

Run:

```bash
npx react-doctor@latest --verbose
```

Expected: `no-giant-component` reports `AIChatPanel`.

- [ ] **Step 2: Create typed view boundaries**

Create `components/ai-chat/AIChatPanelView.tsx` with these public types and component boundaries:

```tsx
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  chips?: Array<{ id: string; label: string }>;
  isAction?: boolean;
  actionData?: {
    destination: string;
    bantSummary: string;
    iataCode?: string;
  };
}

interface AIChatPanelViewProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  messages: ChatMessage[];
  lastModelIndex: number;
  liveAnnouncement: string;
  input: string;
  isLoading: boolean;
  isSubmittingLead: boolean;
  getLeadWhatsAppUrl: ReturnType<typeof useLeadCapture>['getLeadWhatsAppUrl'];
  prepareLeadSubmitPayload: (payload: LeadFinalizePayload, eventId: string) => SubmitLeadRequest;
  finalizeLead: (payload: SubmitLeadRequest) => Promise<LeadFinalizeResult>;
  onClose: () => void;
  onInput: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmitMessage: (text: string) => void;
}
```

Move the existing `FormattedText` implementation unchanged into this file. Extract the existing JSX ranges into these focused private components without changing their markup or classes:

- `ChatPanelHeader`: current `AIChatPanel.tsx:395-424`
- `ChatMessageList`: current `AIChatPanel.tsx:426-541`
- `ChatComposer`: current `AIChatPanel.tsx:543-570`

Compose them in:

```tsx
export function AIChatPanelView(props: AIChatPanelViewProps) {
  return (
    <dialog
      ref={props.dialogRef}
      className="ai-chat-drawer fixed top-0 right-0 h-full w-full sm:w-[450px] z-[9999] m-0 ml-auto p-0 bg-white flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.1)] sm:rounded-l-[2rem] overflow-hidden outline-none max-h-full max-w-full"
      aria-labelledby="ai-chat-title"
    >
      <ChatPanelHeader onClose={props.onClose} />
      <ChatMessageList {...props} />
      <ChatComposer {...props} />
    </dialog>
  );
}
```

- [ ] **Step 3: Reduce AIChatPanel to orchestration and composition**

Import `AIChatPanelView` and `ChatMessage`, replace the local `Message` type with `ChatMessage`, remove presentation-only imports, and replace the former dialog JSX with:

```tsx
return (
  <AIChatPanelView
    dialogRef={dialogRef}
    messagesEndRef={messagesEndRef}
    inputRef={inputRef}
    messages={messages}
    lastModelIndex={lastModelIndex}
    liveAnnouncement={liveAnnouncement}
    input={input}
    isLoading={isLoading}
    isSubmittingLead={isSubmittingLead}
    getLeadWhatsAppUrl={getLeadWhatsAppUrl}
    prepareLeadSubmitPayload={handlePrepareLeadSubmitPayload}
    finalizeLead={handleFinalizeLead}
    onClose={closeChatDrawer}
    onInput={handleInput}
    onKeyDown={handleKeyDown}
    onSubmitMessage={(text) => void submitMessage(text)}
  />
);
```

- [ ] **Step 4: Verify behavior and diagnostic removal**

Run:

```bash
pnpm typecheck
pnpm exec playwright test tests/e2e/ai-chat-lazy-load.spec.ts tests/e2e/chatbot-lead-submit.spec.ts
npx react-doctor@latest --verbose
```

Expected: tests pass; `AIChatPanel` is absent from `no-giant-component`; the Effect Event warning remains absent.

- [ ] **Step 5: Commit the extraction**

```bash
git add components/AIChatPanel.tsx components/ai-chat/AIChatPanelView.tsx
git commit -m "refactor(chat): split panel presentation"
```

### Task 4: Isolate Destinations map lifecycle and views

**Files:**
- Create: `components/destinations/useDestinationMap.ts`
- Create: `components/destinations/DestinationsView.tsx`
- Modify: `components/Destinations.tsx`

**Interfaces:**
- Produces: `useDestinationMap(filteredDestinations, onSelect)` returning `mapRef` and `handleZoom`
- Produces: `DestinationsView` consuming filter state, selected destination, map ref, and actions

- [ ] **Step 1: Confirm both Destinations RED diagnostics**

Run:

```bash
npx react-doctor@latest --verbose
```

Expected: `Destinations` is reported by `no-giant-component` and `effect-needs-cleanup`.

- [ ] **Step 2: Extract the Leaflet owner hook with explicit listener cleanup**

Move the current map initialization and filter-marker effects (`Destinations.tsx:75-236`) into:

```tsx
export function useDestinationMap(
  filteredDestinations: Destination[],
  onSelect: (destination: Destination) => void,
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);

  const handleZoom = useCallback((type: 'in' | 'out') => {
    const map = mapInstance.current;
    if (!map) return;
    if (type === 'in') map.zoomIn();
    else map.zoomOut();
  }, []);

  return { mapRef, handleZoom };
}
```

Inside the moved filter effect, use an owned registration list:

```tsx
const markerRegistrations: Array<{
  marker: L.Marker;
  handler: (event: L.LeafletMouseEvent) => void;
}> = [];

const handleMarkerClick = (event: L.LeafletMouseEvent) => {
  L.DomEvent.stopPropagation(event);
  onSelect(dest);
};

marker.on('click', handleMarkerClick);
markerRegistrations.push({ marker, handler: handleMarkerClick });

return () => {
  if (flyTimer !== undefined) clearTimeout(flyTimer);
  markerRegistrations.forEach(({ marker, handler }) => {
    marker.off('click', handler);
  });
  markersLayer.clearLayers();
};
```

The effect depends on `[filteredDestinations, onSelect]`; remove the redundant `activeFilter` dependency because the filtered array already represents it.

- [ ] **Step 3: Extract the view sections**

Move existing JSX without copy/class changes into `DestinationsView.tsx`:

- `DestinationsHeader`: current `Destinations.tsx:254-279`
- `DestinationMapFrame`: current `Destinations.tsx:281-336`
- `DestinationCards`: current `Destinations.tsx:338-379`
- `DestinationDialog`: current `Destinations.tsx:381-473`

Expose one typed composition boundary:

```tsx
interface DestinationsViewProps {
  activeFilter: string;
  filteredDestinations: Destination[];
  selectedDestination: Destination | null;
  mapRef: React.RefObject<HTMLDivElement | null>;
  destinationModalRef: React.RefObject<HTMLDialogElement | null>;
  onFilterChange: (filter: string) => void;
  onDestinationSelect: (destination: Destination) => void;
  onCloseModal: () => void;
  onZoom: (type: 'in' | 'out') => void;
}
```

- [ ] **Step 4: Compose the small state owner**

`components/Destinations.tsx` keeps filter/selection state plus dialog effects and renders:

```tsx
const { mapRef, handleZoom } = useDestinationMap(filteredDestinations, setSelectedDestination);

return (
  <DestinationsView
    activeFilter={activeFilter}
    filteredDestinations={filteredDestinations}
    selectedDestination={selectedDestination}
    mapRef={mapRef}
    destinationModalRef={destinationModalRef}
    onFilterChange={setActiveFilter}
    onDestinationSelect={setSelectedDestination}
    onCloseModal={closeModal}
    onZoom={handleZoom}
  />
);
```

- [ ] **Step 5: Verify both Destinations fixes**

Run:

```bash
pnpm typecheck
pnpm test:regression
npx react-doctor@latest --verbose --scope changed
```

Expected: regression and typecheck pass; neither requested rule reports `Destinations`.

- [ ] **Step 6: Commit the extraction**

```bash
git add components/Destinations.tsx components/destinations
git commit -m "refactor(destinations): isolate map and views"
```

### Task 5: Split SearchForm coordination from composition

**Files:**
- Create: `components/search/useSearchSubmission.ts`
- Create: `components/search/useSearchFormController.ts`
- Modify: `components/SearchForm.tsx`

**Interfaces:**
- Consumes: `onDestinationMatch: (city: string | null) => void`
- Produces: `SearchFormController` with field props, panel state, refs, validation, and submit handler

- [ ] **Step 1: Confirm the SearchForm RED diagnostic**

Run:

```bash
npx react-doctor@latest --verbose
```

Expected: `no-giant-component` reports `SearchForm`.

- [ ] **Step 2: Extract analytics and submission lifecycle**

Create `useSearchSubmission.ts` with this boundary:

```tsx
interface SearchSubmissionInput {
  inputValue: string;
  startDate: Date | null;
  endDate: Date | null;
  adults: number;
  children: number;
  childAges: string[];
  tripType: string;
  budget: string;
}

export function useSearchSubmission(values: SearchSubmissionInput) {
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const completedFields = useRef<Set<'destination' | 'date' | 'budget'> | null>(null);
}
```

Move the complete implementations of the current form-view effect (`SearchForm.tsx:46-52`), `markStarted` (`54-73`), timeout cleanup (`75-81`), and search submission (`283-331`) below those declarations. Return `{ isSearchLoading, validationError, markStarted, handleSearch }`. The moved timeout cleanup must retain the current `clearTimeout(errorTimeoutRef.current)` behavior.

- [ ] **Step 3: Extract the bounded controller**

Move state, refs, panel registry, derived values, and field callbacks from `SearchForm.tsx:28-281` into `useSearchFormController.ts`. Its return type must expose the exact values consumed by the current JSX:

```tsx
export function useSearchFormController(onDestinationMatch: (city: string | null) => void) {
  const submission = useSearchSubmission({
    inputValue,
    startDate,
    endDate,
    adults,
    children,
    childAges,
    tripType,
    budget,
  });

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    submission.handleSearch();
  }, [submission.handleSearch]);

  return {
    inputValue,
    activeSuggestionIndex,
    openPanel,
    startDate,
    endDate,
    currentMonth,
    adults,
    children,
    childAges,
    tripType,
    budget,
    showTripType,
    filteredDestinations,
    calendarDays,
    guestSummary,
    selectedTripObj,
    selectedBudgetObj,
    canGoToPreviousMonth,
    isSearchLoading: submission.isSearchLoading,
    validationError: submission.validationError,
    guestDropdownRef,
    destRef,
    destinationInputRef,
    calendarRef,
    tripTypeRef,
    budgetRef,
    handleSubmit,
    handleDestinationChange,
    handleDestinationSelect,
    handleDestinationKeyDown,
    handleClearDestination,
    handleAdultsChange,
    handleChildCountChange,
    handleChildAgeChange,
    handleDateClick,
    isDateSelected,
    isDateInRange,
    handleMonthChange,
    handleTripTypeSelect,
    revealTripType,
    handleBudgetSelect,
    toggleCalendar,
    toggleGuestDropdown,
    closeGuestDropdown,
    toggleTripTypeDropdown,
    toggleBudgetDropdown,
    onDestinationFocus,
  };
}
```

- [ ] **Step 4: Keep SearchForm as the existing view composition**

Replace `SearchForm.tsx:28-347` with `const controller = useSearchFormController(onDestinationMatch);`. Keep the complete return tree from current lines 349-442 unchanged. Destructure every identifier that tree consumes from `controller` once before the return so the existing field props and form class remain byte-for-byte unchanged.

- [ ] **Step 5: Verify search behavior and size**

Run:

```bash
pnpm typecheck
pnpm exec playwright test tests/e2e/hero_ux.spec.ts
npx react-doctor@latest --verbose --scope changed
```

Expected: search interactions pass and `SearchForm` is absent from `no-giant-component`.

- [ ] **Step 6: Commit the extraction**

```bash
git add components/SearchForm.tsx components/search/useSearchFormController.ts components/search/useSearchSubmission.ts
git commit -m "refactor(search): split form coordination"
```

### Task 6: Split Consultoria landing sections

**Files:**
- Create: `components/landings/consultoria/ConsultoriaLandingSections.tsx`
- Modify: `pages/landings/ConsultoriaDeViagemLanding.tsx`

**Interfaces:**
- Produces: `ConsultoriaHero`, `ConsultoriaBenefits`, `ConsultoriaAudience`, `ConsultoriaProcess`, `ConsultoriaAbout`, `ConsultoriaFinalCta`, and `ConsultoriaOtherServices`
- Consumes: module-local static arrays moved with the sections

- [ ] **Step 1: Confirm the landing RED diagnostic**

Run:

```bash
npx react-doctor@latest --verbose
```

Expected: `no-giant-component` reports `ConsultoriaDeViagemLanding`.

- [ ] **Step 2: Move section data and JSX into focused components**

Move `FOR_WHO`, `HOW_IT_WORKS`, `PILLARS`, and `CREDENTIALS` plus these exact JSX ranges into `ConsultoriaLandingSections.tsx` without changing content or classes:

- `ConsultoriaHero`: lines 137-201
- `ConsultoriaBenefits`: lines 203-265
- `ConsultoriaAudience`: lines 267-322
- `ConsultoriaProcess`: lines 324-359
- `ConsultoriaAbout`: lines 361-417
- `ConsultoriaFinalCta`: lines 419-446
- `ConsultoriaOtherServices`: lines 448-488

Export each moved range as a parameterless function named `ConsultoriaHero`, `ConsultoriaBenefits`, `ConsultoriaAudience`, `ConsultoriaProcess`, `ConsultoriaAbout`, `ConsultoriaFinalCta`, and `ConsultoriaOtherServices`, respectively. Each function returns its listed `<section>` range exactly.

- [ ] **Step 3: Compose the route shell**

Keep FAQ/schema/nav/footer ownership in the route and replace the moved sections with:

```tsx
<LandingNav source="consultoria-viagem" />
<ConsultoriaHero />
<ConsultoriaBenefits />
<ConsultoriaAudience />
<ConsultoriaProcess />
<ConsultoriaAbout />
<ConsultoriaFinalCta />
<ConsultoriaOtherServices />
<LandingFAQ
  items={FAQ_ITEMS}
  title="Dúvidas sobre consultoria de viagem"
  subtitle="Tire suas dúvidas sobre como funciona a consultoria personalizada da Anhangá."
/>
<LandingFooter />
```

- [ ] **Step 4: Verify landing behavior and diagnostic removal**

Run:

```bash
pnpm typecheck
pnpm exec playwright test tests/e2e/landing-consultoria-content.spec.ts tests/e2e/landing-no-aichat.spec.ts
npx react-doctor@latest --verbose --scope changed
```

Expected: landing tests pass and `ConsultoriaDeViagemLanding` is absent from `no-giant-component`.

- [ ] **Step 5: Commit the extraction**

```bash
git add pages/landings/ConsultoriaDeViagemLanding.tsx components/landings/consultoria
git commit -m "refactor(consultoria): split landing sections"
```

### Task 7: Split Cruzeiros offer and landing sections

**Files:**
- Create: `components/landings/cruzeiros/CruiseOfferCards.tsx`
- Create: `components/landings/cruzeiros/CruzeirosLandingSections.tsx`
- Modify: `pages/landings/CruzeirosLanding.tsx`

**Interfaces:**
- Produces: offer card components and section components
- Consumes: `featuredOffer?: CruiseOffer` and `secondaryOffers: CruiseOffer[]`

- [ ] **Step 1: Confirm the landing RED diagnostic**

Run:

```bash
npx react-doctor@latest --verbose
```

Expected: `no-giant-component` reports `CruzeirosLanding`.

- [ ] **Step 2: Move offer presentation and conversation shaping**

Move `offerCrmLabel`, `offerWhatsappMessage`, `openOfferConversation`, `OfferMeta`, `ProfileTags`, `RegionBadge`, `FeaturedOffer`, and `OfferCard` from current lines 26-233 into `CruiseOfferCards.tsx`. Export only the two existing card components with these signatures:

```tsx
export function FeaturedOffer({ offer }: { offer: CruiseOffer }): React.ReactElement;
export function OfferCard({ offer }: { offer: CruiseOffer }): React.ReactElement;
```

Keep the formatting helpers private to that module.

- [ ] **Step 3: Move static content sections**

Move `HOW_IT_WORKS`, `WHY_CURATION`, and the listed current JSX ranges into focused exports. The exact signature for the only data-bearing boundary is:

```tsx
interface CruiseOffersSectionProps {
  featuredOffer?: CruiseOffer;
  secondaryOffers: CruiseOffer[];
}

export function CruiseOffersSection({
  featuredOffer,
  secondaryOffers,
}: CruiseOffersSectionProps): React.ReactElement | null;
```

Export the remaining ranges as parameterless functions: `CruiseMiniHeader` (273-299), `CruiseHero` (301-346), `CruiseProcess` (415-450), `CruiseCurationBenefits` (452-498), `CruiseAbout` (500-529), `CruiseFinalCta` (531-559), `CruiseOtherServices` (561-601), and `CruiseLandingFooter` (610-613). Each function body uses that exact existing markup, copy, classes, motion variants, tracking values, and CTA sources.

- [ ] **Step 4: Compose the route shell**

Replace the former page body sections with:

```tsx
<CruiseMiniHeader />
<CruiseHero />
<CruiseOffersSection
  featuredOffer={FEATURED_OFFER}
  secondaryOffers={SECONDARY_OFFERS}
/>
<CruiseProcess />
<CruiseCurationBenefits />
<CruiseAbout />
<CruiseFinalCta />
<CruiseOtherServices />
<LandingFAQ
  items={FAQ_ITEMS}
  title="Dúvidas sobre cruzeiros"
  subtitle="Tire suas dúvidas antes de escolher seu cruzeiro."
/>
<CruiseLandingFooter />
```

The offers component returns `null` when both `featuredOffer` is absent and `secondaryOffers` is empty, preserving the existing empty-season behavior.

- [ ] **Step 5: Verify offer behavior and diagnostic removal**

Run:

```bash
pnpm typecheck
pnpm exec playwright test tests/e2e/cruzeiros-ofertas.spec.ts tests/e2e/cruzeiros-redirect.spec.ts
npx react-doctor@latest --verbose --scope changed
```

Expected: offer/redirect tests pass and `CruzeirosLanding` is absent from `no-giant-component`.

- [ ] **Step 6: Commit the extraction**

```bash
git add pages/landings/CruzeirosLanding.tsx components/landings/cruzeiros
git commit -m "refactor(cruzeiros): split landing sections"
```

### Task 8: Run full completion verification

**Files:**
- Verify all files changed in Tasks 1-7
- Do not edit unrelated diagnostics

**Interfaces:**
- Produces: evidence that tests, build, lint ratchet, and the actual latest React Doctor agree

- [ ] **Step 1: Check the final diff scope**

Run:

```bash
git status --short
git diff --check main...HEAD
git diff --stat main...HEAD
```

Expected: only the design/plan and files listed above are changed; no whitespace errors.

- [ ] **Step 2: Run repository gates**

```bash
pnpm test:regression
pnpm typecheck
pnpm lint:changed
pnpm run build
```

Expected: every command exits 0.

- [ ] **Step 3: Run the relevant browser regression set**

```bash
pnpm exec playwright test \
  tests/e2e/ai-chat-lazy-load.spec.ts \
  tests/e2e/chatbot-lead-submit.spec.ts \
  tests/e2e/hero_ux.spec.ts \
  tests/e2e/landing-consultoria-content.spec.ts \
  tests/e2e/landing-no-aichat.spec.ts \
  tests/e2e/cruzeiros-ofertas.spec.ts \
  tests/e2e/cruzeiros-redirect.spec.ts
```

Expected: every selected test passes.

- [ ] **Step 4: Run the authoritative React Doctor scan**

```bash
npx react-doctor@latest --verbose
```

Expected:

- no `react-doctor/no-giant-component`
- no `react-doctor/prefer-use-effect-event`
- no `react-doctor/effect-needs-cleanup`
- unrelated findings remain unmodified for the follow-up

- [ ] **Step 5: Inspect final history and working tree**

```bash
git log --oneline main..HEAD
git status --short
```

Expected: focused conventional commits and a clean working tree except for this plan if it was intentionally left uncommitted.
