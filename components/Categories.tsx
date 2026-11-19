import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LazyImage } from './ui/LazyImage';
import { optimizeRemoteImageUrl } from '../data/mediaConfig';

// Moved outside component to prevent re-allocation on every render
const POPULAR_DESTINATIONS = [
  {
    title: "Orlando",
    image: optimizeRemoteImageUrl('images/categories/orlando-home.jpg', 600, 600),
    rotate: "-rotate-2",
    link: "/orlando/"
  },
  {
    title: "Beto Carrero",
    image: optimizeRemoteImageUrl('images/categories/beto-carrero-world.jpg', 600, 600),
    rotate: "rotate-3",
    link: "/beto-carrero/"
  },
  {
    title: "Lollapalooza",
    image: optimizeRemoteImageUrl('images/categories/lollapalooza-2026.webp', 600, 600),
    rotate: "-rotate-1",
    link: "/lollapalooza/"
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
    <section className="py-24 bg-brand-surface relative">
      <div className="container mx-auto px-6">

        {/* Header */}
        <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-16">
          Todo mundo <br className="md:hidden" /> quer ir pra cá
        </h2>

        {/* Polaroid Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 px-4">
          {POPULAR_DESTINATIONS.map((item) => (
            <Link
              key={item.link}
              to={item.link}
              className={`
                        group bg-white p-4 pb-8 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] 
                        transform transition-transform duration-500 hover:scale-105 hover:z-10 hover:shadow-2xl 
                        ${item.rotate} cursor-pointer relative block focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan rounded-lg
                    `}
            >
              {/* Fake Tape */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-sm border-l border-r border-white/60 rotate-1 shadow-sm z-20"></div>

              {/* Image Area */}
              <div className="aspect-square w-full overflow-hidden bg-zinc-100 mb-6 relative">
                <LazyImage
                  src={item.image}
                  width={600}
                  height={600}
                  alt={item.title}
                  loading="lazy"
                  fetchPriority="low"
                  className="w-full h-full object-cover filter contrast-[1.1] transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              {/* Caption (Handwritten feel) */}
              <div className="text-center">
                <h3 className="text-2xl font-black text-zinc-800 font-sans tracking-tight">{item.title}</h3>
              </div>

              {/* Sticker Decor */}
              <div className="absolute -bottom-4 -right-4 opacity-0 group-hover:opacity-100 transition duration-300 transform scale-0 group-hover:scale-110">
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
