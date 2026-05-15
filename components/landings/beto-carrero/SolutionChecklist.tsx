import { Check, Plane, BedDouble, Ticket, MapPin, ArrowRight } from 'lucide-react';
import { openContactModal } from '../../../utils/contactForm';

interface SolutionChecklistProps {
  onOpenModal: () => void;
}

export function SolutionChecklist({ onOpenModal }: SolutionChecklistProps) {
  return (
    <div className="lg:w-1/2 relative flex flex-col items-center lg:items-start">
      <div className="w-full">
        <div className="inline-block px-4 py-2 bg-fun-yellow border-2 border-fun-dark rounded-full shadow-hard mb-8 md:mb-10 transform -rotate-2">
          <span className="font-bold text-fun-dark uppercase tracking-wide text-sm">Zero Stress</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-sans font-bold mb-6 text-white drop-shadow-md leading-tight">
          A Solução é <br className="md:hidden" />
          <span className="relative inline-block ml-2 md:ml-0">
            <span className="relative z-10 text-fun-yellow">Simples</span>
            {/* Custom Brush Stroke Underline - Replaces the 'spell check' wavy line */}
            <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-[110%] -translate-x-[5%] h-4 md:h-6 text-fun-yellow pointer-events-none z-0" viewBox="0 0 120 15" preserveAspectRatio="none">
              <path d="M5 10 Q 60 15 115 5" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" className="opacity-80" />
            </svg>
          </span>
        </h2>
        <p className="text-xl md:text-2xl font-sans mb-10 text-blue-100 leading-relaxed max-w-lg">
          Enquanto você sonha, a Anhangá organiza. Seu pacote completo chega pronto no seu WhatsApp.
        </p>
      </div>

      <div className="gap-y-6 flex flex-col relative z-10 w-full items-center lg:items-start">

        {/* Card 1: Ticket Style */}
        <div className="group bg-white rounded-xl border-2 border-fun-dark shadow-hard transform -rotate-2 hover:rotate-0 transition-transform duration-300 flex overflow-hidden w-full max-w-sm lg:max-w-md">
          {/* Left Side: Content */}
          <div className="p-3 pl-4 lg:p-6 lg:pl-8 flex-grow flex items-center gap-4 lg:gap-6">
            {/* Redesigned Icon: Blue Circle Token */}
            <div className="size-14 lg:size-20 bg-fun-blue rounded-full flex items-center justify-center border-2 border-fun-dark shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-white transform -rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
              <Plane className="size-6 lg:size-9" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg lg:text-2xl text-fun-dark">Passagem Aérea</h3>
              <p className="text-slate-600 text-xs lg:text-sm font-bold">Horários que funcionam.</p>
            </div>
          </div>
          {/* Divider Line */}
          <div className="w-0 border-l-2 border-dashed border-gray-300 relative my-2">
            <div className="absolute -top-3 -left-1.5 size-3 bg-fun-blue rounded-full"></div>
            <div className="absolute -bottom-3 -left-1.5 size-3 bg-fun-blue rounded-full"></div>
          </div>
          {/* Right Side: Stamp */}
          <div className="w-16 lg:w-20 bg-gray-50 flex items-center justify-center flex-shrink-0">
            <div className="bg-green-100 text-green-600 border-2 border-green-500 size-8 lg:size-10 rounded-full flex items-center justify-center transform rotate-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
              <Check className="size-[18px] lg:size-6" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Card 2: Ticket Style */}
        <div className="group bg-white rounded-xl border-2 border-fun-dark shadow-hard transform rotate-1 hover:rotate-0 transition-transform duration-300 flex overflow-hidden ml-0 md:ml-12 lg:ml-12 w-full max-w-sm lg:max-w-md">
          <div className="p-3 pl-4 lg:p-6 lg:pl-8 flex-grow flex items-center gap-4 lg:gap-6">
            {/* Redesigned Icon: Yellow Circle Token */}
            <div className="size-14 lg:size-20 bg-fun-yellow rounded-full flex items-center justify-center border-2 border-fun-dark shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-fun-dark transform rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
              <BedDouble className="size-6 lg:size-9" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg lg:text-2xl text-fun-dark">Hotel Top</h3>
              <p className="text-slate-600 text-xs lg:text-sm font-bold">Perto da diversão.</p>
            </div>
          </div>
          <div className="w-0 border-l-2 border-dashed border-gray-300 relative my-2">
            <div className="absolute -top-3 -left-1.5 size-3 bg-fun-blue rounded-full"></div>
            <div className="absolute -bottom-3 -left-1.5 size-3 bg-fun-blue rounded-full"></div>
          </div>
          <div className="w-16 lg:w-20 bg-gray-50 flex items-center justify-center flex-shrink-0">
            <div className="bg-green-100 text-green-600 border-2 border-green-500 size-8 lg:size-10 rounded-full flex items-center justify-center transform -rotate-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
              <Check className="size-[18px] lg:size-6" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Card 3: Ticket Style */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => openContactModal({ source: 'beto-carrero-solution' })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openContactModal({ source: 'beto-carrero-solution' });
            }
          }}
          className="btn-specialist cursor-pointer group bg-white rounded-xl border-2 border-fun-dark shadow-hard transform -rotate-1 hover:rotate-0 transition-transform duration-300 flex overflow-hidden w-full max-w-sm lg:max-w-md"
          data-tracking="mid-betocarrero"
        >
          <div className="p-3 pl-4 lg:p-6 lg:pl-8 flex-grow flex items-center gap-4 lg:gap-6">
            {/* Redesigned Icon: Pink Circle Token */}
            <div className="size-14 lg:size-20 bg-fun-pink rounded-full flex items-center justify-center border-2 border-fun-dark shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-white transform -rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
              <Ticket className="size-6 lg:size-9" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg lg:text-2xl text-fun-dark">Ingresso Oficial</h3>
              <p className="text-slate-600 text-xs lg:text-sm font-bold">Direto na catraca.</p>
            </div>
          </div>
          <div className="w-0 border-l-2 border-dashed border-gray-300 relative my-2">
            <div className="absolute -top-3 -left-1.5 size-3 bg-fun-blue rounded-full"></div>
            <div className="absolute -bottom-3 -left-1.5 size-3 bg-fun-blue rounded-full"></div>
          </div>
          <div className="w-16 lg:w-20 bg-gray-50 flex items-center justify-center flex-shrink-0">
            <div className="bg-green-100 text-green-600 border-2 border-green-500 size-8 lg:size-10 rounded-full flex items-center justify-center transform rotate-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
              <Check className="size-[18px] lg:size-6" strokeWidth={3} />
            </div>
          </div>
        </div>

      </div>

      {/* Sticker: Extra Cities - INCREASED SIZE */}
      <div className="relative mt-12 xl:mt-0 xl:absolute xl:top-1/2 xl:-right-40 xl:-translate-y-1/2 z-30 w-full max-w-sm xl:w-96">

        {/* Larger Tape effect */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-12 bg-white/40 rotate-2 backdrop-blur-sm border-l-2 border-r-2 border-white/50 shadow-sm pointer-events-none"></div>

        <button
          onClick={onOpenModal}
          className="bg-fun-yellow p-8 w-full rounded-xl border-4 border-fun-dark shadow-hard-lg transform -rotate-3 hover:rotate-0 hover:scale-105 active:scale-95 transition-all duration-300 text-left group focus:outline-none focus:ring-4 focus:ring-fun-blue focus:ring-offset-2"
          aria-label="Saiba mais sobre estender a viagem para praias próximas"
        >

          {/* Header of Sticker */}
          <div className="flex items-center gap-3 mb-4 border-b-2 border-fun-dark/20 pb-3">
            <div className="bg-fun-dark text-white p-2 rounded-lg">
              <MapPin size={24} strokeWidth={2.5} />
            </div>
            <span className="font-sans font-bold text-2xl leading-none text-fun-dark">Estique a viagem</span>
          </div>

          {/* Description */}
          <p className="text-lg font-bold text-slate-800 mb-4 leading-snug">
            Dá pra incluir praia no roteiro? <br />
            <span className="text-fun-pink text-xl">Com certeza!</span>
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1.5 bg-white border-2 border-fun-dark rounded-lg text-sm font-bold shadow-sm transform rotate-2">Floripa</span>
            <span className="px-3 py-1.5 bg-white border-2 border-fun-dark rounded-lg text-sm font-bold shadow-sm transform -rotate-1">Bombinhas</span>
            <span className="px-3 py-1.5 bg-white border-2 border-fun-dark rounded-lg text-sm font-bold shadow-sm transform rotate-1">Balneário</span>
          </div>

          {/* Fake Link */}
          <div className="flex items-center gap-2 text-fun-dark font-bold text-sm uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
            Ver opções <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>

    </div>
  );
}
