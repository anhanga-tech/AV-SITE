## 2026-07-14 - ⚡ Bolt: react-doctor CI check is a false-red (tool bug)
**Learning:** The `react-doctor` CI check fails on *every* PR with "Scan could not complete / react-doctor exited with status 0 before producing a JSON report" — the job log shows `ERROR_COUNT: 0`, `WARNING_COUNT: 0` and `SCAN_EXIT: 1`. This is a bug in the react-doctor 0.7.1 action (bumped in #1180), not a finding on the diff, and it does NOT block human merge (PR #1190 merged red on react-doctor). Re-running the failed job reproduces it identically.
**Action:** When a Bolt PR shows red on `react-doctor`, don't investigate it as a code problem or try to fix it — confirm `ERROR_COUNT`/`WARNING_COUNT` are 0 in the job log, flag it once to the user as a known tool bug needing a CI/deps decision, and leave workflows/deps untouched (out of scope for a perf PR).

## 2027-01-20 - ⚡ Bolt: Header Scroll Stabilization
**Learning:** Global components like the `Header` that listen to scroll events are high-frequency targets for optimization. Without stable function references and memoized sub-navigation components, every scroll tick triggers a full reconciliation of the entire navigation tree. Stabilizing the style object with `useMemo` and callbacks with `useCallback` ensures that the main thread remains free for smooth scrolling and interaction.
**Action:** Always memoize sub-components and stabilize callback references in global UI elements that react to high-frequency events like scrolling or window resizing.

## 2027-01-20 - ⚡ Bolt: Regression Test Side-Effects
**Learning:** In this codebase, running the full regression suite (`pnpm test:regression`) automatically triggers sitemap and blog manifest generation. This can introduce unintended changes to `public/sitemap.xml` and `data/blogManifest.ts` that appear as "hallucinated" content if not reverted.
**Action:** Always check and revert side-effects in `public/sitemap.xml` and `data/blogManifest.ts` after running the test suite, unless the task specifically involves content or SEO updates.

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

## 2026-06-12 - ⚡ Bolt: Home Page Section Memoization
**Learning:** Static-data sections like FAQ, Categories, and HowItWorks can still be forced to re-render when the parent page component (Home.tsx) updates its lifecycle states (e.g., intersection observer flags or interaction timeouts). Wrapping these in React.memo prevents unnecessary reconciliation and CPU cycles during the "below-the-fold" rendering phase.
**Action:** Always memoize large, data-driven Home page sections that don't depend on parent state to ensure smooth performance during deferred loading sequences.

## 2026-07-15 - ⚡ Bolt: Heavy Map Component Memoization
**Learning:** Components wrapping third-party libraries like Leaflet (e.g., `Destinations.tsx`) are particularly expensive to re-render because they often trigger full DOM reconciliation or re-initialization of the library's internal state. Even if the component appears "dynamic," if the underlying data (destinations list) is stable, `React.memo` provides a massive win by bypassing the entire JS execution for that branch.
**Action:** Prioritize memoization for components that bridge React with heavy non-React DOM libraries to prevent main-thread jank during parent state updates.

## 2026-08-20 - ⚡ Bolt: AIChat List Optimization
**Learning:** High-frequency components like Chat UI can suffer from quadratic complexity ((N^2)$) if logic like finding the "last" element of a specific type (e.g., `lastIndexOf`) is performed inside a `map` loop on every render.
**Action:** Always pre-calculate derived indices (like `lastModelIndex`) using `useMemo` outside the render loop to keep complexity at (N)$ and ensure smooth typing performance as history grows.

## 2026-10-10 - ⚡ Bolt: Hero and CTA Memoization
**Learning:** The "Hero" and "CallToAction" components are often the most complex above-the-fold and footer elements, respectively. On the homepage, they were being re-rendered when the `shouldRenderBelowFold` state was toggled, even though their content is static. Memoizing these "bookend" components ensures that the deferred loading of middle sections doesn't cause jank in the primary visual elements.
**Action:** Always memoize the Hero and main CTA components on the home page to preserve smooth scrolling and interaction when lazy-loaded sections (like Blog or Destinations) eventually mount.

## 2026-11-20 - ⚡ Bolt: Hero Search State Isolation
**Learning:** Storing character-by-character input state in a high-level component that contains heavy Framer Motion animations and background videos (like Hero.tsx) is a significant performance anti-pattern. Every keystroke triggers a full re-render of the animations and the video element, causing noticeable typing lag and high CPU/GPU usage on mobile devices.
**Action:** Always isolate high-frequency state (like text inputs) into dedicated, memoized sub-components to prevent parent components from re-rendering their expensive visual assets during interaction.

## 2026-12-10 - ⚡ Bolt: BackToTop Scroll Optimization
**Learning:** Implementing multiple independent, unthrottled scroll listeners for small floating UI elements (like BackToTop) is a common source of main-thread congestion. Reusing a centralized, throttled hook (like `useScrolled`) that uses `requestAnimationFrame` significantly reduces CPU overhead during fast scrolling and ensures UI updates stay synchronized with the browser's refresh rate.
**Action:** Always reuse existing throttled scroll hooks for any UI element that depends on scroll position to minimize the number of event listeners and prevent jank.

## 2026-12-15 - ⚡ Bolt: Carousel Sub-component Memoization
**Learning:** Sub-components of a stateful carousel (like SectionHeader or ReviewAvatar in the Testimonials section) can trigger redundant reconciliation on every slide transition if they aren't memoized or if they receive fresh JSX references as props. Since carousels often update automatically via timers, these unnecessary re-renders can lead to sustained background CPU usage.
**Action:** Always memoize presentation-heavy carousel sub-components using `React.memo` and stabilize JSX props by moving them to module-level constants outside the render loop.

## 2026-06-16 - ⚡ Bolt: Media Configuration Memoization
**Learning:** Utilities like `getMediaRuntimeConfig` that access environment variables (`import.meta.env`) and global browser state (`window.location`) can become significant overhead when called within high-frequency paths, such as `LazyImage` rendering or `srcset` generation in large lists. Since these values are effectively static during a session, redundant lookups and object allocations can be avoided entirely.
**Action:** Always memoize session-static configuration lookups that are used within the rendering loop of repeatable UI components.

## 2026-06-23 - ⚡ Bolt: LazyImage srcset fan-out
**Learning:** `LazyImage` is the single render hot path for nearly every image (lists, galleries, blog). It called `generateSrcSet` + `generateAvifSrcSet` + `generateWebpSrcSet` independently, and the AVIF/WebP generators each recomputed the *same* unformatted base URL per size to detect whether transforms applied — so the base URL was computed 3× per size (16 `optimizeImageUrl` calls/image). Production runs with `VITE_MEDIA_ENABLE_TRANSFORMS=true` (wrangler.toml), so this redundancy hit real users.
**Action:** When several derived outputs share a comparison baseline, compute the baseline once in a single-pass helper (`generateResponsiveSrcSets`) and keep the old functions as thin wrappers for API/test stability. Cut per-image work 16→10 calls (~37%).

## 2026-06-30 - ⚡ Bolt: Sort-Comparator Score Recomputation
**Learning:** `BlogPost.tsx` computed each related-post's relevance score *inside* the `.sort()` comparator. Since `sort` invokes the comparator O(n log n) times and each call scored both operands, every post's score was recomputed many times over — compounded by `post.tags.includes()` doing an O(t) array scan per tag. Hooks-after-early-return ruled out a `useMemo`, so the clean fix was algorithmic: precompute each score once (Schwartzian transform) + a `Set` for O(1) tag lookups. `Array.sort` is stable (ES2019+), so tie ordering stayed identical.
**Action:** When a sort key is expensive, map to `{item, key}` once and sort on the precomputed key — never recompute the key inside the comparator. Watch for early returns that block `useMemo` and prefer the algorithmic fix there.
