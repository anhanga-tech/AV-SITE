# React Doctor Top Three Design

## Goal

Remove every occurrence of the three requested React Doctor rule families without suppressing diagnostics or changing user-visible behavior:

- `react-doctor/no-giant-component` (5 occurrences)
- `react-doctor/prefer-use-effect-event` (1 occurrence)
- `react-doctor/effect-needs-cleanup` (2 occurrences)

All other findings from the current React Doctor scan remain out of scope for a follow-up pass.

## Baseline

The isolated branch starts from `main` at `55552c7`. The baseline has:

- 969 passing regression tests
- React Doctor 0.7.8 score: 64/100
- 29 live findings, including the same eight requested occurrences from the supplied 26-finding report

The supplied `diagnostics.json` contains no `fixGroupId` property. Each requested rule family is therefore one task, and its repeated locations are occurrences within that task.

## Constraints

- Follow the current no-cache canonical React Doctor validation and fix recipes.
- Do not add suppressions, change React Doctor configuration, or hide registrations from static analysis.
- Preserve page copy, markup semantics, styling classes, analytics events, routes, animation behavior, and contact/chat behavior.
- Do not fix unrelated React Doctor findings, dependency warnings, or legacy lint debt.
- Keep React 19, TypeScript, Vite, Leaflet, Framer Motion, and the existing test stack unchanged.

## Architecture

### AI chat panel

`components/AIChatPanel.tsx` remains the owner of chat state, Gemini orchestration, dialog lifecycle, and lead submission. Presentation-only regions move into `components/ai-chat/AIChatPanelView.tsx`:

- drawer header
- message history, action cards, chips, and typing indicator
- message composer

The parent passes explicit data and event callbacks to these view components. A React 19 `useEffectEvent` binding calls the latest `onConsumePending` implementation from the delayed auto-send and prefill effects without making callback identity a reason to restart either effect.

### Destinations section

Leaflet setup and marker lifecycle move to `components/destinations/useDestinationMap.ts`. The hook owns the map, marker layer, filter-driven markers, animation timer, and every marker click registration.

The UI is decomposed into focused components under `components/destinations/` for the section header/filter controls, framed map, destination cards, and destination dialog. `components/Destinations.tsx` remains the small stateful coordinator.

Each marker click callback is stored as a named handler and removed with the matching Leaflet `off` call before the marker layer is cleared. This makes allocation ownership explicit even though the previous `clearLayers()` teardown already removed layers from the map.

### Search form

The existing field components remain unchanged. Coordination moves from `components/SearchForm.tsx` into a bounded controller hook under `components/search/`.

The controller owns form state, panel coordination, date/guest/destination handlers, and the values consumed by the view. Analytics and submit orchestration are separated into a smaller helper hook so the controller does not merely become a renamed giant unit. `SearchForm.tsx` becomes the form composition layer.

### Lollapalooza venue map

The mount effect in `components/landings/lollapalooza/VenueMap.tsx` retains direct ownership of the Leaflet map. Its returned teardown clears the accessibility timer, unregisters marker click callbacks, removes marker listeners, removes the Leaflet map, resets refs, and releases the marker list.

This prevents map instances and event callbacks from surviving route changes or remounts.

### Static landing pages

The already-labelled sections of the consultoria and cruzeiros pages move into page-specific components under:

- `components/landings/consultoria/`
- `components/landings/cruzeiros/`

The route files retain SEO/schema declarations, no-JavaScript fallback, Motion configuration, navigation/footer composition, and page-level data selection. Extracted sections receive only the data they need. Existing offer card components move with the cruzeiros sections rather than being duplicated.

## Data Flow

- State remains at the nearest existing owner; presentation components receive values and callbacks through typed props.
- No new global state, context, reducer, network call, or persistence layer is introduced.
- Leaflet resources are created and destroyed in the same effect lifecycle.
- `useEffectEvent` reads the latest pending-consumption callback while the pending message/prefill values remain the effects' reactive triggers.

## Error Handling

Existing chat, lead submission, map guard, and form validation behavior remains unchanged. The refactor adds no new error states. Leaflet cleanup must tolerate partial initialization and repeated unmount cleanup through null checks and idempotent teardown APIs.

## Verification

The baseline React Doctor scan is the failing red check for the requested structural and lifecycle rules. Verification proceeds in focused batches:

1. Implement explicit Leaflet cleanup and the Effect Event fix, then run changed-file typecheck/lint and focused tests.
2. Extract the five giant components, then run their existing chat/search/landing tests.
3. Run the repository completion gates: `pnpm test:regression`, `pnpm typecheck`, `pnpm lint:changed`, and `pnpm run build`.
4. Run relevant Playwright suites for chat/search, consultoria, cruzeiros, and landing navigation.
5. Run `npx react-doctor@latest --verbose` and confirm all eight requested occurrences are absent while unrelated findings remain untouched.

## Out of Scope

- The remaining 21 findings in the current 29-finding scan
- Copy, visual design, CRO, SEO, or analytics changes
- Dependency cleanup
- React Doctor suppression or false-positive configuration
- Opening or merging a pull request
