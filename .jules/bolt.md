# ⚡ Bolt Journal - 2024-03-04

## Optimization: Internal Linking and Navigation

### What
Updated hardcoded `<a>` tags to React Router `<Link>` components across the homepage (`Categories.tsx`, `Destinations.tsx`) and SiteMap. Added a "Voltar para o site principal" breadcrumb-style link to landing pages.

### Why
To eliminate "orphan pages" identified by SEO audits (Ahrefs) and improve crawlability/link equity. Using `<Link>` prevents full page reloads, improving the user experience during SPA navigation.

### Impact
- Improved SEO: All landing pages now have multiple internal links pointing to them.
- Better UX: Client-side navigation between landings and the main site is now seamless.
- Reduced Crawl Budget waste: Eliminated unnecessary page reloads for internal site navigation.

### Measurement
Verified via Playwright smoke tests and manual inspection of the built assets. `pnpm build` confirmed no broken imports or syntax errors.
