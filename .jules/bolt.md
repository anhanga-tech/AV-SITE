# Bolt's Journal - Critical Learnings

## 2025-05-14 - Initializing Journal
**Learning:** Starting my mission to optimize Anhangá Viagens.
**Action:** Follow the daily process: Profile, Select, Optimize, Verify, Present.

## 2025-05-14 - Search Optimization Impact
**Learning:** Pre-normalizing a dataset of ~100 items for string search (lowercase, accent removal) reduced computation time by ~90% (from 71ms to 7ms for 1000 iterations).
**Action:** Always pre-normalize static datasets used for frequent search operations instead of normalizing in the render/search loop.

## 2025-05-15 - Static Data and Image Optimization
**Learning:** Moving large static arrays (like the 20+ item destinations list) outside the component definition reduces memory allocation and garbage collection pressure. Centralizing image optimization within a `LazyImage` component ensures all assets are served in optimal formats and sizes across the application.
**Action:** Always move static configuration outside React components and use centralized asset optimization utilities to improve performance and CLS.

## 2025-05-16 - Logic and Memoization Refactoring
**Learning:** Pure utility functions and configuration arrays are frequently redefined inside component bodies in this codebase. Moving these outside, combined with `React.memo` for list items (like `FAQItem`), significantly stabilizes the component tree and reduces memory pressure. Always add `displayName` to memoized components for better DevTools visibility.
**Action:** Systematically check for and move non-reactive logic and data outside the render loop.

## 2025-05-22 - Randomization with Stable CWV
**Learning:** Using a lazy initializer in `useState` is an efficient way to pick a random item on component mount without causing re-renders or breaking the stable state during the component's lifecycle. This satisfies requirements for variety while keeping the background stable for the user session.
**Action:** Use `useState(() => pickRandom())` for initial random states that should not change until the next page load.

## 2025-05-24 - Scroll Listener Optimization with rAF and Passive: true
**Learning:** Unthrottled scroll listeners that update React state can block the main thread and cause layout thrashing. Using `requestAnimationFrame` for throttling and `{ passive: true }` for the event listener allows the browser to optimize scrolling independently of JavaScript execution, leading to smoother interactions.
**Action:** Always use `requestAnimationFrame` and `passive: true` for scroll-heavy interactions that update the UI state.
