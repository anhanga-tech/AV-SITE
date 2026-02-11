import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEO } from '../../components/SEO';
import LollapaloozaApp from '../../components/landings/lollapalooza/LollapaloozaApp';
import 'leaflet/dist/leaflet.css';
import './lollapalooza.css';

const LollapaloozaLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Lollapalooza 2026"
        description="Pacotes de viagem completos para o Lollapalooza 2026 com hospedagem, transporte e suporte dedicado Anhangá."
        canonical="https://www.anhanga.tur.br/lollapalooza-2026"
      />
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <LollapaloozaApp />
    </>
  );
};

export default LollapaloozaLanding;
