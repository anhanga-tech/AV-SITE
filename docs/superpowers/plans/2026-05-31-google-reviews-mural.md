# Google Reviews → Mural do Amor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Google My Business reviews to the Testimonials carousel on the homepage, with automatic filtering (4-5 stars), blocklist moderation, profile photos on Cloudflare R2, and a polished UI aligned with the Anhangá design system.

**Architecture:** A build-time script (`scripts/fetch-google-reviews.ts`) calls the Outscraper API, filters/sanitizes reviews, uploads profile photos to R2, and outputs a static JSON. A data adapter (`data/reviewsAdapter.ts`) normalizes Google reviews and manual fallback testimonials into a shared `DisplayReview` type. The existing `Testimonials.tsx` carousel is evolved to consume this unified type, adding a summary bar, Google badge, real photos with initials fallback, and proper Schema.org `aggregateRating`.

**Tech Stack:** TypeScript, React 19, Tailwind CSS, Outscraper API, Cloudflare R2 (S3-compatible), `node:test`, Playwright

**Spec:** `docs/superpowers/specs/2026-05-31-google-reviews-mural-design.md`
**Mockup:** `.superpowers/brainstorm/21960-1780251604/carousel-polished.html`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `types/reviews.ts` | Shared types: `GoogleReview`, `GoogleReviewsData`, `DisplayReview`, `ReviewAnnotations`, `ReviewsBlocklist` |
| Create | `data/googleReviews.json` | Seed file (empty reviews array with placeholder metadata) |
| Create | `data/reviewsBlocklist.json` | Seed blocklist (empty) |
| Create | `data/reviewAnnotations.json` | Seed annotations (empty) |
| Create | `data/reviewsAdapter.ts` | Normalize both data sources → `DisplayReview[]`, compute relative dates |
| Create | `scripts/fetch-google-reviews.ts` | Outscraper fetch + filter + R2 upload + JSON output |
| Create | `components/ui/GoogleIcon.tsx` | Official Google "G" icon SVG component |
| Create | `components/ui/ReviewAvatar.tsx` | Photo with initials fallback |
| Create | `components/ReviewSummaryBar.tsx` | Rating + stars + count + Google icon |
| Modify | `components/Testimonials.tsx` | Consume `DisplayReview`, add summary bar, Google badge, polish |
| Modify | `pages/Home.tsx` | Pass `aggregateRating` to `ServiceSchema` from review data |
| Modify | `package.json` | Add `reviews:fetch` script |
| Modify | `.env.example` | Add Outscraper + R2 env vars |
| Create | `tests/reviews-adapter.test.ts` | Adapter unit tests |
| Create | `tests/fetch-google-reviews.test.ts` | Script logic unit tests |
| Create | `tests/e2e/testimonials-google.spec.ts` | Browser tests for avatar fallback, summary bar |

---

## Chunk 1: Types, Seed Data, and Adapter

### Task 1: Shared Types

**Files:**
- Create: `types/reviews.ts`

- [ ] **Step 1: Create types file**

```typescript
// types/reviews.ts

export interface GoogleReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
  photoUrl: string;
  destination?: string;
}

export interface GoogleReviewsData {
  placeId: string;
  averageRating: number;
  totalReviews: number;
  lastFetched: string;
  reviews: GoogleReview[];
}

export interface DisplayReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
  photoUrl: string | null;
  destination?: string;
  source: 'google' | 'manual';
}

export interface ReviewAnnotations {
  [reviewId: string]: {
    destination?: string;
  };
}

export interface ReviewsBlocklist {
  blockedIds: string[];
  lastUpdated: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -20`
Expected: no new errors from `types/reviews.ts`

- [ ] **Step 3: Commit**

```bash
git add types/reviews.ts
git commit -m "feat(reviews): add shared types for Google Reviews integration"
```

---

### Task 2: Seed Data Files

**Files:**
- Create: `data/googleReviews.json`
- Create: `data/reviewsBlocklist.json`
- Create: `data/reviewAnnotations.json`

- [ ] **Step 1: Create seed googleReviews.json**

```json
{
  "placeId": "",
  "averageRating": 0,
  "totalReviews": 0,
  "lastFetched": "",
  "reviews": []
}
```

- [ ] **Step 2: Create seed reviewsBlocklist.json**

```json
{
  "blockedIds": [],
  "lastUpdated": "2026-05-31"
}
```

- [ ] **Step 3: Create seed reviewAnnotations.json**

```json
{}
```

- [ ] **Step 4: Commit**

```bash
git add data/googleReviews.json data/reviewsBlocklist.json data/reviewAnnotations.json
git commit -m "feat(reviews): add seed data files for Google Reviews"
```

---

### Task 3: Reviews Adapter — Tests First

**Files:**
- Create: `tests/reviews-adapter.test.ts`

- [ ] **Step 1: Write adapter tests**

Tests to cover:
1. `googleToDisplayReviews` maps `GoogleReview[]` → `DisplayReview[]` with `source: 'google'`
2. `manualToDisplayReviews` maps `TestimonialItem[]` → `DisplayReview[]` with `source: 'manual'`
3. `getDisplayReviews` returns Google reviews when available
4. `getDisplayReviews` returns manual fallback when Google reviews array is empty
5. `getReviewSummary` returns `averageRating` and `totalReviews` from metadata (not computed from filtered array)
6. `formatRelativeDate` returns "há X meses" / "há X dias" for various date offsets
7. `getInitials` extracts correct initials: "Daryw M." → "DM", "Rafa & Gabi" → "RG", single name "Ana" → "A"

```typescript
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

// These will fail until the adapter is implemented
import {
  googleToDisplayReviews,
  manualToDisplayReviews,
  getDisplayReviews,
  getReviewSummary,
  formatRelativeDate,
  getInitials,
} from '../data/reviewsAdapter.ts';

import type { GoogleReviewsData } from '../types/reviews.ts';
import type { TestimonialItem } from '../data/testimonialsData.ts';

describe('reviewsAdapter', () => {
  const sampleGoogleData: GoogleReviewsData = {
    placeId: 'ChIJtest',
    averageRating: 4.9,
    totalReviews: 47,
    lastFetched: '2026-05-31T12:00:00Z',
    reviews: [
      {
        id: 'rev1',
        authorName: 'Maria S.',
        rating: 5,
        text: 'Excelente atendimento!',
        date: '2026-04-15',
        photoUrl: 'https://cdn.example.com/reviews/rev1.jpg',
        destination: 'Paris',
      },
    ],
  };

  const sampleManualItem: TestimonialItem = {
    name: 'Daryw M.',
    destination: 'Finlândia',
    text: 'Desde o primeiro contato, senti um acolhimento especial.',
    image: '/images/testimonials/daryw-m.svg',
    bg: 'bg-yellow-50',
    rotate: '-rotate-2',
    date: '2025-12-15',
    ratingValue: 5,
  };

  test('googleToDisplayReviews maps fields and sets source google', () => {
    const result = googleToDisplayReviews(sampleGoogleData.reviews);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'rev1');
    assert.equal(result[0].authorName, 'Maria S.');
    assert.equal(result[0].rating, 5);
    assert.equal(result[0].source, 'google');
    assert.equal(result[0].photoUrl, 'https://cdn.example.com/reviews/rev1.jpg');
    assert.equal(result[0].destination, 'Paris');
  });

  test('manualToDisplayReviews maps fields and sets source manual', () => {
    const result = manualToDisplayReviews([sampleManualItem]);
    assert.equal(result.length, 1);
    assert.equal(result[0].authorName, 'Daryw M.');
    assert.equal(result[0].source, 'manual');
    assert.equal(result[0].photoUrl, '/images/testimonials/daryw-m.svg');
    assert.equal(result[0].rating, 5);
    assert.equal(result[0].destination, 'Finlândia');
  });

  test('getDisplayReviews returns Google reviews when available', () => {
    const result = getDisplayReviews(sampleGoogleData);
    assert.equal(result[0].source, 'google');
  });

  test('getDisplayReviews returns manual fallback when Google is empty', () => {
    const emptyGoogle: GoogleReviewsData = {
      ...sampleGoogleData,
      reviews: [],
    };
    const result = getDisplayReviews(emptyGoogle);
    assert.ok(result.length > 0);
    assert.equal(result[0].source, 'manual');
  });

  test('getReviewSummary returns unfiltered metadata', () => {
    const summary = getReviewSummary(sampleGoogleData);
    assert.equal(summary.averageRating, 4.9);
    assert.equal(summary.totalReviews, 47);
  });

  test('getReviewSummary returns null when no Google data', () => {
    const empty: GoogleReviewsData = { ...sampleGoogleData, totalReviews: 0, reviews: [] };
    const summary = getReviewSummary(empty);
    assert.equal(summary, null);
  });

  test('getInitials handles first and last name', () => {
    assert.equal(getInitials('Daryw M.'), 'DM');
  });

  test('getInitials handles compound names', () => {
    assert.equal(getInitials('Rafa & Gabi'), 'RG');
  });

  test('getInitials handles single name', () => {
    assert.equal(getInitials('Ana'), 'A');
  });

  test('formatRelativeDate returns "hoje" for today', () => {
    const today = new Date().toISOString().split('T')[0];
    assert.equal(formatRelativeDate(today), 'hoje');
  });

  test('formatRelativeDate returns "há X meses" for past months', () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    const result = formatRelativeDate(d.toISOString().split('T')[0]);
    assert.match(result, /há [23] meses/);
  });

  test('formatRelativeDate returns "há 1 ano" for 12+ months', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    const result = formatRelativeDate(d.toISOString().split('T')[0]);
    assert.equal(result, 'há 1 ano');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test tests/reviews-adapter.test.ts 2>&1 | tail -5`
Expected: FAIL — module `data/reviewsAdapter.ts` not found

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/reviews-adapter.test.ts
git commit -m "test(reviews): add failing adapter tests for DisplayReview normalization"
```

---

### Task 4: Reviews Adapter — Implementation

**Files:**
- Create: `data/reviewsAdapter.ts`

- [ ] **Step 1: Implement the adapter**

```typescript
import type { GoogleReview, GoogleReviewsData, DisplayReview } from '../types/reviews.ts';
import type { TestimonialItem } from './testimonialsData.ts';
import { TESTIMONIALS } from './testimonialsData.ts';

export function googleToDisplayReviews(reviews: GoogleReview[]): DisplayReview[] {
  return reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    date: r.date,
    photoUrl: r.photoUrl || null,
    destination: r.destination,
    source: 'google' as const,
  }));
}

export function manualToDisplayReviews(items: TestimonialItem[]): DisplayReview[] {
  return items.map((t, i) => ({
    id: `manual-${i}`,
    authorName: t.name,
    rating: t.ratingValue,
    text: t.text,
    date: t.date,
    photoUrl: t.image || null,
    destination: t.destination,
    source: 'manual' as const,
  }));
}

export function getDisplayReviews(googleData: GoogleReviewsData): DisplayReview[] {
  if (googleData.reviews.length > 0) {
    return googleToDisplayReviews(googleData.reviews);
  }
  return manualToDisplayReviews(TESTIMONIALS);
}

export function getReviewSummary(
  googleData: GoogleReviewsData
): { averageRating: number; totalReviews: number } | null {
  if (googleData.totalReviews === 0) return null;
  return {
    averageRating: googleData.averageRating,
    totalReviews: googleData.totalReviews,
  };
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 30) return `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'há 1 mês';
  if (diffMonths < 12) return `há ${diffMonths} meses`;
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return 'há 1 ano';
  return `há ${diffYears} anos`;
}

export function getInitials(name: string): string {
  const parts = name
    .replace(/[&.]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `node --import tsx --test tests/reviews-adapter.test.ts 2>&1 | tail -10`
Expected: all tests PASS

- [ ] **Step 3: Run full regression**

Run: `pnpm test:regression 2>&1 | tail -5`
Expected: no regressions

- [ ] **Step 4: Commit**

```bash
git add data/reviewsAdapter.ts
git commit -m "feat(reviews): implement DisplayReview adapter with fallback and relative dates"
```

---

## Chunk 2: UI Components

### Task 5: Google Icon Component

**Files:**
- Create: `components/ui/GoogleIcon.tsx`

- [ ] **Step 1: Create GoogleIcon component**

Use the official Google "G" multicolored icon. Source the correct SVG paths from Google's brand guidelines. The mockup SVG is an approximation — replace with the official asset.

```typescript
import React from 'react';

interface GoogleIconProps {
  size?: number;
  className?: string;
}

export const GoogleIcon: React.FC<GoogleIconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    {/* Replace these paths with the official Google "G" icon SVG */}
    {/* Source: https://developers.google.com/identity/branding-guidelines */}
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -10`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/GoogleIcon.tsx
git commit -m "feat(reviews): add GoogleIcon SVG component"
```

---

### Task 6: ReviewAvatar Component

**Files:**
- Create: `components/ui/ReviewAvatar.tsx`

- [ ] **Step 1: Create ReviewAvatar component**

```tsx
import React, { useState } from 'react';
import { getInitials } from '../../data/reviewsAdapter';

interface ReviewAvatarProps {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
}

export const ReviewAvatar: React.FC<ReviewAvatarProps> = ({
  name,
  photoUrl,
  size = 88,
  className = '',
}) => {
  const [showFallback, setShowFallback] = useState(!photoUrl);
  const initials = getInitials(name);

  if (showFallback) {
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          fontSize: size * 0.35,
        }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl!}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      onError={() => setShowFallback(true)}
    />
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -10`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/ReviewAvatar.tsx
git commit -m "feat(reviews): add ReviewAvatar with photo + initials fallback"
```

---

### Task 7: ReviewSummaryBar Component

**Files:**
- Create: `components/ReviewSummaryBar.tsx`

- [ ] **Step 1: Create ReviewSummaryBar component**

```tsx
import React from 'react';
import { GoogleIcon } from './ui/GoogleIcon';

interface ReviewSummaryBarProps {
  averageRating: number;
  totalReviews: number;
}

const STAR = '★';

export const ReviewSummaryBar: React.FC<ReviewSummaryBarProps> = ({
  averageRating,
  totalReviews,
}) => {
  const fullStars = Math.round(averageRating);
  const stars = STAR.repeat(fullStars);

  return (
    <div className="flex items-center justify-center gap-3.5 bg-white rounded-2xl px-6 py-3.5 max-w-sm mx-auto mb-10 shadow-float">
      <GoogleIcon size={24} />
      <div className="w-px h-8 bg-gray-200 shrink-0" aria-hidden="true" />
      <span className="text-3xl font-black text-brand-dark leading-none font-display">
        {averageRating.toFixed(1)}
      </span>
      <div>
        <div className="text-brand-yellow text-base leading-none tracking-wider" aria-label={`${averageRating} de 5 estrelas`}>
          {stars}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 font-sans">
          <strong className="text-brand-dark">{totalReviews}</strong> avaliações no Google
        </p>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -10`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/ReviewSummaryBar.tsx
git commit -m "feat(reviews): add ReviewSummaryBar with rating, stars, and Google icon"
```

---

## Chunk 3: Testimonials Evolution and Schema

### Task 8: Evolve Testimonials.tsx

**Files:**
- Modify: `components/Testimonials.tsx`

This is the largest task. The existing component (175 lines) is rewritten to:
1. Import `getDisplayReviews`, `getReviewSummary`, `formatRelativeDate` from `data/reviewsAdapter`
2. Import `googleReviewsData` from `data/googleReviews.json`
3. Render `ReviewSummaryBar` when Google summary is available
4. Use `ReviewAvatar` for each slide instead of `LazyImage`
5. Show Google badge on avatar only when `source === 'google'`
6. Display stars from `rating` field and relative date from `formatRelativeDate`
7. Apply polish: `shadow-float`, 44px dot targets, spring transitions, `prefers-reduced-motion`
8. Keep: SectionHeader, auto-play 6s, pause on hover/focus, Schema.org microdata per review

- [ ] **Step 1: Read the current component and mockup for reference**

Read files:
- `components/Testimonials.tsx` (the current implementation)
- `.superpowers/brainstorm/21960-1780251604/carousel-polished.html` (the approved polished mockup — reference for CSS classes, spacing, shadow values, touch targets, and structural markup)

- [ ] **Step 2: Rewrite Testimonials.tsx**

Key changes vs current:
- Import `googleReviewsData` from `@/data/googleReviews.json`
- Replace `TESTIMONIALS` with `getDisplayReviews(googleReviewsData)` at module scope
- Add `ReviewSummaryBar` between `SectionHeader` and the carousel viewport
- Replace `LazyImage` avatar with `ReviewAvatar`
- Add `GoogleIcon` badge on avatar wrapper (only when `review.source === 'google'`)
- Stars: render `review.rating` stars instead of hardcoded 5
- Date: render `formatRelativeDate(review.date)` instead of nothing
- Meta line: stars + dot separator + relative date (see mockup `.author-meta` pattern)
- Card class: replace `shadow-[10px_10px_0px_rgba(0,0,0,0.05)]` with `shadow-float`
- Dots: wrap each `<button>` in a 44px touch target area, use `::after` pseudo for visual dot (or equivalent accessible pattern)
- Transitions: all `transition-*` use `ease-spring` (already defined in tailwind config as `cubic-bezier(0.16, 1, 0.3, 1)`)
- Avatar animation: add `motion-safe:animate-float` (only runs when reduced motion is not preferred)
- aria-label on all nav buttons and dots
- Remove `border-4 border-white` from card (per polish — shadow-float doesn't need a border)

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Start dev server and visually verify**

Run: `pnpm dev`

Check at `http://localhost:3000/#depoimentos`:
- Summary bar appears (if `googleReviews.json` has data) or is hidden (seed file is empty)
- Fallback manual testimonials render correctly with `source: 'manual'` (no Google badge)
- Carousel navigates, auto-plays, pauses on hover
- Mobile layout stacks avatar above text
- Dots are tappable (44px touch target)
- Reduced motion: avatar doesn't float

- [ ] **Step 5: Commit**

```bash
git add components/Testimonials.tsx
git commit -m "feat(reviews): evolve Testimonials carousel for Google Reviews with polish"
```

---

### Task 9: Wire aggregateRating in Home.tsx

**Files:**
- Modify: `pages/Home.tsx`

- [ ] **Step 1: Import review data and pass aggregateRating**

Add imports:
```typescript
import googleReviewsData from '../data/googleReviews.json';
import { getReviewSummary } from '../data/reviewsAdapter';
import type { GoogleReviewsData } from '../types/reviews';
```

Compute summary at module scope:
```typescript
const reviewSummary = getReviewSummary(googleReviewsData as GoogleReviewsData);
```

Find the `<ServiceSchema` usage and add the `aggregateRating` prop:
```tsx
<ServiceSchema
  // ... existing props ...
  aggregateRating={reviewSummary ? {
    ratingValue: reviewSummary.averageRating,
    reviewCount: reviewSummary.totalReviews,
  } : undefined}
/>
```

Remove the comment on line 10: `// aggregateRating was removed from ServiceSchema...`

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -10`
Expected: no errors

- [ ] **Step 3: Verify Schema.org output**

Start dev server, navigate to Home, view page source or inspect `<script type="application/ld+json">`. When `googleReviews.json` has `totalReviews: 0`, `aggregateRating` should be absent. When populated, it should show the unfiltered values.

- [ ] **Step 4: Commit**

```bash
git add pages/Home.tsx
git commit -m "feat(reviews): wire aggregateRating from Google Reviews into ServiceSchema"
```

---

## Chunk 4: Fetch Script

### Task 10: Fetch Script — Tests First

**Files:**
- Create: `tests/fetch-google-reviews.test.ts`

- [ ] **Step 1: Write fetch script tests**

Test the pure logic functions (extracted from the script), not the I/O:

```typescript
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

// Import pure logic functions from the script module
import {
  filterReviews,
  applyBlocklist,
  mergeAnnotations,
  sanitizeReviewText,
} from '../scripts/fetch-google-reviews.ts';

describe('fetch-google-reviews logic', () => {
  const rawReviews = [
    { id: '1', authorName: 'A', rating: 5, text: 'Great', date: '2026-01-01', photoUrl: '' },
    { id: '2', authorName: 'B', rating: 3, text: 'OK', date: '2026-01-02', photoUrl: '' },
    { id: '3', authorName: 'C', rating: 4, text: 'Good', date: '2026-01-03', photoUrl: '' },
    { id: '4', authorName: 'D', rating: 2, text: 'Bad', date: '2026-01-04', photoUrl: '' },
  ];

  test('filterReviews keeps only rating >= 4', () => {
    const result = filterReviews(rawReviews);
    assert.equal(result.length, 2);
    assert.ok(result.every((r) => r.rating >= 4));
  });

  test('applyBlocklist removes blocked IDs', () => {
    const filtered = filterReviews(rawReviews);
    const result = applyBlocklist(filtered, ['1']);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '3');
  });

  test('applyBlocklist with empty blocklist returns all', () => {
    const filtered = filterReviews(rawReviews);
    const result = applyBlocklist(filtered, []);
    assert.equal(result.length, 2);
  });

  test('mergeAnnotations adds destination from annotations', () => {
    const reviews = [{ id: '1', authorName: 'A', rating: 5, text: 'Great', date: '2026-01-01', photoUrl: '' }];
    const annotations = { '1': { destination: 'Paris' } };
    const result = mergeAnnotations(reviews, annotations);
    assert.equal(result[0].destination, 'Paris');
  });

  test('mergeAnnotations preserves reviews without annotations', () => {
    const reviews = [{ id: '2', authorName: 'B', rating: 5, text: 'Nice', date: '2026-01-01', photoUrl: '' }];
    const annotations = { '1': { destination: 'Paris' } };
    const result = mergeAnnotations(reviews, annotations);
    assert.equal(result[0].destination, undefined);
  });

  test('sanitizeReviewText encodes angle brackets and trims', () => {
    // sanitizeReviewText wraps cleanString from lib/lead-logic.ts
    // which trims, truncates at 10000 chars, and entity-encodes < >
    const result = sanitizeReviewText('  Hello <script>alert(1)</script>  ');
    assert.ok(!result.includes('<script>'));
    assert.ok(result.includes('&lt;script&gt;'));
    assert.ok(!result.startsWith(' '));
  });

  test('sanitizeReviewText handles empty input', () => {
    assert.equal(sanitizeReviewText(''), '');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test tests/fetch-google-reviews.test.ts 2>&1 | tail -5`
Expected: FAIL — module not found

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/fetch-google-reviews.test.ts
git commit -m "test(reviews): add failing tests for fetch script logic"
```

---

### Task 11: Fetch Script — Implementation

**Files:**
- Create: `scripts/fetch-google-reviews.ts`
- Modify: `package.json` (add `reviews:fetch` script)
- Modify: `.env.example` (add env var documentation)

- [ ] **Step 1: Implement fetch script with exported pure logic**

The script has two parts:
1. **Exported pure functions** (testable): `filterReviews`, `applyBlocklist`, `mergeAnnotations`, `sanitizeReviewText`
2. **Main orchestrator** (I/O, only runs when executed directly): reads env vars, calls Outscraper, processes photos via R2, writes JSON

For the pure functions, reuse `cleanString` from `lib/lead-logic.ts` for sanitization.

The main function:
1. Validate env vars (`OUTSCRAPER_API_KEY`, `GOOGLE_PLACE_ID`, R2 credentials)
2. Call Outscraper API: `GET https://api.app.outscraper.com/maps/reviews-v3?query=${GOOGLE_PLACE_ID}&reviewsLimit=100&sort=newest&language=pt`
3. Extract `averageRating` and `totalReviews` from the **place-level metadata** in the Outscraper response (fields `rating` and `reviews` on the place object). These are the unfiltered totals from Google and must NOT be recomputed from the filtered reviews array. This distinction is critical for Schema.org compliance.
4. Run `filterReviews` → `applyBlocklist` → `mergeAnnotations` → `sanitizeReviewText` on each review
5. For each review with a profile photo URL: download and upload to R2 at `reviews/{id}.jpg`
6. Write `data/googleReviews.json` with place-level `averageRating`/`totalReviews` (unfiltered) and `reviews` array (filtered)
7. Log summary: `{ found, filtered, blocked, photosUploaded }`

R2 upload uses `@aws-sdk/client-s3` (S3-compatible API).

- [ ] **Step 2: Run tests to verify they pass**

Run: `node --import tsx --test tests/fetch-google-reviews.test.ts 2>&1 | tail -10`
Expected: all pure logic tests PASS

- [ ] **Step 3: Add npm script to package.json**

Add to `"scripts"`:
```json
"reviews:fetch": "tsx scripts/fetch-google-reviews.ts"
```

- [ ] **Step 4: Add env vars to .env.example**

Append:
```bash
# =============================================================================
# OPTIONAL - Google Reviews (Outscraper + Cloudflare R2)
# =============================================================================
# OUTSCRAPER_API_KEY=your_outscraper_api_key
# GOOGLE_PLACE_ID=your_google_place_id
# R2_ACCESS_KEY_ID=your_r2_access_key
# R2_SECRET_ACCESS_KEY=your_r2_secret_key
# R2_BUCKET_NAME=your_bucket_name
# R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

- [ ] **Step 5: Run full regression**

Run: `pnpm test:regression 2>&1 | tail -5`
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add scripts/fetch-google-reviews.ts package.json .env.example
git commit -m "feat(reviews): implement fetch script with Outscraper API and R2 photo upload"
```

---

## Chunk 5: E2E Tests and Final Verification

### Task 12: E2E Playwright Tests

**Files:**
- Create: `tests/e2e/testimonials-google.spec.ts`

- [ ] **Step 1: Write E2E tests**

The E2E tests run against the dev server. Two strategies:

**Strategy A (seed file is empty — default state):**
- Fallback manual testimonials render correctly
- Summary bar is NOT present in the DOM
- Carousel navigation works (prev/next buttons, dots)
- No Google badge visible on avatars

**Strategy B (populated data — requires fixture):**
Before running these tests, the test setup writes a fixture `data/googleReviews.json` with sample data (2-3 reviews, one with a broken `photoUrl` to test fallback). After the test, restore the seed file. Use `test.before()` / `test.after()` hooks.

Test cases with fixture:
1. Summary bar renders with rating number, star characters, "avaliações" text
2. Google badge appears on avatar (check for `GoogleIcon` SVG or text "Google")
3. Avatar with broken `photoUrl` shows initials fallback (div with gradient background)
4. Stars reflect actual rating from data (not hardcoded 5)
5. Relative date text is present (e.g., matches `/há \d+ (dias|meses|ano)/`)

- [ ] **Step 2: Run E2E tests**

Run: `pnpm test:e2e -- --grep "testimonials" 2>&1 | tail -20`
Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/testimonials-google.spec.ts
git commit -m "test(reviews): add E2E tests for testimonials carousel and avatar fallback"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test:regression && pnpm exec tsc --noEmit`
Expected: all pass, no type errors

- [ ] **Step 2: Visual verification in browser**

Run: `pnpm dev`

Verify at `http://localhost:3000`:
1. "Mural do Amor" section shows manual fallback testimonials (since seed JSON is empty)
2. No summary bar appears (correct for empty data)
3. Carousel auto-plays, pauses on hover/focus
4. Mobile: avatar stacks above text, dots are tappable
5. Accessibility: tab through dots and nav buttons, check focus indicators
6. View source: no `aggregateRating` in Schema.org (correct for empty data)

- [ ] **Step 3: Test with populated data (manual smoke test)**

Temporarily edit `data/googleReviews.json` with sample data (use the test fixture from the adapter tests). Verify:
1. Summary bar appears with correct rating and count
2. Google badge shows on avatar
3. Stars reflect actual rating
4. Relative date renders
5. Schema.org `aggregateRating` appears in page source

Revert `googleReviews.json` to seed state after testing.

- [ ] **Step 4: Build verification**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds with no warnings related to reviews

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore(reviews): final cleanup after verification"
```

---

## Post-Implementation Checklist

- [ ] Verify R2 credentials exist in the build environment (pending from spec)
- [ ] Run `pnpm reviews:fetch` with real Outscraper API key to populate `googleReviews.json`
- [ ] Commit the populated JSON and verify the live site shows Google reviews
- [ ] Add the Google "G" official SVG asset (replace approximation in `GoogleIcon.tsx`)
- [ ] Add `.superpowers/` to `.gitignore` if not already there
