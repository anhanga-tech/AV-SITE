import React from 'react';

const Footer: React.FC = () => {
  const logoUrl = `${import.meta.env.BASE_URL}assets/LOGO ANHANGA VIAGENS - BRANCO.svg`;

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0">
            <img
              src={logoUrl}
              alt="Anhangá Viagens"
              width="154"
              height="80"
              className="h-20 w-auto brightness-0 invert opacity-90"
            />
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center md:text-left text-sm">
          <p className="mb-2">© {new Date().getFullYear()} Anhangá Viagens. Todos os direitos reservados.</p>
          <p>
            Anhangá Viagens - Especialistas em experiências.
            <br className="md:hidden" />
            Pacotes de viagem para eventos e festivais.
          </p>
          <p className="mt-4 text-xs opacity-50">
            Nota: Este site comercializa pacotes de viagem (hospedagem, transporte e turismo). Ingressos para o evento não estão inclusos no pacote base.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
