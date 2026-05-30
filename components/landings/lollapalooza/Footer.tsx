import React from 'react';
import { useFooterRuntimeMetadata } from '../../../lib/footer-runtime';
import { BRAND_LOGO_WHITE_URL } from '../../../lib/media-assets';

const Footer: React.FC = () => {
  const logoUrl = BRAND_LOGO_WHITE_URL;
  const runtimeMetadata = useFooterRuntimeMetadata();

  return (
    <footer className="bg-zinc-900 text-zinc-400 py-12 border-t border-zinc-800">
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

        <div className="border-t border-zinc-800 pt-8 text-center md:text-left text-sm">
          <p className="mb-2">© {runtimeMetadata ? `${runtimeMetadata.currentYear} ` : ''}Anhangá Viagens. Todos os direitos reservados.</p>
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
