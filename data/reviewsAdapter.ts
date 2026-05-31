import type { GoogleReview, GoogleReviewsData, DisplayReview } from '../types/reviews';
import type { TestimonialItem } from './testimonialsData';
import { TESTIMONIALS } from './testimonialsData';

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
