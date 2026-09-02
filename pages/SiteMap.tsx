import React from 'react';
import { Seo } from '../components/Seo';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { getAllPosts } from '../lib/mdx';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';

const CORE_LINKS = [
  { to: '/', label: 'Agência de Viagens em São Paulo' },
  { to: '/sobre/', label: 'Sobre a Anhangá Viagens' },
  { to: getBlogHomeUrl(), label: 'Blog de Viagens e Roteiros', external: true },
  { to: '/orlando/', label: 'Pacotes para Orlando' },
  { to: '/parques-brasil/', label: 'Parques do Brasil: qual escolher' },
  { to: '/beto-carrero/', label: 'Pacote Beto Carrero' },
  { to: '/melhor-idade/', label: 'Viagens para Melhor Idade' },
  { to: '/lollapalooza/', label: 'Lollapalooza Brasil' },
  { to: '/consultoria-de-viagem/', label: 'Consultoria de Viagem Personalizada' },
  { to: '/cruzeiros/', label: 'Cruzeiros pelo Brasil' },
  { to: '/corporativo/', label: 'Viagens Corporativas' },
  { to: '/quiz/', label: 'Quiz: Descubra Seu Destino Ideal' },
  { to: '/termos-de-uso/', label: 'Termos de Uso' },
  { to: '/politica-privacidade/', label: 'Política de Privacidade' },
  { to: '/exclusao-de-dados/', label: 'Exclusão de Dados' }
];

const SiteMap: React.FC = () => {
  return (
    <>
      <Seo
        title="Mapa do Site | Anhangá Viagens"
        description="Navegue pelas principais páginas da Anhangá Viagens: destinos, pacotes de viagem, blog com guias práticos, landings de eventos e páginas institucionais."
        canonical="https://www.anhanga.tur.br/mapa-do-site/"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Mapa do Site', item: 'https://www.anhanga.tur.br/mapa-do-site/' }
        ]}
      />
      <main className="min-h-screen bg-brand-surface pt-32 pb-24">
        <section className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-black text-brand-dark mb-6">Mapa do Site</h1>
          <p className="text-zinc-600 mb-10">Acesse rapidamente as principais áreas do site.</p>

          <h2 className="text-2xl font-extrabold text-brand-dark mb-4">Páginas Principais</h2>
          <ul className="space-y-3 mb-10">
            {CORE_LINKS.map((link) => (
              <li key={link.to}>
                <a href={link.to} className="text-brand-cyan hover:underline font-semibold">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-extrabold text-brand-dark mb-4">Blog</h2>
          <ul className="space-y-3">
            {getAllPosts().map((post) => (
              <li key={post.slug}>
                <a href={getBlogPostUrl(post.slug)} className="text-brand-cyan hover:underline font-semibold">
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
};

export default SiteMap;
