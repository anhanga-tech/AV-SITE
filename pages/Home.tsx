import React, { useEffect, Suspense, lazy } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Hero from '../components/Hero';

import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';

import { SEO } from '../components/SEO';

const Highlights = lazy(() => import('../components/Highlights'));
const Categories = lazy(() => import('../components/Categories'));
const Destinations = lazy(() => import('../components/Destinations'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const Blog = lazy(() => import('../components/Blog'));
const FAQ = lazy(() => import('../components/FAQ'));
const CallToAction = lazy(() => import('../components/CallToAction'));

const Home: React.FC = () => {
  const location = useLocation();
  const [shouldRenderBelowFold, setShouldRenderBelowFold] = React.useState(false);
  const [shouldLoadDestinations, setShouldLoadDestinations] = React.useState(false);
  const destinationsSentinelRef = React.useRef<HTMLDivElement>(null);

  // Efeito para lidar com navegação vinda de outras páginas (ex: Blog -> Seção Home)
  useEffect(() => {
    // Verifica se há um targetId no estado da navegação
    if (location.state && location.state.targetId) {
      setShouldRenderBelowFold(true);
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
    if (shouldRenderBelowFold) return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) {
        setShouldRenderBelowFold(true);
      }
      cleanup();
    };
    const onIntent = () => enable();
    const cleanup = () => {
      window.removeEventListener('scroll', onIntent);
      window.removeEventListener('pointerdown', onIntent);
      window.removeEventListener('keydown', onIntent);
    };

    window.addEventListener('scroll', onIntent, { passive: true, once: true });
    window.addEventListener('pointerdown', onIntent, { passive: true, once: true });
    window.addEventListener('keydown', onIntent, { passive: true, once: true });

    const timer = window.setTimeout(enable, 10000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cleanup();
    };
  }, [shouldRenderBelowFold]);

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
        title="Agência de viagens em São Paulo com roteiros personalizados | Anhangá Viagens"
        description="Planejamento de viagens personalizadas com atendimento consultivo em São Paulo. Pacotes para Orlando, Beto Carrero, Lollapalooza 2026 e experiências para público 50+."
        canonical="https://www.anhanga.tur.br/"
        keywords="agência de viagens em São Paulo, viagens personalizadas, pacotes para Orlando, pacote Beto Carrero, viagem Lollapalooza 2026, viagens melhor idade 50+, roteiros exclusivos"
      />
      <OrganizationSchema />
      <BreadcrumbSchema items={[{ name: 'Home', item: 'https://www.anhanga.tur.br/' }]} />
      <Hero />

      {/* Seção SEO estática — sempre renderizada para crawlers */}
      <section className="bg-[#fffdf5] border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-dark mb-4">
            Agência de viagens em São Paulo com atendimento personalizado
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            A <strong>Anhangá Viagens</strong> é uma agência de viagens boutique em São Paulo especializada em{' '}
            <strong>roteiros personalizados</strong> e experiências únicas. Montamos{' '}
            <strong>pacotes de viagem</strong> sob medida para quem quer viajar com planejamento, conforto e
            suporte real — antes, durante e depois da viagem.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Seja para curtir grandes festivais como o{' '}
            <Link to="/lollapalooza-2026" className="text-brand-cyan font-semibold hover:underline">
              Lollapalooza 2026
            </Link>
            , explorar a magia de{' '}
            <Link to="/orlando" className="text-brand-cyan font-semibold hover:underline">
              Orlando e Disney
            </Link>
            , conhecer o{' '}
            <Link to="/beto-carrero" className="text-brand-cyan font-semibold hover:underline">
              Beto Carrero World
            </Link>{' '}
            ou embarcar em uma jornada de turismo de transformação para o público 50+, a Anhangá cuida de cada
            detalhe da sua viagem.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/lollapalooza-2026"
              className="px-4 py-2 rounded-full bg-brand-cyan text-white font-semibold text-sm hover:bg-brand-cyan/90 transition-colors"
            >
              Lollapalooza 2026
            </Link>
            <Link
              to="/orlando"
              className="px-4 py-2 rounded-full border border-brand-cyan/40 text-brand-dark font-semibold text-sm hover:border-brand-cyan transition-colors"
            >
              Pacotes para Orlando
            </Link>
            <Link
              to="/beto-carrero"
              className="px-4 py-2 rounded-full border border-brand-cyan/40 text-brand-dark font-semibold text-sm hover:border-brand-cyan transition-colors"
            >
              Beto Carrero World
            </Link>
          </div>
        </div>
      </section>

      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="experiencia" className="py-24 bg-[#fffdf5]" />}>
            <Highlights />
          </Suspense>
          <Suspense fallback={<section className="py-24 bg-[#fffdf5]" />}>
            <Categories />
          </Suspense>
        </>
      ) : (
        <>
          <section id="experiencia" className="py-24 bg-[#fffdf5]" />
          <section className="py-24 bg-[#fffdf5]" />
        </>
      )}
      <div id="destinos" ref={destinationsSentinelRef} />
      {shouldRenderBelowFold && shouldLoadDestinations ? (
        <Suspense fallback={<section className="py-24 bg-[#fffdf5]" />}>
          <Destinations />
        </Suspense>
      ) : (
        <section className="py-24 bg-[#fffdf5]" />
      )}
      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="como-funciona" className="py-24 bg-[#fffdf5]" />}>
            <HowItWorks />
          </Suspense>
          <Suspense fallback={<section id="faq" className="py-24 bg-[#fffdf5]" />}>
            <FAQ />
          </Suspense>
          <Suspense fallback={<section id="depoimentos" className="py-24 bg-[#fffdf5]" />}>
            <Testimonials />
          </Suspense>
          <Suspense fallback={<section id="blog" className="py-24 bg-[#fffdf5]" />}>
            <Blog />
          </Suspense>
          <Suspense fallback={<section id="contato" className="py-24 bg-[#fffdf5]" />}>
            <CallToAction />
          </Suspense>
        </>
      ) : (
        <>
          <section id="como-funciona" className="py-24 bg-[#fffdf5]" />
          <section id="faq" className="py-24 bg-[#fffdf5]" />
          <section id="depoimentos" className="py-24 bg-[#fffdf5]" />
          <section id="blog" className="py-24 bg-[#fffdf5]" />
          <section id="contato" className="py-24 bg-[#fffdf5]" />
        </>
      )}
    </>
  );
};

export default Home;
