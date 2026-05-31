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
