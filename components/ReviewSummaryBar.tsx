import React, { memo } from 'react';
import { GoogleIcon } from './ui/GoogleIcon';

interface ReviewSummaryBarProps {
  averageRating: number;
  totalReviews: number;
}

const STAR = '★';

/**
 * ReviewSummaryBar Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: Prevents unnecessary re-renders of the rating bar
 * when parent components (like Testimonials) update their state.
 */
export const ReviewSummaryBar: React.FC<ReviewSummaryBarProps> = memo(({
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
});

ReviewSummaryBar.displayName = 'ReviewSummaryBar';
