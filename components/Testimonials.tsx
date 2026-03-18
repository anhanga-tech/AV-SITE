import React, { useCallback, useEffect, useState } from 'react';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Quote from 'lucide-react/dist/esm/icons/quote';
import MessageSquareHeart from 'lucide-react/dist/esm/icons/message-square-heart';
import type { HomeTestimonialsViewModel } from '../types/googleReviews';

interface TestimonialsProps {
  model: HomeTestimonialsViewModel;
}

interface TestimonialSlide {
  id: string;
  name: string;
  destination: string;
  text: string;
  image: string;
  date: string;
  rating?: number;
  reviewUrl?: string;
}

const CARD_ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1'];

const getRotationClass = (index: number): string =>
  CARD_ROTATIONS[index % CARD_ROTATIONS.length];

const Testimonials: React.FC<TestimonialsProps> = ({ model }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides: TestimonialSlide[] = model.mode === 'real'
    ? model.displayedReviews.map((review) => ({
        id: review.id,
        name: review.authorName,
        destination: review.destinationLabel,
        text: review.text,
        image: review.avatarUrl,
        date: review.publishedAt,
        rating: review.rating,
        reviewUrl: review.reviewUrl,
      }))
    : model.stories.map((story) => ({
        id: story.id,
        name: story.name,
        destination: story.destination,
        text: story.text,
        image: story.avatarUrl,
        date: story.publishedAt,
      }));

  const nextSlide = useCallback(() => {
    if (slides.length === 0) {
      return;
    }

    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) {
      return;
    }

    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(nextSlide, 6000);
    return () => window.clearInterval(interval);
  }, [nextSlide, slides.length]);

  useEffect(() => {
    if (currentIndex < slides.length) {
      return;
    }

    setCurrentIndex(0);
  }, [currentIndex, slides.length]);

  return (
    <section
      id="depoimentos"
      data-review-mode={model.mode}
      data-review-source={model.source}
      className="py-24 bg-brand-light overflow-hidden relative"
    >
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-light text-brand-dark font-black text-xs uppercase tracking-widest shadow-sm mb-4">
            <MessageSquareHeart className="w-4 h-4 text-red-500 fill-red-500" />
            Love Notes
          </div>
          <h2 className="text-4xl font-black text-brand-dark">Mural do Amor ❤️</h2>
          <p className="mt-3 text-gray-500 text-base">Depoimentos reais de quem viajou com a gente</p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="overflow-hidden py-4 px-2">
            <div
              className="flex transition-transform duration-700 ease-in-out will-change-transform"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((testimonial, index) => {
                const isRealReview = model.mode === 'real';

                return (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-2 md:px-12">
                    <div
                      className="relative"
                      data-review-card-id={isRealReview ? testimonial.id : undefined}
                      itemScope={isRealReview || undefined}
                      itemType={isRealReview ? 'https://schema.org/Review' : undefined}
                    >
                      {isRealReview ? (
                        <>
                          <div itemProp="itemReviewed" itemScope itemType="https://schema.org/LocalBusiness">
                            <meta itemProp="name" content="Anhangá Viagens" />
                            <meta itemProp="image" content="https://www.anhanga.tur.br/logo.png" />
                            <meta itemProp="telephone" content="+551152833309" />
                            <meta itemProp="address" content="Av. Dom Pedro I, 773, São Paulo, SP" />
                          </div>
                          <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                            <meta itemProp="ratingValue" content={String(testimonial.rating ?? 5)} />
                            <meta itemProp="bestRating" content={String(model.aggregateRating.bestRating)} />
                            <meta itemProp="worstRating" content={String(model.aggregateRating.worstRating)} />
                          </div>
                          <meta itemProp="datePublished" content={testimonial.date} />
                          {testimonial.reviewUrl ? <meta itemProp="url" content={testimonial.reviewUrl} /> : null}
                        </>
                      ) : null}

                      <div
                        className={`
                          bg-white rounded-[3rem] p-8 md:p-12 shadow-[10px_10px_0px_rgba(0,0,0,0.05)] border-4 border-white
                          flex flex-col md:flex-row items-center gap-8 relative z-10 transform ${getRotationClass(index)}
                          transition-transform duration-500 hover:rotate-0 hover:scale-[1.01]
                        `}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 shadow-sm z-20 border border-red-600"></div>

                        <div className="relative shrink-0">
                          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white animate-float">
                            <img
                              src={testimonial.image}
                              alt={testimonial.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div
                            className="absolute -bottom-2 -right-2 bg-yellow-300 text-yellow-900 text-xs font-black px-3 py-1 rounded-full shadow-sm -rotate-6 z-20"
                            title={isRealReview
                              ? 'Depoimento importado do snapshot validado de reviews da Home'
                              : 'Depoimento selecionado pela equipe Anhangá Viagens'}
                          >
                            ✓ Cliente Real
                          </div>
                        </div>

                        <div className="text-center md:text-left">
                          <Quote className="w-10 h-10 text-brand-cyan/20 mx-auto md:mx-0 mb-4 fill-current" />
                          <p
                            itemProp={isRealReview ? 'reviewBody' : undefined}
                            className="text-xl md:text-2xl font-bold text-gray-700 leading-snug mb-6 font-serif italic"
                          >
                            "{testimonial.text}"
                          </p>
                          <div>
                            {isRealReview ? (
                              <h4
                                itemProp="author"
                                itemScope
                                itemType="https://schema.org/Person"
                                className="font-black text-lg text-brand-dark uppercase tracking-wide"
                              >
                                <span itemProp="name">{testimonial.name}</span>
                              </h4>
                            ) : (
                              <h4 className="font-black text-lg text-brand-dark uppercase tracking-wide">
                                {testimonial.name}
                              </h4>
                            )}
                            <span className="text-brand-cyan font-bold text-sm">
                              Viajou para{' '}
                              {isRealReview ? (
                                <span itemProp="keywords">{testimonial.destination}</span>
                              ) : (
                                testimonial.destination
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-brand-cyan/10 rounded-[3rem] transform rotate-2 z-0 scale-95 translate-y-4"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="w-12 h-12 bg-white border-2 border-white/50 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform text-brand-cyan hover:bg-brand-cyan hover:text-white z-20"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2 items-center z-20">
              {slides.map((testimonial, index) => (
                <button
                  key={testimonial.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-brand-cyan w-8' : 'bg-brand-cyan/20 w-2 hover:bg-brand-cyan/40'}`}
                  aria-label={`Ir para depoimento ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={nextSlide}
              className="w-12 h-12 bg-white border-2 border-white/50 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform text-brand-cyan hover:bg-brand-cyan hover:text-white z-20"
              aria-label="Próximo depoimento"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
