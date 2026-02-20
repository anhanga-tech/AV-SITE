import React, { useState, useEffect, useCallback } from 'react';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Quote from 'lucide-react/dist/esm/icons/quote';
import MessageSquareHeart from 'lucide-react/dist/esm/icons/message-square-heart';

const TESTIMONIALS = [
    {
        name: "Daryw M.",
        destination: "Finlândia",
        text: "Desde o primeiro contato, senti um acolhimento e atendimento diferente e especial.",
        image: "https://api.dicebear.com/9.x/adventurer/svg?seed=Daryw&backgroundColor=b6e3f4",
        bg: "bg-yellow-50",
        rotate: "-rotate-2",
        date: "2025-12-15"
    },
    {
        name: "Rafa & Gabi",
        destination: "Paraty",
        text: "Chegamos no hotel e havia uma surpresa. Atendimento impecável do início ao fim.",
        image: "https://api.dicebear.com/9.x/adventurer/svg?seed=CarlosFer&backgroundColor=ffdfbf",
        bg: "bg-blue-50",
        rotate: "rotate-1",
        date: "2025-11-20"
    },
    {
        name: "William S.",
        destination: "Alemanha",
        text: "Viajem mais tranquila da vida. Trens, hotéis, tudo organizado perfeitamente.",
        image: "https://api.dicebear.com/9.x/adventurer/svg?seed=Roberto&backgroundColor=c0aede",
        bg: "bg-emerald-50",
        rotate: "-rotate-1",
        date: "2025-10-10"
    }
];

const Testimonials: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
    }, []);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
    };

    useEffect(() => {
        const interval = setInterval(nextSlide, 6000); // Aumentei um pouco o tempo para leitura
        return () => clearInterval(interval);
    }, [nextSlide]);

    return (
        <section id="depoimentos" className="py-24 bg-brand-light overflow-hidden relative">

            {/* Background Decor */}

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-light text-brand-dark font-black text-xs uppercase tracking-widest shadow-sm mb-4">
                        <MessageSquareHeart className="w-4 h-4 text-red-500 fill-red-500" /> Love Notes
                    </div>
                    <h2 className="text-4xl font-black text-brand-dark">Mural do Amor ❤️</h2>
                </div>

                {/* Carousel Container */}
                <div className="max-w-4xl mx-auto relative">

                    {/* Viewport for Slides */}
                    <div className="overflow-hidden py-4 px-2"> {/* Padding prevent shadow clip */}
                        <div
                            className="flex transition-transform duration-700 ease-in-out will-change-transform"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {TESTIMONIALS.map((testimonial, index) => (
                                <div key={index} className="w-full flex-shrink-0 px-2 md:px-12">
                                    <div
                                        className="relative"
                                        itemScope
                                        itemType="https://schema.org/Review"
                                    >
                                        {/* Schema Hidden Data */}
                                        <div itemProp="itemReviewed" itemScope itemType="https://schema.org/LocalBusiness">
                                            <meta itemProp="name" content="Anhangá Viagens" />
                                            <meta itemProp="image" content="https://www.anhanga.tur.br/logo.png" />
                                            <meta itemProp="telephone" content="+551152833309" />
                                            <meta itemProp="address" content="Av. Dom Pedro I, 773, São Paulo, SP" />
                                        </div>
                                        <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                                            <meta itemProp="ratingValue" content="5" />
                                            <meta itemProp="bestRating" content="5" />
                                        </div>
                                        <meta itemProp="datePublished" content={testimonial.date} />

                                        {/* The Card - Looks like a pinned note */}
                                        <div className={`
                                    bg-white rounded-[3rem] p-8 md:p-12 shadow-[10px_10px_0px_rgba(0,0,0,0.05)] border-4 border-white
                                    flex flex-col md:flex-row items-center gap-8 relative z-10 transform ${testimonial.rotate}
                                    transition-transform duration-500 hover:rotate-0 hover:scale-[1.01]
                                `}>
                                            {/* Pin Graphic */}
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 shadow-sm z-20 border border-red-600"></div>

                                            {/* Animated Avatar Sticker */}
                                            <div className="relative shrink-0">
                                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white animate-float">
                                                    <img
                                                        src={testimonial.image}
                                                        alt={testimonial.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-yellow-300 text-yellow-900 text-xs font-black px-3 py-1 rounded-full shadow-sm -rotate-6 z-20">
                                                    Verificado
                                                </div>
                                            </div>

                                            {/* Text */}
                                            <div className="text-center md:text-left">
                                                <Quote className="w-10 h-10 text-brand-cyan/20 mx-auto md:mx-0 mb-4 fill-current" />
                                                <p itemProp="reviewBody" className="text-xl md:text-2xl font-bold text-gray-700 leading-snug mb-6 font-serif italic">
                                                    "{testimonial.text}"
                                                </p>
                                                <div>
                                                    <h4 itemProp="author" itemScope itemType="https://schema.org/Person" className="font-black text-lg text-brand-dark uppercase tracking-wide">
                                                        <span itemProp="name">{testimonial.name}</span>
                                                    </h4>
                                                    <span className="text-brand-cyan font-bold text-sm">
                                                        Viajou para <span itemProp="keywords">{testimonial.destination}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background Shadow Card for Depth (Moves with the slide now) */}
                                        <div className="absolute inset-0 bg-brand-cyan/10 rounded-[3rem] transform rotate-2 z-0 scale-95 translate-y-4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button onClick={prevSlide} className="w-12 h-12 bg-white border-2 border-white/50 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform text-brand-cyan hover:bg-brand-cyan hover:text-white z-20">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex gap-2 items-center z-20">
                            {TESTIMONIALS.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-brand-cyan w-8' : 'bg-brand-cyan/20 w-2 hover:bg-brand-cyan/40'}`}
                                    aria-label={`Ir para depoimento ${i + 1}`}
                                />
                            ))}
                        </div>
                        <button onClick={nextSlide} className="w-12 h-12 bg-white border-2 border-white/50 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform text-brand-cyan hover:bg-brand-cyan hover:text-white z-20">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Testimonials;
