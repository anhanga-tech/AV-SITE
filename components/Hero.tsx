import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Headphones, BadgeDollarSign } from 'lucide-react';
import HeroChatCard from './HeroChatCard';
import { HERO_VIDEOS, optimizeRemoteImageUrl } from '../data/mediaConfig';

const QUICK_FEATURES = [
    { text: 'Roteiros Exclusivos', icon: Route },
    { text: 'Suporte 24/7', icon: Headphones },
    { text: 'Melhores Preços', icon: BadgeDollarSign },
];

const Hero: React.FC = () => {
    const [backgroundVideo] = useState(() => HERO_VIDEOS[0]);
    const [shouldRenderVideo, setShouldRenderVideo] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const optimizedPoster = useMemo(
        () => optimizeRemoteImageUrl(backgroundVideo.poster, 1280, 720),
        [backgroundVideo.poster],
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isSmallScreen = window.matchMedia('(max-width: 1023px)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const saveData = ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) === true;

        if (isSmallScreen || prefersReducedMotion || saveData) {
            return;
        }

        let cancelled = false;

        const enableVideo = () => {
            if (!cancelled) {
                setShouldRenderVideo(true);
            }
            cleanup();
        };

        const onIntent = () => enableVideo();
        const cleanup = () => {
            window.removeEventListener('scroll', onIntent);
            window.removeEventListener('pointerdown', onIntent);
            window.removeEventListener('keydown', onIntent);
        };

        window.addEventListener('scroll', onIntent, { passive: true, once: true });
        window.addEventListener('pointerdown', onIntent, { passive: true, once: true });
        window.addEventListener('keydown', onIntent, { passive: true, once: true });

        const timer = window.setTimeout(enableVideo, 6000);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (!shouldRenderVideo || !videoRef.current) return;

        videoRef.current.defaultMuted = true;
        videoRef.current.muted = true;

        const playPromise = videoRef.current.play();
        if (playPromise) {
            playPromise.catch((error) => {
                console.warn('Autoplay prevented or interrupted (safely handled):', error);
            });
        }
    }, [shouldRenderVideo]);

    return (
        <section id="hero-section" className="relative w-full min-h-[850px] flex items-center bg-brand-light pb-20 z-20">
            <div className="absolute inset-0 z-0 overflow-hidden">
                {!shouldRenderVideo && (
                    <img
                        src={optimizedPoster}
                        alt=""
                        aria-hidden="true"
                        fetchPriority="high"
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover"
                    />
                )}

                {shouldRenderVideo && (
                    <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="none"
                        poster={optimizedPoster}
                        className="w-full h-full object-cover"
                    >
                        <source src={backgroundVideo.url} type="video/mp4" />
                        Seu navegador não suporta vídeos.
                    </video>
                )}

                <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/80 to-blue-900/70 md:mix-blend-multiply" />
                <div className="hidden md:block absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <div className="container mx-auto px-6 relative z-10 pt-40 pb-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <h1 className="font-extrabold text-white mb-6 leading-[0.9] tracking-tight drop-shadow-lg text-5xl sm:text-6xl md:text-8xl">
                        Sua Próxima <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 relative inline-block pb-2">
                            Aventura
                            <svg
                                className="absolute w-full h-4 -bottom-0 left-0 text-yellow-400 overflow-visible"
                                viewBox="0 0 100 10"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d="M0 5 Q 50 15 100 5"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                    className="animate-draw"
                                    strokeDasharray="100"
                                    strokeDashoffset="100"
                                />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto mb-6 font-medium leading-relaxed drop-shadow-md">
                        Roteiros que parecem feitos à mão. <br />
                        Porque sua viagem merece ser única.
                    </p>

                    <HeroChatCard />

                    <div className="mt-6 flex flex-wrap justify-center gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        {QUICK_FEATURES.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.text}
                                    className="flex items-center gap-2 text-white/90 font-bold text-base bg-white/15 backdrop-blur-md border border-white/25 px-5 py-2.5 rounded-full hover:bg-white/25 transition-all duration-300 hover:scale-105 cursor-default"
                                >
                                    <Icon className="w-4 h-4 shrink-0 text-yellow-300" />
                                    {feature.text}
                                </div>
                            );
                        })}
                    </div>

                    <a
                        href="#destinos"
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('destinos')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-white/80 px-6 py-3 text-base font-bold text-white transition-all duration-300 hover:bg-white/20 hover:border-white focus:outline-none focus:ring-2 focus:ring-white/50 opacity-0 animate-fade-in-up"
                        style={{ animationDelay: '0.8s' }}
                    >
                        Ver Destinos
                    </a>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
                <svg
                    className="relative block w-[calc(100%+1.3px)] h-[60px]"
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        fill="#fffdf5"
                    />
                </svg>
            </div>
        </section>
    );
};

export default Hero;
