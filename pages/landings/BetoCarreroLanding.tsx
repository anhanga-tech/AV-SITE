import React from 'react';
import { Helmet } from 'react-helmet-async';
import BetoCarreroApp from '../../components/landings/beto-carrero/BetoCarreroApp';
import { SEO } from '../../components/SEO';

const BetoCarreroLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Beto Carrero Sem Stress"
        description="Pacotes completos para Beto Carrero com aéreo, hotel e ingresso. Planejamento sem burocracia com suporte Anhangá."
        canonical="https://www.anhanga.tur.br/beto-carrero"
      />
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <BetoCarreroApp />
    </>
  );
};

export default BetoCarreroLanding;
