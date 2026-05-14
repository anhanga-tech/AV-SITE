import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Calendar, MapPin, Music2, Share2, Check } from 'lucide-react';
import { WAITLIST_CTA_LABEL, WAITLIST_SECTION_ID } from './constants';
import { getMediaUrl } from '../../../data/mediaConfig';

const Hero: React.FC = () => {
  const headliners = [
    "SABRINA CARPENTER",
    "CHAPPELL ROAN",
    "TYLER, THE CREATOR",
    "LORDE",
    "SKRILLEX",
    "DOECHII",
    "LEWIS CAPALDI",
    "TURNSTILE"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false); // Start fade out
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % headliners.length);
        setIsVisible(true); // Start fade in
      }, 500); // Wait for fade out to finish
    }, 3500); // Change every 3.5 seconds

    return () => clearInterval(interval);
  }, []);

    const handleShare = async () => {
    const shareData = {
      title: 'Anhangá Viagens | Lollapalooza Brasil',
      text: 'Lolla 2026 esgotado, mas a lista de espera 2027 da Anhangá já está aberta. 🎸',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, ignore
      }
    } else {
      // Fallback for browsers without Web Share API
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-anhanga-darkBlue" aria-label="Introdução - Lollapalooza Brasil">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover object-center"
          poster={getMediaUrl('images/lollapalooza/hero/crowd-poster.jpg')}
        >
          {/* Video: Concert Crowd with Confetti - Matches Lolla Vibe */}
          <source src={getMediaUrl('videos/lollapalooza/hero/crowd-background.mp4')} type="video/mp4" />
          Seu navegador não suporta a tag de vídeo.
        </video>
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-anhanga-darkBlue/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-anhanga-darkBlue via-transparent to-anhanga-darkBlue/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white pt-20">
        {/* Pills */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-6 md:mb-8 animate-fade-in">
          <span className="py-1.5 px-4 rounded-full bg-anhanga-yellow text-anhanga-darkBlue font-black text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(255,214,0,0.5)]">
            <Calendar size={14} strokeWidth={3} aria-hidden="true" /> 20, 21 e 22 de Março
          </span>
          <span className="py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md text-white font-bold text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 border border-white/20">
            <MapPin size={14} aria-hidden="true" /> Autódromo de Interlagos - SP
          </span>
        </div>
        
        {/* Dynamic Headliner Title */}
        <div className="mb-2 md:mb-4 min-h-[5rem] md:min-h-[7rem] flex flex-col items-center justify-center w-full px-2">
            <p className="text-gray-300 text-[10px] sm:text-xs md:text-sm lg:text-lg uppercase tracking-[0.2em] mb-1 md:mb-2">Prepare-se para ver</p>
            <h2 
                aria-live="polite"
                className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter text-anhanga-yellow transition-all duration-500 transform text-center break-words w-full max-w-5xl leading-[0.9] sm:leading-tight pb-2 ${
                    isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
                }`}
                style={{ paddingRight: '0.1em' }}
            >
                {headliners[currentIndex]}
            </h2>
        </div>

        {/* Main Value Proposition — h1 is visibly rendered to avoid sr-only cloaking risk */}
        <h1 className="text-sm font-semibold uppercase tracking-normal text-white/70 mb-2 md:mb-4">Lollapalooza Brasil: campanha 2026 esgotada e lista de espera 2027</h1>
        <div aria-hidden="true" className="flex flex-col items-center justify-center mb-6 md:mb-8 text-white max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-4 gap-y-2 mb-2 sm:mb-4">
                <span className="text-xl sm:text-3xl md:text-5xl font-bold drop-shadow-2xl">no</span>
                <img 
                    src={getMediaUrl('images/lollapalooza/logos/lollapalooza-brasil.png')} 
                    alt="Lollapalooza Brasil" 
                    width="400"
                    height="112"
                    className="h-12 sm:h-20 md:h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                />
                <span className="text-xl sm:text-3xl md:text-5xl font-bold drop-shadow-2xl">2026 com</span>
            </div>
            
            <span className="text-xl sm:text-3xl md:text-5xl font-bold leading-tight bg-white text-anhanga-darkBlue px-2 sm:px-4 py-1 sm:py-2 rounded-sm shadow-xl box-decoration-clone">
                conforto, praticidade e a experiência Anhangá
            </span>
        </div>
        
        <p className="text-sm sm:text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto text-gray-200 font-medium drop-shadow-md leading-relaxed px-2">
          Hospedagem selecionada, transporte exclusivo e suporte dedicado para você só se preocupar em curtir os shows.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            text={WAITLIST_CTA_LABEL}
            href={`#${WAITLIST_SECTION_ID}`}
            className="animate-pulse hover:animate-none w-full sm:w-auto text-sm sm:text-lg px-6 py-3 sm:px-8 sm:py-4"
            dataTracking="hero-lolla-waitlist"
            id="btn-lolla-waitlist-hero"
          />

          <Button
            text="Falar com especialista"
            variant="outline"
            className="btn-whatsapp btn-specialist w-full sm:w-auto text-sm sm:text-lg px-6 py-3 sm:px-8 sm:py-4"
            dataTracking="hero-lolla-whatsapp"
            id="btn-lolla-specialist-hero"
          />
          
          <button 
            onClick={handleShare}
            className={`
              group relative flex items-center justify-center gap-2 px-6 py-4 rounded-full border-2 transition-all duration-300 w-full sm:w-auto
              ${shareStatus === 'copied' 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-white/20 text-white hover:bg-white/10 hover:border-anhanga-yellow hover:text-anhanga-yellow'
              }
            `}
            aria-label="Compartilhar página"
          >
            {shareStatus === 'copied' ? (
              <>
                <Check size={20} />
                <span className="font-bold">Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold">Compartilhar</span>
              </>
            )}
          </button>
        </div>
        
        <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 text-[10px] sm:text-xs md:text-sm text-gray-400 font-medium">
            <Music2 size={14} className="text-anhanga-yellow" aria-hidden="true" />
            <span>Campanha 2026 encerrada. Cadastre-se para ser avisado sobre 2027.</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
