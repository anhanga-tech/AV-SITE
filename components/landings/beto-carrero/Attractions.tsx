import React from 'react';
import SectionTitle from './SectionTitle';
import { Flame, Star, Users, Zap, Camera } from 'lucide-react';
import { getBetoAssetUrl } from './assetPath';
import { optimizeRemoteImageUrl } from '@/data/mediaConfig';

interface Attraction {
  id: number;
  name: string;
  category: string;
  description: string;
  image: string;
  color: string;
  icon: React.ReactNode;
  rotation: string;
}

const attractions: Attraction[] = [
  {
    id: 1,
    name: "FireWhip",
    category: "Radical",
    description: "A única montanha-russa invertida do Brasil. 5 loopings e pernas soltas no ar!",
    image: optimizeRemoteImageUrl(`https://www.anhanga.tur.br${getBetoAssetUrl('firewhip.jpg')}`, 800),
    color: "bg-fun-pink",
    icon: <Flame size={18} strokeWidth={3} className="text-white" />,
    rotation: "rotate-2"
  },
  {
    id: 2,
    name: "Hot Wheels",
    category: "Show",
    description: "Manobras radicais, drift e muita velocidade em tamanho real. É de cair o queixo.",
    image: optimizeRemoteImageUrl(`https://www.anhanga.tur.br${getBetoAssetUrl('hotwheels.png')}`, 800),
    color: "bg-fun-yellow",
    icon: <Star size={18} strokeWidth={3} className="text-fun-dark" />,
    rotation: "-rotate-1"
  },
  {
    id: 3,
    name: "Crazy River",
    category: "Família",
    description: "Um rafting maluco nas corredeiras. Cuidado: você VAI se molhar.",
    image: optimizeRemoteImageUrl(`https://www.anhanga.tur.br${getBetoAssetUrl('crazy-river.jpg')}`, 800),
    color: "bg-fun-green",
    icon: <Users size={18} strokeWidth={3} className="text-white" />,
    rotation: "rotate-1"
  },
  {
    id: 4,
    name: "Big Tower",
    category: "Adrenalina",
    description: "100 metros de queda livre. A vista é linda, se você tiver coragem de abrir o olho.",
    image: optimizeRemoteImageUrl(`https://www.anhanga.tur.br${getBetoAssetUrl('big-tower.jpg')}`, 800),
    color: "bg-fun-blue",
    icon: <Zap size={18} strokeWidth={3} className="text-white" />,
    rotation: "-rotate-2"
  }
];

const Attractions: React.FC = () => {
  return (
    <section className="py-24 bg-fun-white relative overflow-visible z-20">

      {/* Top Divider: Ripped Paper Effect (Transition from Blue Section) */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] transform -translate-y-[99%]">
        <svg className="relative block w-[calc(100%+1.3px)] h-[40px] md:h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47,11.08,84.6,35,142.1,38.29C230,89.5,290,62,374,62c76.3,0,131,26.5,198,34,80,9,141-16,218-12,85.6,4.4,141,40,210,38,71.3-2,148-36,200-30V0Z" className="fill-fun-blue"></path>
        </svg>
      </div>

      {/* Background Scribbles */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-fun-yellow/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-fun-pink/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4">
        <SectionTitle
          title="Diversão tamanho família"
          subtitle="São mais de 100 atrações. Do frio na barriga ao sorriso no rosto."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-10 lg:gap-8 mt-16 px-4">
          {attractions.map((item) => (
            <div
              key={item.id}
              className={`group relative bg-white p-5 pb-8 rounded-[2rem] border-4 border-fun-dark shadow-hard transition-all duration-300 hover:-translate-y-3 hover:shadow-hard-hover hover:z-20 ${item.rotation}`}
            >
              {/* Tape Effect on Card */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-10 bg-white/40 backdrop-blur-sm border-l-2 border-r-2 border-white/60 transform rotate-1 shadow-sm z-20"></div>

              {/* Image Container */}
              <div className="relative overflow-hidden rounded-2xl border-4 border-fun-dark aspect-[4/5] mb-6 shadow-sm">
                <img
                  src={item.image}
                  alt={item.name}
                  className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700 filter saturate-[1.1]"
                />

                {/* Category Badge - Larger and bolder */}
                <div className={`absolute top-4 left-4 ${item.color} ${item.category === 'Show' ? 'text-fun-dark' : 'text-white'} text-sm font-black uppercase tracking-widest py-2 px-4 rounded-xl border-2 border-fun-dark shadow-hard flex items-center gap-2 transform -rotate-2 group-hover:rotate-0 transition-transform`}>
                  {item.icon} {item.category}
                </div>
              </div>

              {/* Content */}
              <div className="text-center px-1">
                <h3 className="font-heading font-black text-3xl text-fun-dark mb-3 leading-[0.9]">
                  {item.name}
                </h3>
                <p className="font-body text-slate-700 font-bold text-base leading-snug">
                  {item.description}
                </p>
              </div>

              {/* Hover Action "Sticker" */}
              <div className="absolute -bottom-5 -right-5 bg-fun-dark text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 rotate-12 border-2 border-white shadow-lg">
                <Camera size={28} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="mt-20 text-center">
          <p className="font-heading font-bold text-xl md:text-2xl text-fun-dark inline-block bg-fun-yellow px-8 py-3 rounded-full border-2 border-fun-dark shadow-hard transform rotate-1 hover:scale-105 transition-transform cursor-default">
            🎢 E muito, muito mais!
          </p>
        </div>

      </div>
    </section>
  );
};

export default Attractions;
