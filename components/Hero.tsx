import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HERO_VIDEOS, optimizeRemoteImageUrl } from '../data/mediaConfig';
import { QUICK_FEATURES } from '../data/destinations';
import SearchForm from './SearchForm';
import { openAiChat } from '../utils/aiChat';

const Hero: React.FC = () => {
  // PERFORMANCE: Use the first video by default to match the LCP preload in index.html.
  // Randomization is moved to a useEffect to avoid hydration mismatch and LCP degradation.
  const [backgroundVideo, setBackgroundVideo] = useState(HERO_VIDEOS[0]);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const optimizedPoster = useMemo(
    () => optimizeRemoteImageUrl(backgroundVideo.poster, 1280, 720),
    [backgroundVideo.poster]
  );

  const [validCityForTitle, setValidCityForTitle] = useState<string | null>(null);
  const [mobileDestination, setMobileDestination] = useState('');

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
    <section className="relative w-full min-h-[850px] flex items-center bg-brand-light pb-20 z-20">

      {/* Background media (image first, deferred video on capable devices) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {!shouldRenderVideo && (
          <img
            src={optimizedPoster}
            alt="Destinos exclusivos planejados pela Anhangá Viagens, agência boutique em São Paulo"
            width="1280"
            height="720"
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

        {/* Keep blending effect on larger screens only to reduce mobile paint cost */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/80 to-blue-900/70 md:mix-blend-multiply"></div>

        {/* Decorative texture hidden on mobile to reduce render overhead */}
        <div className="hidden md:block absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-40 pb-12">
        <div className="flex flex-col items-center justify-center text-center">

          {/* SEO H1 - sr-only prefixes keyword for crawlers; visible copy preserved for design */}
          <h1
            className={`font-sans font-extrabold text-white mb-6 leading-[0.9] tracking-tight drop-shadow-lg transition-all duration-500
                ${validCityForTitle ? 'text-4xl sm:text-5xl md:text-7xl' : 'text-5xl sm:text-6xl md:text-8xl'}
                `}
          >
            <span className="sr-only">Agência de Viagens Boutique em São Paulo — </span>
            <span className="block text-sm sm:text-base font-semibold text-white/80 tracking-widest uppercase mb-3 leading-normal">
              Para quem não consegue mais ficar parado.
            </span>
            Sua Próxima <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 relative inline-block pb-2">
              {validCityForTitle ? `Aventura em ${validCityForTitle}` : 'Aventura'}

              {/* Underline Scribble - orgânico via Framer Motion pathLength */}
              <svg className="absolute w-full h-4 -bottom-0 left-0 text-yellow-400 overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
                <motion.path
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

          <p className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed drop-shadow-md">
            Cada roteiro nasce de uma conversa.
          </p>

          {/* Formulário completo — apenas desktop */}
          <div className="hidden md:block w-full">
            <SearchForm onDestinationMatch={setValidCityForTitle} />
          </div>

          {/* CTA simplificado — apenas mobile */}
          <div className="md:hidden w-full max-w-sm mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                openAiChat({
                  message: mobileDestination.trim()
                    ? `Olá! Tenho interesse em viajar para ${mobileDestination.trim()}. Podem me ajudar com um orçamento?`
                    : 'Olá! Gostaria de montar um roteiro personalizado. Podem me ajudar?',
                });
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-white/30">
                <span className="text-brand-cyan text-lg">📍</span>
                <input
                  type="text"
                  value={mobileDestination}
                  onChange={(e) => setMobileDestination(e.target.value)}
                  placeholder="Para onde você quer ir?"
                  className="flex-1 outline-none text-gray-800 font-semibold placeholder-gray-400 bg-transparent text-base"
                  autoComplete="off"
                  data-testid="destination-input-mobile"
                />
              </div>
              <button
                type="submit"
                data-testid="submit-search-btn-mobile"
                className="w-full bg-brand-yellow text-brand-dark font-black text-base py-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                Quero meu orçamento →
              </button>
            </form>
          </div>

          {/* Micro-texto abaixo da barra de busca */}
          <p className="text-sm text-white/70 text-center mt-3">
            Sem compromisso • Resposta em até 2h (dias úteis)
          </p>

          {/* Quick Features - Staggered Spring */}
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-6"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } } }}
          >
            {QUICK_FEATURES.map((feat) => (
              <motion.div
                key={feat.text}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } }
                }}
                className="flex items-center gap-2 text-white/90 font-bold text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all duration-300 cursor-default"
                whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
              >
                <feat.icon className="w-4 h-4 text-yellow-300" />
                {feat.text}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Wavy Bottom Separator */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#fffdf5"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
