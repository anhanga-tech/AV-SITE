import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { LazyImage } from './ui/LazyImage';
import { optimizeRemoteImageUrl } from '../data/mediaConfig';

// Moved outside component to prevent re-allocation on every render
const POPULAR_DESTINATIONS = [
  {
    title: "Orlando",
    subtitle: "Magia & Parques",
    image: optimizeRemoteImageUrl('images/categories/orlando-home.jpg', 600, 600),
    tag: "Destino dos Sonhos",
    rotate: "-rotate-2",
    color: "bg-blue-100 text-blue-600",
    link: "/orlando"
  },
  {
    title: "Beto Carrero",
    subtitle: "Diversão BR",
    image: optimizeRemoteImageUrl('images/categories/beto-carrero-world.jpg', 600, 600),
    tag: "Radical",
    rotate: "rotate-3",
    color: "bg-yellow-100 text-yellow-700",
    link: "/beto-carrero"
  },
  {
    title: "Lollapalooza",
    subtitle: "Festivais",
    image: optimizeRemoteImageUrl('images/categories/lollapalooza-2026.webp', 600, 600),
    tag: "Festival",
    rotate: "-rotate-1",
    color: "bg-emerald-100 text-emerald-600",
    link: "/lollapalooza"
  }
];

/**
 * Categories Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: Prevents unnecessary re-renders when the Home page state changes.
 * Since this component relies on static data, it only needs to render once.
 * Expected Impact: Reduces re-render time for the Home page by skipping this component's reconciliation.
 */
const Categories = memo(() => {

  return (
    <section className="py-24 bg-[#fffdf5] relative">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-brand-dark bg-white text-brand-dark font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] mb-4">
              <TrendingUp className="size-4" /> Em Alta
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-dark">
              Todo mundo <br className="md:hidden" /> quer ir pra cá 👇
            </h2>
          </div>
        </div>

        {/* Polaroid Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 px-4">
          {POPULAR_DESTINATIONS.map((item) => (
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
                  width={600}
                  height={600}
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
                  <ArrowRight className="size-6 -rotate-45" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
});

Categories.displayName = 'Categories';

export default Categories;
