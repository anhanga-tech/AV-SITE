import React from 'react';
import { getBetoAssetUrl } from './assetPath';
import { useFooterRuntimeMetadata } from '../../../lib/footer-runtime';

const Footer: React.FC = () => {
  const runtimeMetadata = useFooterRuntimeMetadata();

  return (
    <footer className="bg-fun-dark py-16 text-white text-center relative overflow-hidden">
      {/* Background Pattern to match other sections */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center relative z-10">
        
        {/* Logo Container - Removed white background to accommodate white logo */}
        <div className="mb-8 inline-block">
          <img 
            src={getBetoAssetUrl('LOGO ANHANGA VIAGENS - BRANCO.svg')}
            alt="Anhangá Viagens" 
            width="247"
            height="128"
            className="h-24 md:h-32 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>

        <p className="opacity-80 font-sans font-semibold text-lg mb-8 max-w-md mx-auto">
          Levando alegria sem burocracia para suas férias.
        </p>
        
        <p className="text-sm opacity-40">
          &copy; {runtimeMetadata ? `${runtimeMetadata.currentYear} ` : ''}Anhangá Viagens. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
