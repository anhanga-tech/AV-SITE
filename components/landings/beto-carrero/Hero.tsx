import React from 'react';
import Button from './Button';
import { Ticket, Plane, Star, ArrowDownLeft, Sparkles, Zap, ArrowDown } from 'lucide-react';
import { optimizeRemoteImageUrl } from '@/data/mediaConfig';
import { PROD_ASSET_BASE } from './constants';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-fun-yellow overflow-visible pt-12 pb-20 md:pt-20 md:pb-32 lg:pt-24 lg:pb-40 border-b-0 min-h-[90vh] flex flex-col justify-center z-10">

      {/* --- Background Pattern (Dotted) --- */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#0F172A 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* --- Background Doodles (Abstract Shapes) --- */}
      <div className="absolute top-10 left-0 w-24 h-24 md:w-40 md:h-40 bg-white/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-0 w-32 h-32 md:w-64 md:h-64 bg-fun-pink/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-4 items-center relative z-20 mb-12 md:mb-0">

        {/* --- LEFT COLUMN: Copy & CTA --- */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-1 relative z-20">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border-2 border-fun-dark px-3 py-1.5 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm lg:text-base mb-6 md:mb-8 transform -rotate-2 shadow-hard hover:rotate-0 transition-transform cursor-default z-20">
            <Zap size={18} className="text-fun-pink fill-current" />
            <span className="uppercase tracking-wide text-fun-dark">Diversão sem Burocracia</span>
          </div>

          {/* Headline — h1 is the visible heading to avoid sr-only cloaking risk */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-sans font-black text-fun-dark leading-[1.1] md:leading-[1] lg:leading-[0.9] mb-6 md:mb-8 drop-shadow-sm max-w-2xl lg:max-w-none">
            Memórias Que Começam no <br className="hidden md:block" />
            <span className="relative inline-block mt-1 md:mt-2 lg:mt-4">
              <span className="relative z-10">Beto Carrero</span>
              {/* Marker Highlight Decoration behind the text */}
              <svg className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-6 md:h-8 lg:h-10 text-fun-pink opacity-90 z-0" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden>
                <path d="M0 16 C18 6, 36 20, 54 12 C72 4, 90 18, 100 14 L100 24 L0 24 Z" fill="currentColor" />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-sans text-fun-dark mb-8 md:mb-12 leading-relaxed font-semibold max-w-lg lg:max-w-2xl mx-auto lg:mx-0">
            Aéreo + Hotel + Ingresso em um só pacote. <br className="hidden lg:block" />
            Você só se preocupa em <span className="bg-fun-pink text-white px-2 py-0.5 transform -rotate-1 inline-block rounded-sm shadow-sm">gritar na montanha-russa.</span>
          </p>

          {/* CTA Area */}
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-20">
            <div className="relative hover:scale-105 transition-transform duration-300">
              <Button text="Quero Meu Pacote no WhatsApp" tooltip="Resposta rápida!" className="w-full sm:w-auto px-8 py-5 text-xl lg:text-2xl" dataTracking="hero-betocarrero" />
            </div>

            {/* Hand-drawn Arrow pointing to button (Hidden on mobile to save space) */}
            <div className="hidden lg:block text-fun-dark absolute lg:left-[380px] lg:-top-14 xl:left-[480px] xl:-top-8 animate-bounce z-30">
              <div className="font-handwriting font-bold text-2xl mb-0 transform -rotate-6 whitespace-nowrap">
                Comece aqui!
              </div>
              <ArrowDownLeft size={64} strokeWidth={2} className="text-fun-dark ml-6 transform rotate-6" />
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN: The "Scrapbook" Visual --- */}
        <div className="flex justify-center lg:justify-end order-2 lg:order-2 mt-8 lg:mt-0 perspective-1000 relative">

          {/* Visual Container: keeps stickers relative to image. Scaled up for Desktop. */}
          <div className="relative w-64 h-80 sm:w-80 sm:h-96 lg:w-[26rem] lg:h-[32rem] xl:w-[38rem] xl:h-[46rem] transition-all duration-300">

            {/* 1. Main Photo (Polaroid Style) */}
            <div className="absolute inset-0 bg-white p-3 pb-12 lg:pb-16 rounded-sm border-4 border-fun-dark shadow-hard-lg transform rotate-3 hover:rotate-0 transition-all duration-500 z-10 group">
              {/* Tape Effect */}
              <div className="absolute -top-4 lg:-top-6 left-1/2 -translate-x-1/2 w-20 md:w-24 lg:w-32 h-8 lg:h-12 bg-white/50 backdrop-blur-sm border-l-2 border-r-2 border-white/60 transform -rotate-2 shadow-sm z-20"></div>

              <div className="bg-gray-200 border-2 border-fun-dark overflow-hidden rounded-sm relative w-full h-full">
                <img
                  src={optimizeRemoteImageUrl(`${PROD_ASSET_BASE}/grupo-em-frente-ao-castelo.jpg`, 1200)}
                  alt="Grupo em frente ao Castelo Beto Carrero"
                  width="600"
                  height="800"
                  className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="absolute bottom-3 lg:bottom-4 left-0 w-full text-center font-sans font-bold text-fun-dark text-xl lg:text-3xl rotate-1 z-0">
                Férias ❤️
              </div>
            </div>

            {/* 2. Floating Sticker: Plane Ticket (Top Right) - Keeps position */}
            <div className="absolute -top-6 -right-4 sm:-right-10 md:-right-4 lg:-right-12 xl:-right-16 bg-white p-2 sm:p-3 lg:p-5 rounded-xl border-2 border-fun-dark shadow-hard transform rotate-12 z-20 animate-[float_4s_ease-in-out_infinite] scale-95 sm:scale-100 md:scale-90 lg:scale-110">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="bg-blue-100 p-1.5 sm:p-2 lg:p-3 rounded-lg text-fun-blue border-2 border-fun-dark">
                  <Plane size={20} className="sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs lg:text-sm font-bold text-gray-400 leading-none mb-1">Voo Confirmado</div>
                  <div className="font-sans font-bold text-fun-dark text-sm sm:text-base lg:text-xl leading-none">GRU ➔ NVT</div>
                </div>
              </div>
            </div>

            {/* 3. Floating Sticker: Park Ticket (Bottom Left) */}
            <div className="absolute bottom-16 -left-4 sm:bottom-20 sm:-left-12 md:-left-4 md:bottom-24 lg:bottom-8 lg:-left-16 xl:bottom-24 xl:-left-20 bg-fun-pink text-white p-3 sm:p-4 lg:p-4 xl:p-6 px-4 sm:px-6 lg:px-6 xl:px-8 rounded-xl border-2 border-fun-dark shadow-hard transform -rotate-12 z-30 animate-[float_5s_ease-in-out_infinite_1s] scale-90 sm:scale-100 md:scale-85 lg:scale-75 xl:scale-110">
              <div className="flex items-center gap-2 lg:gap-3">
                <Ticket size={20} className="sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                <span className="font-sans font-bold text-sm sm:text-lg lg:text-2xl">Ingresso VIP</span>
              </div>
              {/* Perforation line */}
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 bg-fun-yellow rounded-full border-2 border-fun-dark"></div>
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 bg-fun-yellow rounded-full border-2 border-fun-dark"></div>
            </div>

            {/* 4. Floating Sticker: 5 Stars (Bottom Right) */}
            <div className="absolute -bottom-8 -right-2 md:-bottom-6 md:-right-6 lg:-bottom-2 lg:right-8 xl:right-4 xl:-bottom-8 bg-fun-green p-2 sm:p-3 lg:p-2 xl:p-4 rounded-full border-2 border-fun-dark shadow-hard z-20 transform rotate-6 hover:scale-110 transition-transform scale-90 sm:scale-100 lg:scale-75 xl:scale-110">
              <div className="flex gap-1 text-white">
                {[...Array(5)].map((_, i) => (
                  <Star key={`star-${i}`} size={14} className="sm:w-4 sm:h-4 lg:w-6 lg:h-6" fill="currentColor" />
                ))}
              </div>
            </div>

            {/* 5. Decorative Sparkles */}
            <Sparkles className="absolute -top-10 left-0 lg:-left-10 text-white w-10 h-10 sm:w-12 sm:h-12 lg:w-20 lg:h-20 animate-pulse z-0" strokeWidth={1} />
          </div>

        </div>
      </div>

      {/* --- Bottom Transition: Serrated Ticket Stub Edge (Geometric & High Contrast) --- */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-30">
        <svg
          className="relative block w-full h-[30px] md:h-[50px] lg:h-[60px] text-fun-white fill-current"
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
        >
          {/* 
             Path Explanation:
             Starts bottom-left (0,60), goes up to first peak (20,0), down to (40,60), up to (60,0)...
             This creates WHITE triangles pointing UP, covering the yellow background.
             Resulting visual: Yellow zigzag edge pointing DOWN.
           */}
          <path d="M0,60 L0,60 L20,0 L40,60 L60,0 L80,60 L100,0 L120,60 L140,0 L160,60 L180,0 L200,60 L220,0 L240,60 L260,0 L280,60 L300,0 L320,60 L340,0 L360,60 L380,0 L400,60 L420,0 L440,60 L460,0 L480,60 L500,0 L520,60 L540,0 L560,60 L580,0 L600,60 L620,0 L640,60 L660,0 L680,60 L700,0 L720,60 L740,0 L760,60 L780,0 L800,60 L820,0 L840,60 L860,0 L880,60 L900,0 L920,60 L940,0 L960,60 L980,0 L1000,60 L1020,0 L1040,60 L1060,0 L1080,60 L1100,0 L1120,60 L1140,0 L1160,60 L1180,0 L1200,60 L1200,60 Z" />
        </svg>
      </div>

      {/* --- Floating Scroll Connector (Overlapping the ZigZag) --- */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-40 w-full flex justify-center pointer-events-none">
        <div className="bg-white px-6 py-3 rounded-full border-4 border-fun-dark shadow-hard flex items-center gap-3 animate-bounce pointer-events-auto cursor-pointer group hover:scale-105 transition-transform">
          <span className="font-sans font-bold text-fun-dark text-sm md:text-lg whitespace-nowrap">
            O pesadelo de planejar
          </span>
          <div className="bg-fun-pink text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-fun-dark group-hover:bg-fun-dark transition-colors">
            <ArrowDown size={18} strokeWidth={3} />
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
