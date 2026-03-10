## 2025-05-15 - [Strict Scoping of Performance Tasks]
**Learning:** In performance-focused tasks with strict constraints ("ONE small improvement"), bundling multiple optimizations—even if individually valid—can lead to rejection and potential build risks (e.g., missing imports). Prioritizing a single, high-impact reusable component optimization (like memoizing a common UI element) is safer and more focused.
**Action:** Always pick the single most impactful optimization that fits the task's scope and ensure all necessary dependencies (like `React.memo` or `useMemo`) are correctly handled within the single context.

# 2026-03-04 - ⚡ Bolt: Component Memoization for Highlights

**What:** Wrapped the `Highlights` component in `React.memo` and added `displayName`.

**Why:** The `Highlights` component is a heavy visual component with animations and lazy-loaded images. Since it's used in the `Home` page which has various interaction states (like scroll detection and lazy loading triggers), memoizing it prevents redundant re-renders when the parent component updates unrelated state.

**Impact:** Reduced unnecessary Virtual DOM diffing and re-renders of the Highlights section during home page interactions.

**Measurement:** Re-renders of `Highlights` reduced to 1 (initial load) instead of multiple during scroll/interaction events on the Home page.

## 2026-03-05 - ⚡ Bolt: CSS-based Hover States
**Learning:** React state-driven hover effects (`onMouseEnter/Leave`) can cause excessive re-renders in large lists or grids. Replacing them with CSS `group-hover` eliminates JavaScript execution and Virtual DOM diffing during high-frequency interactions.
**Action:** Always check if a hover effect can be achieved via CSS before reaching for `useState`.
