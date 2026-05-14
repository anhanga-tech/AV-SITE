import React from 'react';
import { BedDouble, BusFront, Headset, Map, Wand2, type LucideIcon } from 'lucide-react';
import useIntersectionObserver from './hooks/useIntersectionObserver';
import Button from './Button';
import { WAITLIST_CTA_LABEL, WAITLIST_SECTION_ID } from './constants';
import { optimizeRemoteImageUrl } from '../../../data/mediaConfig';

// Tipos para os dados
interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  image?: string;
  bgColor?: string; // Para cards sem imagem
  className: string; // Classes de grid (col-span, row-span)
}

const PackageFeatures: React.FC = () => {
  const { elementRef, isVisible } = useIntersectionObserver(0.1);

  const features: FeatureItem[] = [
    {
      id: 'experience',
      title: 'O QUE FEZ 2026 ESGOTAR',
      subtitle: 'A campanha combinou hotel estratégico, mobilidade planejada e suporte humano para quem queria viver o festival sem caos.',
      icon: Wand2,
      image: 'images/lollapalooza/package/esgotou-2026.webp',
      className: 'col-span-1 md:col-span-2 md:row-span-2 min-h-[400px] sm:min-h-[500px]'
    },
    {
      id: 'hotel',
      title: 'HOTEL NA MEDIDA',
      subtitle: 'Hospedagem bem localizada e pensada para descansar de verdade entre um dia de show e outro.',
      icon: BedDouble,
      image: 'images/lollapalooza/package/hotel-medida.jpg',
      className: 'col-span-1 md:col-span-1 md:row-span-2 min-h-[300px] sm:min-h-[400px] md:min-h-full'
    },
    {
      id: 'city',
      title: 'SP ALÉM DO PALCO',
      subtitle: 'Curadoria da cidade para aproveitar São Paulo antes, durante e depois do festival.',
      icon: Map,
      image: 'images/lollapalooza/package/sp-noite.jpg',
      className: 'col-span-1 md:col-span-1 md:row-span-1 min-h-[250px] sm:min-h-[300px]'
    },
    {
      id: 'transport',
      title: 'LOGÍSTICA INTELIGENTE',
      subtitle: 'Rotas e deslocamentos desenhados para evitar perrengue no entorno de Interlagos.',
      icon: BusFront,
      bgColor: 'bg-anhanga-yellow',
      className: 'col-span-1 md:col-span-1 md:row-span-1 min-h-[250px] sm:min-h-[300px]'
    },
    {
      id: 'support',
      title: 'SUPORTE HUMANO',
      subtitle: 'Time disponível para ajustes e imprevistos, do embarque ao retorno.',
      icon: Headset,
      bgColor: 'bg-anhanga-blue',
      className: 'col-span-1 md:col-span-1 md:row-span-1 min-h-[250px] sm:min-h-[300px]'
    }
  ];

  return (
    <section id="pacote" className="bg-gray-950 py-20 relative overflow-hidden" ref={elementRef}>
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] size-[50%] bg-anhanga-blue rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] size-[50%] bg-anhanga-yellow rounded-full blur-[120px] opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className={`mb-12 md:mb-16 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-anhanga-yellow/30 bg-anhanga-yellow/10 text-anhanga-yellow font-bold uppercase text-xs tracking-widest mb-4">
            <Wand2 size={14} /> Destaques da Operação 2026
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-[0.9] tracking-tighter max-w-3xl">
            A EXPERIÊNCIA QUE LOTOU <br />
            <span className="text-anhanga-yellow">E JÁ PREPARA 2027.</span>
          </h2>
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-min">
          {features.map((feature, idx) => (
            <div
              key={feature.id}
              className={`
                group relative rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl
                ${feature.className}
                animate-on-scroll ${isVisible ? 'is-visible' : ''}
              `}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              {/* Background: Image or Color */}
              {feature.image ? (
                <>
                  <img
                    src={optimizeRemoteImageUrl(feature.image, 800, 600)}
                    alt={feature.title}
                    width="800"
                    height="600"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
                </>
              ) : (
                <div className={`absolute inset-0 ${feature.bgColor} transition-colors duration-300`}>
                  {/* Pattern overlay for solid colors */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>
              )}

              {/* Content */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <div className="transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                  <h3 className={`text-xl sm:text-2xl md:text-xl lg:text-3xl xl:text-4xl font-black uppercase leading-[0.9] mb-3 break-words
                    ${feature.image || feature.bgColor === 'bg-anhanga-blue' ? 'text-white' : 'text-anhanga-darkBlue'}
                  `}>
                    {feature.title}
                  </h3>
                  <p className={`font-medium text-sm md:text-base leading-snug line-clamp-3 md:line-clamp-none
                    ${feature.image ? 'text-gray-300' : (feature.bgColor === 'bg-anhanga-yellow' ? 'text-gray-800' : 'text-blue-100')}
                  `}>
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button
            text={WAITLIST_CTA_LABEL}
            href={`#${WAITLIST_SECTION_ID}`}
            className="md:text-xl md:px-12 md:py-5"
            dataTracking="mid-lolla-waitlist"
            id="btn-lolla-waitlist-mid"
          />
        </div>
      </div>
    </section>
  );
};

export default PackageFeatures;
