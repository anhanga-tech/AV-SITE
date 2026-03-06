import React from 'react';
import { Users, Heart, Baby } from 'lucide-react';
import useIntersectionObserver from './hooks/useIntersectionObserver';

const AudienceCard = ({ icon: Icon, title, description, image }: { icon: any, title: string, description: string, image: string }) => (
  <div className="group relative overflow-hidden rounded-2xl h-80 flex flex-col justify-end p-6 shadow-lg">
    <div className="absolute inset-0">
      <img src={image} alt={`Público ${title} - Anhangá Viagens`} width="600" height="800" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-anhanga-darkBlue/90 via-anhanga-darkBlue/50 to-transparent"></div>
    </div>
    
    <div className="relative z-10 text-white">
      <div className="w-12 h-12 bg-anhanga-yellow text-anhanga-darkBlue rounded-full flex items-center justify-center mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" aria-hidden="true">
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-gray-200 opacity-90">{description}</p>
    </div>
  </div>
);

const Audience: React.FC = () => {
  const { elementRef, isVisible } = useIntersectionObserver(0.1);

  return (
    <section id="publico" className="py-24 bg-gray-50" aria-labelledby="audience-heading" ref={elementRef}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <h2 id="audience-heading" className="text-3xl md:text-5xl font-black text-anhanga-darkBlue mb-4">
            Para quem é esse pacote?
          </h2>
          <p className="text-xl text-gray-600">
            Criamos experiências sob medida para diferentes estilos de viajantes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '100ms' }}>
            <AudienceCard 
              icon={Baby}
              title="Famílias"
              description="Segurança e conforto para quem quer levar os filhos ou curtir em família sem perrengues."
              image="https://picsum.photos/seed/familyconcert/600/800"
            />
          </div>
          <div className={`animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '200ms' }}>
            <AudienceCard 
              icon={Heart}
              title="Casais"
              description="Uma experiência prática e memorável para curtir os shows a dois com tranquilidade."
              image="https://picsum.photos/seed/couplefestival/600/800"
            />
          </div>
          <div className={`animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '300ms' }}>
            <AudienceCard 
              icon={Users}
              title="Grupos de Amigos"
              description="Logística resolvida para vocês só se preocuparem em se divertir juntos."
              image="https://picsum.photos/seed/friendsfun/600/800"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Audience;