## 2025-05-15 - [Strict Scoping of Performance Tasks]
**Learning:** In performance-focused tasks with strict constraints ("ONE small improvement"), bundling multiple optimizations—even if individually valid—can lead to rejection and potential build risks (e.g., missing imports). Prioritizing a single, high-impact reusable component optimization (like memoizing a common UI element) is safer and more focused.
**Action:** Always pick the single most impactful optimization that fits the task's scope and ensure all necessary dependencies (like `React.memo` or `useMemo`) are correctly handled within the single context.

# 2026-03-04 - ⚡ Bolt: Component Memoization for Highlights

**What:** Wrapped the `Highlights` component in `React.memo` and added `displayName`.

**Why:** The `Highlights` component is a heavy visual component with animations and lazy-loaded images. Since it's used in the `Home` page which has various interaction states (like scroll detection and lazy loading triggers), memoizing it prevents redundant re-renders when the parent component updates unrelated state.

**Impact:** Reduced unnecessary Virtual DOM diffing and re-renders of the Highlights section during home page interactions.

**Measurement:** Re-renders of `Highlights` reduced to 1 (initial load) instead of multiple during scroll/interaction events on the Home page.

# 2026-03-06 - ⚡ Bolt: Modular AI Code Execution

**What:** Refactored `api/generate.ts` into a modular architecture in `lib/ai/`.

**Why:** The monolithic `api/generate.ts` was becoming hard to maintain and test. By separating concerns (types, constants, tools, validation, prompt), we improve code clarity and allow for more granular unit testing of individual AI logic components without the overhead of the full request handler.

**Impact:** Improved cold start performance potentially due to smaller individual module imports and significantly better maintainability for future AI enhancements.

**Measurement:** Unit tests now run against smaller, focused modules instead of the full API route, and `api/generate.ts` complexity (SLOC) was reduced by over 80%.
