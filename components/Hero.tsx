import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { m } from 'framer-motion';
import { HERO_VIDEOS, optimizeRemoteImageUrl } from '../data/mediaConfig';
import { NOISE_TEXTURE_URL } from '../lib/static-assets';
import SearchForm from './SearchForm';
import MobileHeroForm from './MobileHeroForm';
import AIResearchBar from './AIResearchBar';

const noiseTextureStyle = {
  backgroundImage: `url("${NOISE_TEXTURE_URL}")`,
};

/**
 * Hero Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: Prevents unnecessary re-renders when the Home page state changes
 * (like shouldRenderBelowFold toggling). This protects the heavy Framer Motion
 * animations and video playback logic from redundant reconciliation.
 */
const Hero: React.FC = memo(() => {
  // PERFORMANCE: Use the first video by default to match the LCP preload in index.html.
  // Randomization is moved to a useEffect to avoid hydration mismatch and LCP degradation.
  const [backgroundVideo, setBackgroundVideo] = useState(HERO_VIDEOS[0]);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const optimizedPoster = useMemo(
    () => optimizeRemoteImageUrl(backgroundVideo.poster, 1280, 720),
    [backgroundVideo.poster]
  );

  const posterSrcSet = useMemo(() => {
    const url = backgroundVideo.poster;
    // Use the actual Cloudflare preset dimensions (960x540, 1200x675, 1280x720)
    // so the w-descriptor matches the real pixel width of the generated URL,
    // and force webp to match the preload in index.html (avoiding double download).
    return [
      `${optimizeRemoteImageUrl(url, 960, 540, 'webp')} 960w`,
      `${optimizeRemoteImageUrl(url, 1200, 675, 'webp')} 1200w`,
      `${optimizeRemoteImageUrl(url, 1280, 720, 'webp')} 1280w`,
    ].join(', ');
  }, [backgroundVideo.poster]);

  const [validCityForTitle, setValidCityForTitle] = useState<string | null>(null);

  // Defer video loading on mobile / save-data and wait for user intent.
  useEffect(() => {
    // Randomize background after mount for subsequent visits/interactions,
    // but keep it stable for the initial paint to protect LCP.
    const randomIndex = Math.floor(Math.random() * HERO_VIDEOS.length);
    if (randomIndex !== 0) {
      setBackgroundVideo(HERO_VIDEOS[randomIndex]);
    }

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

    // Load video only after real interaction, with a long fallback.
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

  // Handle Video Autoplay Robustly
  useEffect(() => {
    if (shouldRenderVideo && videoRef.current) {
      // Explicitly set muted property to ensure browser allows autoplay
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;

      // Use play() promise to catch interruption errors
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Silently handle autoplay prevention or interruption
          console.warn("Autoplay prevented or interrupted (safely handled):", error);
        });
      }
    }
  }, [shouldRenderVideo]);

  return (
    <section className="relative w-full min-h-[100svh] md:min-h-[850px] flex items-center bg-brand-light pb-20 z-20">

      {/* Background media (image first, deferred video on capable devices) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {!shouldRenderVideo && (
          <img
            src={optimizedPoster}
            srcSet={posterSrcSet}
            sizes="100vw"
            alt="Paisagem de um destino de viagem paradisíaco, um dos roteiros exclusivos da Anhangá Viagens"
            width="1280"
            height="720"
            fetchPriority="high"
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

        {/* Keep blending effect on larger screens only to reduce mobile paint cost */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/80 to-blue-900/70 md:mix-blend-multiply"></div>

        {/* Decorative texture hidden on mobile to reduce render overhead */}
        <div className="hidden md:block absolute inset-0 opacity-20" style={noiseTextureStyle}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-40 pb-12">
        <div className="flex flex-col items-center justify-center text-center">

          {/* SEO H1 - Optimized with visible keywords for search engines */}
          <h1
            className={`font-sans font-extrabold text-white mb-6 leading-[0.9] tracking-tight drop-shadow-lg transition duration-500
                ${validCityForTitle ? 'text-4xl sm:text-5xl md:text-7xl' : 'text-5xl sm:text-6xl md:text-8xl'}
                `}
          >
            <span className="block text-sm sm:text-base font-semibold text-white/80 tracking-widest uppercase mb-3 leading-normal">
              Agência de Viagens em São Paulo
            </span>
            Sua Próxima <br />
            <span className="text-anhanga-yellow relative inline-block pb-2">
              {validCityForTitle ? `Aventura em ${validCityForTitle}` : 'Aventura'}

              {/* Underline Scribble - orgânico via Framer Motion pathLength */}
              <svg className="absolute w-full h-4 -bottom-0 left-0 text-anhanga-yellow overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                <m.path
                  d="M0 5 Q 50 15 100 5"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                />
              </svg>
            </span>
          </h1>

          <p className="text-white/90 text-xl md:text-2xl max-w-3xl mx-auto mb-12 font-medium leading-relaxed drop-shadow-md">
            Roteiro sob medida, proposta sem compromisso e atendimento humano para viajar sem pacote pronto
          </p>

          {/* Formulário completo — apenas desktop */}
          <div className="hidden md:block w-full">
            <SearchForm onDestinationMatch={setValidCityForTitle} />
          </div>

          {/* CTA simplificado — apenas mobile */}
          <MobileHeroForm />

          {/* Micro-texto abaixo da barra de busca */}
          <p className="text-sm text-white/70 text-center mt-3">
            Sem compromisso • Retorno humano em até 2h úteis
          </p>

          <AIResearchBar />
        </div>
      </div>

      {/* Wavy Bottom Separator */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-brand-surface"></path>
        </svg>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
