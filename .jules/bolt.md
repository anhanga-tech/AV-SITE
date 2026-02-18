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
