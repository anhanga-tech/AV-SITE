export interface GoogleAggregateRating {
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
}

export interface GoogleBusinessReview {
  id: string;
  authorName: string;
  text: string;
  rating: number;
  publishedAt: string;
  destination?: string;
  profilePhotoUrl?: string;
  reviewUrl?: string;
}

export interface GoogleBusinessReviewsSnapshotV1 {
  schemaVersion: 1;
  source: string;
  fetchedAt: string;
  aggregateRating: GoogleAggregateRating;
  reviews: GoogleBusinessReview[];
}

export interface HomeRealReview extends GoogleBusinessReview {
  initials: string;
  destinationLabel: string;
  avatarUrl: string;
}

export interface HomeFallbackStory {
  id: string;
  name: string;
  destination: string;
  text: string;
  avatarUrl: string;
  publishedAt: string;
}

export interface ValidRealSnapshotResult {
  kind: 'valid-real-snapshot';
  snapshot: GoogleBusinessReviewsSnapshotV1;
  aggregateRating: GoogleAggregateRating;
  displayedReviews: HomeRealReview[];
}

export interface InvalidSnapshotResult {
  kind: 'invalid-snapshot';
  errors: string[];
}

export interface EmptySnapshotResult {
  kind: 'empty-snapshot';
  errors: string[];
}

export type ParsedGoogleReviewsSnapshot =
  | ValidRealSnapshotResult
  | InvalidSnapshotResult
  | EmptySnapshotResult;

export interface HomeRealTestimonialsViewModel {
  mode: 'real';
  source: string;
  fetchedAt: string;
  aggregateRating: GoogleAggregateRating;
  displayedReviews: HomeRealReview[];
}

export interface HomeFallbackTestimonialsViewModel {
  mode: 'fallback';
  source: 'editorial-fallback';
  stories: HomeFallbackStory[];
}

export type HomeTestimonialsViewModel =
  | HomeRealTestimonialsViewModel
  | HomeFallbackTestimonialsViewModel;
