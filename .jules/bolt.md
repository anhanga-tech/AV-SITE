## 2025-05-15 - [Strict Scoping of Performance Tasks]
**Learning:** In performance-focused tasks with strict constraints ("ONE small improvement"), bundling multiple optimizations—even if individually valid—can lead to rejection and potential build risks (e.g., missing imports). Prioritizing a single, high-impact reusable component optimization (like memoizing a common UI element) is safer and more focused.
**Action:** Always pick the single most impactful optimization that fits the task's scope and ensure all necessary dependencies (like `React.memo` or `useMemo`) are correctly handled within the single context.

## 2026-03-05 - ⚡ Bolt: Search Form Interaction Optimization

**Learning:** Typing in a centralized search form with multiple input fields can trigger expensive re-renders across the entire form and its parent if callbacks aren't stabilized. `React.memo` alone is insufficient if the parent passes fresh function references on every keystroke.

**Action:** When optimizing form components, always use `useCallback` for event handlers alongside `React.memo` for sub-components to ensure that only the field being typed in re-renders.

## 2026-03-05 - ⚡ Bolt: CSS-based Hover States
**Learning:** React state-driven hover effects (`onMouseEnter/Leave`) can cause excessive re-renders in large lists or grids. Replacing them with CSS `group-hover` eliminates JavaScript execution and Virtual DOM diffing during high-frequency interactions.
**Action:** Always check if a hover effect can be achieved via CSS before reaching for `useState`.

## 2026-04-06 - ⚡ Bolt: Carousel Layout Stability
**Learning:** Using standard <img> tags in dynamic carousels like Testimonials without explicit width/height leads to Cumulative Layout Shift (CLS) as images load after the container renders. Wrapping in LazyImage with numeric dimensions ensures the aspect ratio is reserved.
**Action:** Always use LazyImage with explicit width and height for repeatable list/carousel items to ensure visual stability and CDN optimization.

## 2026-05-20 - ⚡ Bolt: Blog Component Optimization
**Learning:** The Blog component on the home page was using standard `<img>` tags and lacked memoization, causing Cumulative Layout Shift (CLS) and redundant re-renders when the parent home page state changed. Utilizing the internal `LazyImage` component with explicit dimensions (960x540 for featured, 640x480 for grid) not only stabilizes the layout but also leverages the built-in `optimizeRemoteImageUrl` for bandwidth efficiency.
**Action:** Ensure large content sections like Blog are wrapped in `React.memo` and use the project's `LazyImage` standard for all remote assets to maintain Core Web Vitals.
