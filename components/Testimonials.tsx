import React, { useState, useEffect, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, Quote, MessageSquareHeart } from 'lucide-react';
import { BRAND_LOGO_PNG_URL } from '../lib/media-assets';
import { SectionHeader } from './ui/SectionHeader';
import { ReviewAvatar } from './ui/ReviewAvatar';
import { GoogleIcon } from './ui/GoogleIcon';
import { ReviewSummaryBar } from './ReviewSummaryBar';
import { getDisplayReviews, getReviewSummary, formatRelativeDate } from '../data/reviewsAdapter';
import type { GoogleReviewsData } from '../types/reviews';
import googleReviewsRaw from '../data/googleReviews.json';

const googleReviewsData = googleReviewsRaw as GoogleReviewsData;
const reviews = getDisplayReviews(googleReviewsData);
const reviewSummary = getReviewSummary(googleReviewsData);

const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-2'];

const Testimonials: React.FC = memo(() => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isPaused || prefersReduced) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  return (
    <section
      id="depoimentos"
      className="py-24 bg-brand-light overflow-hidden relative"
      aria-roledescription="carousel"
      aria-label="Depoimentos de clientes"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          badge="Love Notes"
          badgeIcon={<MessageSquareHeart className="size-4 text-red-500 fill-red-500" />}
          title={<>Mural do Amor <span aria-hidden="true">❤️</span></>}
          subtitle="Depoimentos reais de quem viajou com a gente"
          className="mb-16"
        />

        {reviewSummary && (
          <ReviewSummaryBar
            averageRating={reviewSummary.averageRating}
            totalReviews={reviewSummary.totalReviews}
          />
        )}

        <div className="max-w-4xl mx-auto relative">
          <div className="overflow-hidden py-4 px-2" aria-live={isPaused ? 'polite' : 'off'} aria-atomic="false">
            <div
              className="flex transition-transform duration-700 ease-spring will-change-transform"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {reviews.map((review, i) => {
                const rotation = ROTATIONS[i % ROTATIONS.length];
                const stars = '★'.repeat(review.rating);

                return (
                  <div key={review.id} className="w-full flex-shrink-0 px-2 md:px-12">
                    <div
                      className="relative"
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div itemProp="itemReviewed" itemScope itemType="https://schema.org/LocalBusiness">
                        <meta itemProp="name" content="Anhangá Viagens" />
                        <meta itemProp="image" content={BRAND_LOGO_PNG_URL} />
                        <meta itemProp="telephone" content="+551152833309" />
                        <meta itemProp="address" content="Av. Dom Pedro I, 773, São Paulo, SP" />
                      </div>
                      <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                        <meta itemProp="ratingValue" content={String(review.rating)} />
                        <meta itemProp="bestRating" content="5" />
                      </div>
                      <meta itemProp="datePublished" content={review.date} />

                      <div className={`
                        bg-white rounded-[2.5rem] p-8 md:p-10 shadow-float
                        flex flex-col md:flex-row items-center gap-6 relative z-10
                        transform ${rotation}
                        transition-transform duration-500 ease-spring hover:rotate-0 hover:scale-[1.008]
                      `}>
                        {/* Pin */}
                        <div
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 size-3.5 rounded-full z-20"
                          style={{
                            background: 'radial-gradient(circle at 35% 35%, #fca5a5, #ef4444 60%, #b91c1c)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)',
                          }}
                        />

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="rounded-full border-3 border-white shadow-lg overflow-hidden motion-safe:animate-float">
                            <ReviewAvatar
                              name={review.authorName}
                              photoUrl={review.photoUrl}
                              size={88}
                              className="md:size-[88px] size-[76px]"
                            />
                          </div>
                          {review.source === 'google' && (
                            <div className="absolute -bottom-1 -right-1.5 flex items-center gap-0.5 bg-white text-brand-dark text-[0.6rem] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-10 leading-none">
                              <GoogleIcon size={12} />
                              <span>Google</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="text-center md:text-left flex-1 min-w-0">
                          <h4
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            className="font-black text-sm text-brand-dark uppercase tracking-wide leading-none"
                          >
                            <span itemProp="name">{review.authorName}</span>
                          </h4>

                          <div className="flex items-center gap-2 mt-1.5 mb-4 justify-center md:justify-start">
                            <span className="text-brand-yellow text-sm leading-none tracking-widest" aria-label={`${review.rating} de 5 estrelas`}>
                              {stars}
                            </span>
                            <span className="size-[3px] rounded-full bg-slate-300 shrink-0" aria-hidden="true" />
                            <span className="text-[0.7rem] text-gray-500 font-sans leading-none">
                              {formatRelativeDate(review.date)}
                            </span>
                          </div>

                          <Quote className="size-7 text-brand-cyan/20 mx-auto md:mx-0 mb-1.5 fill-current" />
                          <p
                            itemProp="reviewBody"
                            className="text-lg md:text-xl font-bold text-zinc-600 leading-relaxed mb-3 font-serif italic"
                            style={{ textWrap: 'pretty' }}
                          >
                            &ldquo;{review.text}&rdquo;
                          </p>
                          {review.destination && (
                            <span className="text-brand-cyan font-semibold text-sm">
                              Viajou para <span itemProp="keywords">{review.destination}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Depth shadow card */}
                      <div className="absolute inset-0 bg-brand-cyan/5 rounded-[2.5rem] transform rotate-[2.5deg] scale-[0.96] translate-y-3 z-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              type="button"
              onClick={prevSlide}
              className="size-11 bg-white rounded-full flex items-center justify-center shadow-md text-brand-cyan transition-all duration-300 ease-spring hover:bg-brand-cyan hover:text-white hover:shadow-[0_4px_16px_rgba(14,165,233,0.25)] hover:scale-[1.08]"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="size-[18px]" />
            </button>
            <div className="flex gap-0.5 items-center">
              {reviews.map((r, i) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setCurrentIndex(i)}
                  className="size-11 flex items-center justify-center"
                  aria-label={`Ir para depoimento ${i + 1} de ${reviews.length}`}
                  aria-current={i === currentIndex ? 'true' : undefined}
                >
                  <span
                    className={`block h-[3px] rounded-full transition-all duration-300 ease-spring ${
                      i === currentIndex
                        ? 'bg-brand-cyan w-6'
                        : 'bg-brand-cyan/20 w-2 hover:bg-brand-cyan/40'
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={nextSlide}
              className="size-11 bg-white rounded-full flex items-center justify-center shadow-md text-brand-cyan transition-all duration-300 ease-spring hover:bg-brand-cyan hover:text-white hover:shadow-[0_4px_16px_rgba(14,165,233,0.25)] hover:scale-[1.08]"
              aria-label="Próximo depoimento"
            >
              <ChevronRight className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

Testimonials.displayName = 'Testimonials';

export default Testimonials;
