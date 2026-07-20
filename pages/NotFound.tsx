import React from 'react';
import { MapPin, Home as HomeIcon, Compass, BookOpen, ArrowLeft } from 'lucide-react';
import { Seo } from '../components/Seo';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { getBlogHomeUrl } from '../utils/blog';

const SITE_URL = 'https://www.anhanga.tur.br';

const NotFound: React.FC = () => {
  return (
    <>
      <Seo
        title="Página não encontrada"
        description="A página que você procura não foi encontrada. Explore nossos roteiros personalizados e planeje sua próxima aventura."
        robots="noindex, follow"
        canonical={`${SITE_URL}/404/`}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: `${SITE_URL}/` },
          { name: 'Página não encontrada', item: `${SITE_URL}/404/` }
        ]}
      />

      <section data-testid="not-found-section" className="min-h-[70vh] flex items-center justify-center pt-48 pb-20 px-6 bg-brand-light relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 size-64 bg-brand-cyan/5 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-10 size-80 bg-brand-yellow/5 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center justify-center size-24 rounded-full bg-white shadow-xl mb-8 animate-float">
            <Compass className="size-12 text-brand-cyan" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-brand-dark mb-6 leading-tight">
            Ops! Essa página <br />
            <span className="text-brand-cyan">pegou outro rumo.</span>
          </h1>

          <p className="text-xl text-zinc-600 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Parece que o destino que você procurava não está no mapa. Que tal recomeçar a sua jornada por um desses caminhos?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <a
              href={`${SITE_URL}/`}
              className="flex items-center gap-4 p-6 bg-white rounded-3xl border-2 border-transparent hover:border-brand-cyan shadow-sm hover:shadow-xl transition duration-300 group"
            >
              <div className="size-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-cyan group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                <HomeIcon className="size-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-brand-dark">Página Inicial</p>
                <p className="text-sm text-zinc-500">Voltar ao começo</p>
              </div>
            </a>

            <a
              href={getBlogHomeUrl()}
              className="flex items-center gap-4 p-6 bg-white rounded-3xl border-2 border-transparent hover:border-brand-cyan shadow-sm hover:shadow-xl transition duration-300 group"
            >
              <div className="size-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-cyan group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                <BookOpen className="size-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-brand-dark">Blog de Viagens</p>
                <p className="text-sm text-zinc-500">Dicas e roteiros</p>
              </div>
            </a>

            <a
              href={`${SITE_URL}/orlando/`}
              className="flex items-center gap-4 p-6 bg-white rounded-3xl border-2 border-transparent hover:border-brand-cyan shadow-sm hover:shadow-xl transition duration-300 group"
            >
              <div className="size-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-cyan group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                <MapPin className="size-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-brand-dark">Orlando</p>
                <p className="text-sm text-zinc-500">Magia e diversão</p>
              </div>
            </a>

            {/* Last 2 cards centered in their own row */}
            <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:max-w-2xl lg:mx-auto w-full">
              <a
                href={`${SITE_URL}/beto-carrero/`}
                className="flex items-center gap-4 p-6 bg-white rounded-3xl border-2 border-transparent hover:border-brand-cyan shadow-sm hover:shadow-xl transition duration-300 group"
              >
                <div className="size-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-cyan group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                  <MapPin className="size-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-brand-dark">Beto Carrero</p>
                  <p className="text-sm text-zinc-500">Aventura no Brasil</p>
                </div>
              </a>

              <a
                href={`${SITE_URL}/lollapalooza/`}
                className="flex items-center gap-4 p-6 bg-white rounded-3xl border-2 border-transparent hover:border-brand-cyan shadow-sm hover:shadow-xl transition duration-300 group"
              >
                <div className="size-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-cyan group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                  <MapPin className="size-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-brand-dark">Lollapalooza</p>
                  <p className="text-sm text-zinc-500">Música e experiência</p>
                </div>
              </a>
            </div>
          </div>

          <a
            href={`${SITE_URL}/`}
            className="inline-flex items-center gap-2 text-brand-cyan font-bold hover:gap-4 transition-[gap,color] duration-300"
          >
            <ArrowLeft className="size-5" />
            Voltar para a Home
          </a>
        </div>

        {/* Wavy Bottom Separator */}
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
          <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff"></path>
          </svg>
        </div>
      </section>
    </>
  );
};

export default NotFound;
