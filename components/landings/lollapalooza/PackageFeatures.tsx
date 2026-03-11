import React from 'react';
import { BedDouble, BusFront, Headset, Map, Wand2, type LucideIcon } from 'lucide-react';
import useIntersectionObserver from './hooks/useIntersectionObserver';
import Button from './Button';

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
      title: 'VIVA O LOLLA. A GENTE CUIDA DO RESTO.',
      subtitle: 'Ingresso na mão? Esqueça filas de Uber e perrengue de hotel. Sua única preocupação é não perder o show.',
      icon: Wand2,
      image: 'https://mobilidade.estadao.com.br/wp-content/uploads/2025/03/lollapalooza_reproducao-.jpg.webp',
      className: 'col-span-1 md:col-span-2 md:row-span-2 min-h-[400px] sm:min-h-[500px]'
    },
    {
      id: 'hotel',
      title: 'RECARREGUE A BATERIA',
      subtitle: 'Hotéis 4★ estratégicos. Cama macia e café da manhã reforçado pra aguentar o dia seguinte.',
      icon: BedDouble,
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800&fm=webp',
      className: 'col-span-1 md:col-span-1 md:row-span-2 min-h-[300px] sm:min-h-[400px] md:min-h-full'
    },
    {
      id: 'city',
      title: 'SP ALÉM DO SHOW',
      subtitle: 'Roteiros gastronômicos e after-parties pra quem tem energia sobrando.',
      icon: Map,
      image: 'https://guiaviajarmelhor.com.br/wp-content/uploads/2018/10/O-que-fazer-em-sao-paulo-a-noite.jpg', // SP Night
      className: 'col-span-1 md:col-span-1 md:row-span-1 min-h-[250px] sm:min-h-[300px]'
    },
    {
      id: 'transport',
      title: 'TELETRANSPORTE VIP',
      subtitle: 'Transporte executivo exclusivo. Ar-condicionado, água e zero stress no trânsito.',
      icon: BusFront,
      bgColor: 'bg-anhanga-yellow',
      className: 'col-span-1 md:col-span-1 md:row-span-1 min-h-[250px] sm:min-h-[300px]'
    },
    {
      id: 'support',
      title: 'SUPORTE 24H REAL',
      subtitle: 'Time Anhangá no hotel e no WhatsApp. Deu ruim? A gente resolve.',
      icon: Headset,
      bgColor: 'bg-anhanga-blue',
      className: 'col-span-1 md:col-span-1 md:row-span-1 min-h-[250px] sm:min-h-[300px]'
    }
  ];

  return (
    <section id="pacote" className="bg-black py-20 relative overflow-hidden" ref={elementRef}>
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-anhanga-blue rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-anhanga-yellow rounded-full blur-[120px] opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className={`mb-12 md:mb-16 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-anhanga-yellow/30 bg-anhanga-yellow/10 text-anhanga-yellow font-bold uppercase text-xs tracking-widest mb-4">
            <Wand2 size={14} /> Pacote Completo
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-[0.9] tracking-tighter max-w-3xl">
            TUDO INCLUSO. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-anhanga-yellow to-white">SÓ FALTA VOCÊ.</span>
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
                    src={feature.image}
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
            text="Quero viver essa experiência"
            className="md:text-xl md:px-12 md:py-5"
            dataTracking="mid-lolla"
          />
        </div>
      </div>
    </section>
  );
};

export default PackageFeatures;
