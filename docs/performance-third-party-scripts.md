# Third-Party Script Loading Decision

## Issue

GitHub issue #413 asked for an investigation and controlled change for blocking scripts, especially GTM in the initial HTML. The risk was not just performance. Moving tracking carelessly can break campaign attribution, lead events, HubSpot form callbacks, and conversion reporting.

## Inventory

| Script | Previous load path | Current load path | Decision |
| --- | --- | --- | --- |
| Google Tag Manager `GTM-T2KGS86G` | Inline bootstrap in `<head>`, then async external script | `dataLayer` bootstrap before the React entrypoint; GTM external script after interaction, idle timeout, or conversion intent | Keep GTM, but remove it from the render-critical head path |
| `/utm-tracking.js` | Deferred by the analytics loader | Still deferred by the analytics loader, after GTM is queued | Keep, because WhatsApp attribution depends on it |
| HubSpot `js.hs-scripts.com/50895604.js` | Loaded after conversion intent, deep scroll, contact section proximity, or long dwell | Same | Keep delayed |
| Mautic `mkt.anhanga.tur.br/mtc.js` | Injected immediately from the end of `<body>` | Deferred through the analytics loader | Delay, because it is not required for first paint |

## Objective Measurement

Static render-path measurement was taken against `index.html` before and after the change:

| Metric | Before | After |
| --- | ---: | ---: |
| `<head>` script tags | 1 | 0 |
| Third-party references in `<head>` | 1 | 0 |
| `<head>` HTML bytes | 4227 | 3702 |
| Bytes removed from `<head>` | - | 525 |

This does not replace a production Lighthouse or WebPageTest run. It proves the specific render-path regression from the issue is removed in source and is guarded by `tests/index-third-party-scripts.test.ts`.

Recommended production validation:

1. Run Lighthouse mobile before/after deploy on `/`, `/brazil-promotion-day`, and one campaign landing page.
2. Compare LCP, FCP, Total Blocking Time, and third-party transfer/task attribution.
3. In GTM Preview, confirm these events still arrive after the lazy loader starts:
   - `gtm.js`
   - `whatsapp_cta_click`
   - `specialist_cta_click`
   - `generate_lead`
   - `form_submission`
4. In HubSpot, submit a test lead and confirm contact/deal attribution fields still receive UTM and click ID data.

## Accepted Trade-Off

GTM no longer loads at the first parser pass. That improves the initial rendering path, but analytics that depend on GTM may start after the first interaction, idle delay, or conversion-intent signal. This is intentional. The site keeps a synchronous `dataLayer` bootstrap before React so app events can queue before GTM loads instead of being dropped.

The accepted risk is that a bounce with no interaction before the idle timer may be tracked later than before. The better alternative is not putting GTM back in `<head>`; it is reducing the GTM container payload and auditing tags inside GTM Preview.
