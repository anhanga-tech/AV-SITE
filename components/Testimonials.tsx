import React from 'react';
import Quote from 'lucide-react/dist/esm/icons/quote';
import MessageSquareHeart from 'lucide-react/dist/esm/icons/message-square-heart';
import type { HomeTestimonialsViewModel } from '../types/googleReviews';

interface TestimonialsProps {
    model: HomeTestimonialsViewModel;
}

const formatDate = (value: string): string =>
    new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));

const renderStars = (rating: number) => '★'.repeat(Math.round(rating)).padEnd(5, '☆');

const Testimonials: React.FC<TestimonialsProps> = ({ model }) => {
    return (
        <section
            id="depoimentos"
            data-review-mode={model.mode}
            data-review-source={model.mode === 'real' ? model.source : model.source}
            className="py-24 bg-brand-light overflow-hidden relative"
        >
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-light text-brand-dark font-black text-xs uppercase tracking-widest shadow-sm mb-4">
                        <MessageSquareHeart className="w-4 h-4 text-red-500 fill-red-500" />
                        {model.mode === 'real' ? 'Avaliações no Google' : 'Histórias selecionadas'}
                    </div>
                    <h2 className="text-4xl font-black text-brand-dark">
                        {model.mode === 'real' ? 'Quem viajou com a Anhangá recomenda' : 'Histórias de quem viajou com a gente'}
                    </h2>
                    {model.mode === 'real' ? (
                        <div className="mt-4 flex flex-col items-center gap-3">
                            <p className="text-gray-600 text-base max-w-2xl">
                                Reviews reais e visíveis no HTML inicial da Home, alinhadas com o schema da página.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                                <span className="rounded-full bg-white px-4 py-2 font-black text-brand-dark shadow-sm">
                                    {model.aggregateRating.ratingValue.toFixed(1)} / {model.aggregateRating.bestRating}
                                </span>
                                <span className="rounded-full bg-white px-4 py-2 font-semibold text-gray-600 shadow-sm">
                                    {model.aggregateRating.reviewCount} avaliações
                                </span>
                                <span className="rounded-full bg-white px-4 py-2 font-semibold text-gray-600 shadow-sm">
                                    Snapshot em {formatDate(model.fetchedAt)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-3 text-gray-500 text-base">
                            Uma seleção editorial da equipe enquanto o snapshot de reviews reais não está disponível.
                        </p>
                    )}
                </div>

                <div className="max-w-6xl mx-auto relative">
                    {model.mode === 'real' ? (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {model.displayedReviews.map((review) => (
                                <article
                                    key={review.id}
                                    data-review-card-id={review.id}
                                    className="bg-white rounded-[2.25rem] p-8 border-4 border-white shadow-[10px_10px_0px_rgba(0,0,0,0.05)] flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-brand-cyan/10 text-brand-cyan font-black text-lg flex items-center justify-center shrink-0">
                                            {review.initials}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-lg text-brand-dark truncate">{review.authorName}</h3>
                                            <p className="text-sm font-semibold text-gray-500">
                                                {formatDate(review.publishedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-brand-yellow tracking-[0.25em]" aria-label={`${review.rating} de 5 estrelas`}>
                                            {renderStars(review.rating)}
                                        </span>
                                        <span className="font-semibold text-gray-500">{review.rating.toFixed(0)}/5</span>
                                    </div>

                                    <div className="relative flex-1">
                                        <Quote className="w-10 h-10 text-brand-cyan/20 mb-4 fill-current" />
                                        <p className="text-lg font-bold text-gray-700 leading-relaxed font-serif italic">
                                            "{review.text}"
                                        </p>
                                    </div>

                                    {review.reviewUrl ? (
                                        <a
                                            href={review.reviewUrl}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="inline-flex items-center gap-2 text-sm font-black text-brand-cyan hover:text-brand-dark transition-colors"
                                        >
                                            Ver origem da avaliação
                                        </a>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-3">
                            {model.stories.map((story) => (
                                <article
                                    key={story.id}
                                    className="bg-white rounded-[2.25rem] p-8 border-4 border-white shadow-[10px_10px_0px_rgba(0,0,0,0.05)] flex flex-col gap-5"
                                >
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-cyan">
                                            Historia editorial
                                        </p>
                                        <h3 className="mt-3 font-black text-xl text-brand-dark">{story.name}</h3>
                                        <p className="text-sm font-semibold text-gray-500">Roteiro para {story.destination}</p>
                                    </div>

                                    <div className="relative flex-1">
                                        <Quote className="w-10 h-10 text-brand-cyan/20 mb-4 fill-current" />
                                        <p className="text-lg font-bold text-gray-700 leading-relaxed font-serif italic">
                                            "{story.text}"
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
