import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEO } from '../../components/SEO';
import OrlandoApp from '../../components/landings/orlando/OrlandoApp';
import './orlando.css';

const OrlandoLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Orlando: Onde a Magia Acontece"
        description="Planeje sua viagem para Orlando com roteiros personalizados, parques temáticos e suporte especializado da Anhangá."
        canonical="https://www.anhanga.tur.br/orlando"
      />
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <OrlandoApp />
    </>
  );
};

export default OrlandoLanding;
