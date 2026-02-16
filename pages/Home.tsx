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
      <Suspense fallback={<section id="destinos" className="py-24 bg-[#fffdf5]" />}>
        <Destinations />
      </Suspense>
      <HowItWorks />
      <FAQ />
      <Testimonials />
      <Blog />
      <CallToAction />
    </>
  );
};

export default Home;
