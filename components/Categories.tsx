import React from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { LazyImage } from './ui/LazyImage';

// Moved outside component to prevent re-allocation on every render
const POPULAR_DESTINATIONS = [
  {
    title: "Orlando",
    subtitle: "Magia & Parques",
    image: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293380/avkqwz1ar2964muauoml_xivjtk.jpg",
    tag: "Destino dos Sonhos",
    rotate: "-rotate-2",
    color: "bg-blue-100 text-blue-600",
    link: "/orlando"
  },
  {
    title: "Beto Carrero",
    subtitle: "Diversão BR",
    image: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293401/Star-Mountain-Beto-Carrero-World-2_r6n9ij.jpg",
    tag: "Radical",
    rotate: "rotate-3",
    color: "bg-yellow-100 text-yellow-700",
    link: "/beto-carrero"
  },
  {
    title: "Lollapalooza",
    subtitle: "Festivais",
    image: "https://res.cloudinary.com/dzehqrcmm/image/upload/v1771293421/lollapalooza-brasil-2026-2_pwrkqg.webp",
    tag: "Festival",
    rotate: "-rotate-1",
    color: "bg-emerald-100 text-emerald-600",
    link: "/lollapalooza-2026"
  }
];

const Categories: React.FC = () => {

  return (
    <section className="py-24 bg-[#fffdf5] relative">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-brand-dark bg-white text-brand-dark font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] mb-4">
              <TrendingUp className="w-4 h-4" /> Em Alta
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-dark">
              Todo mundo <br className="md:hidden" /> quer ir pra cá 👇
            </h2>
          </div>
        </div>

        {/* Polaroid Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 px-4">
          {POPULAR_DESTINATIONS.map((item, idx) => (
            <Link
              key={item.link}
              to={item.link}
              className={`
                        group bg-white p-4 pb-8 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] 
                        transform transition-transform duration-500 hover:scale-105 hover:z-10 hover:shadow-2xl 
                        ${item.rotate} cursor-pointer relative block
                    `}
            >
              {/* Fake Tape */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-sm border-l border-r border-white/60 rotate-1 shadow-sm z-20"></div>

              {/* Image Area */}
              <div className="aspect-square w-full overflow-hidden bg-gray-100 mb-6 relative">
                <LazyImage
                  src={item.image}
                  width={900}
                  height={900}
                  alt={item.title}
                  loading="lazy"
                  fetchPriority="low"
                  className="w-full h-full object-cover filter contrast-[1.1] transition-transform duration-700 group-hover:scale-110"
                />
                {/* Tag */}
                <div className={`absolute top-4 right-4 ${item.color} px-3 py-1 font-bold text-xs uppercase tracking-wide rounded-md shadow-sm`}>
                  {item.tag}
                </div>
              </div>

              {/* Caption (Handwritten feel) */}
              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-800 mb-1 font-sans tracking-tight">{item.title}</h3>
                <p className="text-gray-500 font-medium font-serif italic">{item.subtitle}</p>
              </div>

              {/* Sticker Decor */}
              <div className="absolute -bottom-4 -right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-110">
                <div className="bg-brand-yellow text-brand-dark rounded-full p-3 shadow-lg border-2 border-white">
                  <ArrowRight className="w-6 h-6 -rotate-45" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Categories;
