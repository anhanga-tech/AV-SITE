# Third-Party Script Loading Decision

## Issue

GitHub issue #413 asked for an investigation and controlled change for blocking scripts, especially GTM in the initial HTML. The risk was not just performance. Moving tracking carelessly can break campaign attribution, lead events, and conversion reporting.

**Superseded (01/09/2026):** GTM itself was removed entirely as part of the Stape → Cloudflare Zaraz migration (`docs/superpowers/plans/2026-09-01-zaraz-tag-migration.md`, Task 7) — Stape deactivated its own container on 2026-08-31 (free-tier limit), which is what triggered the migration. The render-path decision and measurement below describe the GTM-era architecture and are kept as historical record of the original issue. The lazy-load apparatus this doc describes (`loadAnalytics`/`triggerAnalytics`/interaction listeners/idle-callback fallback/absolute timeout) still exists in `index.html`, but today it only defers `/utm-tracking.js` — there is no GTM script left to queue. Zaraz's own script is injected by Cloudflare directly (not through this apparatus) and has a different loading/performance profile that this doc does not cover.

## Inventory (as of the original GTM-era decision)

| Script | Previous load path | Current load path | Decision |
| --- | --- | --- | --- |
| Google Tag Manager `GTM-T2KGS86G` | Inline bootstrap in `<head>`, then async external script | Deferred through the analytics loader (post-LCP) | Removed entirely (01/09/2026) — see superseded note above |
| `/utm-tracking.js` | Deferred by the analytics loader | Still deferred by the analytics loader | Keep, because WhatsApp attribution depends on it |
| HubSpot `js.hs-scripts.com/50895604.js` | Loaded after conversion intent, deep scroll, contact section proximity, or long dwell | Removed entirely — HubSpot decommissioned (set/2026) | N/A |
| Mautic `mkt.anhanga.tur.br/mtc.js` | Injected immediately from the end of `<body>` | Removed entirely — Mautic decommissioned (set/2026) | N/A |

## Objective Measurement

Static render-path measurement was taken against `index.html` before and after the original GTM change (predates the 01/09/2026 removal):

| Metric | Before | After |
| --- | ---: | ---: |
| `<head>` script tags | 1 | 0 |
| Third-party references in `<head>` | 1 | 0 |
| `<head>` HTML bytes | 4227 | 3702 |
| Bytes removed from `<head>` | - | 525 |

This does not replace a production Lighthouse or WebPageTest run. It proves the specific render-path regression from issue #413 was removed in source at the time, and was guarded by `tests/index-third-party-scripts.test.ts`. That guard now instead asserts GTM/Stape are absent entirely (see the test file).

Recommended production validation (post-Zaraz, replaces the old GTM Preview steps):

1. Run Lighthouse mobile before/after deploy on `/`, `/brazil-promotion-day`, and one campaign landing page.
2. Compare LCP, FCP, Total Blocking Time, and third-party transfer/task attribution.
3. In the Zaraz dashboard (Monitoring tab) or GA4/Meta Events Manager/TikTok Events Manager Test Events, confirm these events still arrive:
   - GA4 pageview + custom events (Zaraz "Track all pageviews"/"Track all other events")
   - `generate_lead` → Meta `Lead` (server-side, `Zaraz → Tools → Facebook Pixel → Custom actions`)
   - `generate_lead` → TikTok `SubmitForm` (server-side, `Zaraz → Tools → TikTok → Custom actions`)
   - `form_submission`

## Accepted Trade-Off (historical — GTM-era)

This section describes the trade-off accepted while GTM was still in use; it no longer applies now that GTM has been removed, but is kept for historical context on why the deferred-loading apparatus in `index.html` exists at all.

GTM no longer loaded at the first parser pass. That improved the initial rendering path, but analytics that depended on GTM started only after the first interaction, idle delay, or conversion-intent signal. The site kept (and still keeps) a synchronous `dataLayer` bootstrap before React so app events queue before any deferred script loads instead of being dropped — this remains true today for `/utm-tracking.js` and for Zaraz's Data Layer Compatibility Mode, which reads the same `dataLayer`.

The accepted risk was that a bounce with no interaction before the idle timer might be tracked later than before. That risk profile no longer applies to GTM specifically since it is gone; it may still apply to `/utm-tracking.js`, which uses the same deferred-loading path.
