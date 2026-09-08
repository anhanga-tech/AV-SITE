# Home hero posters — issue #1601

## Decision

Keep `HERO_VIDEOS[0]` (Rio) throughout the hero lifecycle. There is no poster
rotation or mount-time randomization. This keeps the SSR image, hydrated image
and home-only responsive preload aligned without new media calls.

Desktop video retains its existing activation: first scroll, pointerdown or
keydown, or the six-second fallback. Mobile (up to 1023px), reduced motion and
save-data continue to show the static image even after interaction or timeout.

## Published baseline, before implementation

Measured on 2026-09-08 at https://anhanga.tur.br with a fresh Chromium context,
412×823 viewport, DPR 1.75, `Math.random = () => 0.99`, essential consent and
tracking requests blocked. Observed navigation through network idle plus seven
seconds. These are response body bytes, excluding headers; this is a media
request measurement, not a Lighthouse/LCP benchmark. No CPU/network throttling
was applied, so do not compare timing with the Lighthouse figures in the issue.

| Poster (960×540 WebP preset) | Requests | Body bytes |
| --- | ---: | ---: |
| Rio | 1 | 90,234 |
| Natureza (forced alternate selection) | 1 | 158,420 |
| Total | 2 | 248,654 |

## Automated coverage

`tests/e2e/hero-media.spec.ts` forces the same alternate random value and checks
one initial poster request, matching preload/image srcset and sizes, and no
hydration errors. It covers mobile, desktop interaction, desktop timeout,
reduced motion and save-data. CDN responses are fulfilled locally to avoid
network dependency and recurring media costs in CI.

Run against prerendered output to exercise hydration:

```sh
VITE_MEDIA_ENABLE_TRANSFORMS=true pnpm build
pnpm exec playwright test --config playwright.prerender.config.ts tests/e2e/hero-media.spec.ts --project=chromium --workers=1
```

The prerender CI build enables image transformations to match production. Local
builds without `VITE_MEDIA_ENABLE_TRANSFORMS=true` use original images, while the
existing static preload uses transformed URLs; that separate configuration
mismatch is not a valid reproduction of the production poster-rotation baseline.

## Corrected build measurement

Repeated the same fresh-context measurement against the local production build
with transformations enabled, using the real CDN and identical viewport, DPR,
random value and observation window. Only the 960×540 Rio WebP was requested:
90,234 body bytes, HTTP 200.

- Poster requests: **2 → 1** (−50%).
- Poster body bytes: **248,654 → 90,234** (−158,420 bytes, −63.7%).
- The percentage depends on the alternate poster; this run forced Natureza.
- No LCP improvement is claimed from this measurement.

Validation: production build and typecheck passed; 1,156 regression tests
passed; five hero Chromium tests passed; React Doctor reported 100/100 for the
changed component. Targeted ESLint and `git diff --check` passed.
