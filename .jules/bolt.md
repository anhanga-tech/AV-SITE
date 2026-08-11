## 2026-07-21 - ⚡ Bolt: Chatbot markdown re-parses on every composer keystroke
**Learning:** In the AI chat drawer the composer's `input` state lives in `AIChatPanel`, *above* the message list, and `ChatMessageList` is a plain (non-memoized) function component with unstable callback props (`handlePrepareLeadSubmitPayload`, `handleFinalizeLead`, inline `onSubmitMessage` arrow). So every keystroke re-rendered the whole list and re-ran `ReactMarkdown`'s remark→rehype parse for *every* prior model message — cost per keystroke grew linearly with conversation length. Wrapping the whole list in `React.memo` would NOT work (props change identity each render); the robust fix is to memoize the leaf that does the expensive work (`ModelMessageBody`, keyed on the immutable `text` string) and hoist the `components` object to a module constant so its identity stays stable.
**Action:** When a parent holds high-frequency state (text input) above an expensive read-only render subtree, don't try to memoize the whole subtree if its callback props are unstable — memoize the innermost expensive leaf on its primitive/immutable inputs instead, and hoist any config objects (ReactMarkdown `components`, etc.) to module scope so the memo isn't defeated by identity churn.

## 2026-07-14 - ⚡ Bolt: react-doctor CI check is a false-red (tool bug)
**Learning:** The `react-doctor` CI check fails on *every* PR with "Scan could not complete / react-doctor exited with status 0 before producing a JSON report" — the job log shows `ERROR_COUNT: 0`, `WARNING_COUNT: 0` and `SCAN_EXIT: 1`. This is a bug in the react-doctor 0.7.1 action (bumped in #1180), not a finding on the diff, and it does NOT block human merge (PR #1190 merged red on react-doctor). Re-running the failed job reproduces it identically.
**Action:** ~~When a Bolt PR shows red on `react-doctor`, treat it as a known tool bug.~~ **SUPERSEDED 2026-07-28 — do NOT apply this anymore.** On PR #1323 `react-doctor` ran green (status "Score: 100/100 · 0 errors · 0 warnings" + a "found no new issues" PR comment), so the 0.7.1 breakage is fixed. Treat any future `react-doctor` red as a real finding on the diff until proven otherwise; blanket-dismissing it now risks waving through a genuine failure.

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

## 2026-07-28 - ⚡ Bolt: optimizeRemoteImageUrl is expensive in prod — keep it out of render loops
**Learning:** `optimizeRemoteImageUrl` looks like cheap string concatenation but isn't: production sets `VITE_MEDIA_ENABLE_TRANSFORMS="true"` (wrangler.toml), which sends it down `getTransformSourcePath` → **two `new URL()` parses per call** plus preset selection and `/cdn-cgi/image/` rebuilding. The codebase already treats it as a module-load-time call (Categories, beto-carrero Attractions/Testimonials all hoist it into module consts). `BlogList` was the outlier: its grid is filtered by a search input, so it called it *inside* the render `.map()` — every keystroke re-derived image URLs (68 URL parses across 34 posts) plus `formatDate` regexes, `getBlogPostUrl`, `getCategoryColor` and AUTHORS lookups, all producing byte-identical strings.
**Action:** Treat `optimizeRemoteImageUrl` as module-load work, never per-render. When a list is filtered by high-frequency state, precompute a view-model array of the derived per-item values at module scope and build the search index over *that* (`buildBlogSearchIndex` is generic over `T extends SearchablePost`, so enriched objects drop straight in) — the filter then carries the precomputed fields for free.

## 2026-07-28 - ⚡ Bolt: e2e in the remote sandbox needs a chromium executablePath override
**Learning:** `pnpm test:e2e` fails in the Claude-Code-on-the-web container with "Executable doesn't exist at …/chromium_headless_shell-1228" — the repo's pinned Playwright wants build 1228 but the image only ships `/opt/pw-browsers/chromium` (build 1194). This is an environment mismatch, NOT a code failure, and `playwright install` is explicitly not to be run here. Separately, `tests/e2e/blog-historical-notice.spec.ts` times out at 30s in this sandbox **on clean `main` too**, and the same spec **passed in GitHub Actions** on the very commit that failed locally (PR #1323) — so it is a sandbox artifact (older chromium build), not a real failure.
**Action:** To run e2e here, write a throwaway config in the repo root (so `node_modules` resolution works — an absolute import from the scratchpad throws MODULE_NOT_FOUND) that spreads `./playwright.config` and sets `launchOptions.executablePath = '/opt/pw-browsers/chromium'`, run with `--config=`, then delete it plus `test-results/` before committing. Always re-run a suspicious e2e failure with the change stashed before treating it as a regression.

## 2026-08-04 - ⚡ Bolt: the Odoo submit path is a serial RPC chain — look there, not at React
**Learning:** Almost every prior Bolt entry is a React re-render win, but the biggest *user-waited* latency in this app is server-side: `sendToOdoo` (lib/odoo-submit-handler.ts) issues ~6 strictly sequential JSON-RPCs to Odoo Cloud (authenticate → partner search → partner write → campaign search → lead idempotency search → lead create) while the customer watches a spinner. Only `authenticate` is a true dependency — `resolveCampaignId` needs the session uid but never `partnerId`, so it was queueing behind the partner upsert for no reason. Two non-obvious details: (a) parallelizing an *enrichment* call means its `.catch()` must be attached **at promise creation**, not at the `await` — if `upsertPartner` throws first the `await` is skipped entirely and a rejection attached later would be unhandled (fatal-ish in Workers); (b) the saving is bounded by the *other* branch's length, so overlapping a 3-RPC campaign find-or-create with a 2-RPC partner upsert saves 2 round trips, not 3 — I initially wrote 3 in a comment and the benchmark corrected me.
**Action:** When hunting perf here, check `services/odoo.ts` + `lib/odoo-submit-handler.ts` for `await` chains before reaching for another `React.memo`. To measure, wrap `createOdooMock`'s fetch in a `setTimeout(200ms)` delay and time the handler end-to-end — it turns round-trip counts into wall-clock numbers you can put in the PR. To prove concurrency in a test, assert on `mock.calls` *ordering* (campaign `search_read` index < `res.partner` `create` index): it's deterministic under the mock and genuinely fails on the serial version.

## 2026-08-04 - ⚡ Bolt: on Workers, a parallelized enrichment promise may never finish
**Learning:** Reviewers on PR #1393 surfaced a runtime detail I'd missed when parallelizing the Odoo campaign lookup. When you fire an enrichment call alongside the main work and the main work throws first, the `await` on the enrichment promise is skipped — the promise is now "loose." On Cloudflare Workers that promise is not tied to `ctx.waitUntil` nor to the response path, so **the isolate can be torn down before it completes**. Practical consequence: the speculative side effect I documented as a trade-off (a stray `utm.campaign` row on a failed submit) may not actually happen much of the time. Direction matters — this makes the downside *less* likely, so it argued for no code change; but the same mechanism would silently drop work you actually depended on.
**Action:** When parallelizing in a Workers handler, classify the concurrent call first. Pure enrichment whose loss is acceptable → a loose promise with `.catch()` attached at creation is fine (and don't bother with `waitUntil`). Anything whose completion you rely on → it must be awaited on the response path or handed to `ctx.waitUntil`, or it can vanish on the failure path. Also: attach `.catch()` at creation, never at the await — otherwise the skipped-await case becomes an unhandled rejection.

## 2026-08-11 - ⚡ Bolt: Lollapalooza landing Navbar was the last unthrottled scroll listener
**Learning:** `Header` and `BackToTop` were already migrated to the shared `useScrolled` (rAF-throttled) hook, but the sibling landing page component `components/landings/lollapalooza/Navbar.tsx` had its own hand-rolled `useState`/`useEffect`/`addEventListener('scroll', ...)` that called `setScrolled` on every raw scroll event instead of at most once per animation frame — easy to miss because it lives in a `landings/` subtree, not near `Header`. Separately: `pnpm lint:changed` diffs `origin/main...HEAD` (committed history), so it reports "nothing to lint" for *uncommitted* working-tree changes even though CI's copy of the same command will catch them once pushed — running `npx eslint <changed-file>` directly is the right local substitute before committing.
**Action:** When sweeping for the unthrottled-scroll anti-pattern, grep all of `components/` (including `landings/*`) for `addEventListener('scroll'` — not just the obvious shared-chrome files — since standalone landing pages duplicate this pattern instead of reusing `useScrolled`. And don't trust a clean `pnpm lint:changed` run pre-commit as proof of no lint issues; it only sees committed diffs.
