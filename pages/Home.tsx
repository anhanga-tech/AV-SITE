import React, { useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import Highlights from '../components/Highlights';
import Categories from '../components/Categories';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Blog from '../components/Blog';
import FAQ from '../components/FAQ';
import CallToAction from '../components/CallToAction';

import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';

import { SEO } from '../components/SEO';

const Destinations = lazy(() => import('../components/Destinations'));

const Home: React.FC = () => {
  const location = useLocation();
  const [shouldLoadDestinations, setShouldLoadDestinations] = React.useState(false);
  const destinationsSentinelRef = React.useRef<HTMLDivElement>(null);

  // Efeito para lidar com navegação vinda de outras páginas (ex: Blog -> Seção Home)
  useEffect(() => {
    // Verifica se há um targetId no estado da navegação
    if (location.state && location.state.targetId) {
      const targetId = location.state.targetId;
      const element = document.getElementById(targetId);

      if (element) {
        // Pequeno timeout para garantir que o DOM esteja pronto
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Limpeza opcional do estado (embora o history mantenha, evita scrolls indesejados em refresh simples sem limpar history)
        window.history.replaceState({}, document.title);
      }
    }
  }, [location]);

  useEffect(() => {
    if (!destinationsSentinelRef.current) return;
    if (shouldLoadDestinations) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          setShouldLoadDestinations(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px', threshold: 0.01 }
    );

    observer.observe(destinationsSentinelRef.current);
    return () => observer.disconnect();
  }, [shouldLoadDestinations]);

  return (
    <>
      <SEO
        title="Roteiros Personalizados"
        description="Anhangá: Agência de viagens com roteiros personalizados. Experiências transformadoras em Orlando, Machu Picchu, Europa e Brasil."
        canonical="https://www.anhanga.tur.br/"
      />
      <OrganizationSchema />
      <BreadcrumbSchema items={[{ name: 'Home', item: 'https://www.anhanga.tur.br/' }]} />
      <Hero />
      <Highlights />
      <Categories />
      <div id="destinos" ref={destinationsSentinelRef} />
      {shouldLoadDestinations ? (
        <Suspense fallback={<section className="py-24 bg-[#fffdf5]" />}>
          <Destinations />
        </Suspense>
      ) : (
        <section className="py-24 bg-[#fffdf5]" />
      )}
      <HowItWorks />
      <FAQ />
      <Testimonials />
      <Blog />
      <CallToAction />
    </>
  );
};

export default Home;
