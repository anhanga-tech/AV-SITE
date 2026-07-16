import React, { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { CorpNav } from '@/components/landings/corporativo/CorpNav';
import { CorpHero } from '@/components/landings/corporativo/CorpHero';
import { CorpPillars } from '@/components/landings/corporativo/CorpPillars';
import { CorpProcess } from '@/components/landings/corporativo/CorpProcess';
import { CorpWhatsAppBand } from '@/components/landings/corporativo/CorpWhatsAppBand';
import { CorpContactSection } from '@/components/landings/corporativo/CorpContactSection';
import { CorpFooter } from '@/components/landings/corporativo/CorpFooter';

const CorporativoLanding: React.FC = () => {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'landing_view',
                campaign: 'corporativo',
                landing_type: 'b2b',
            });
        }
    }, []);

    return (
        <>
            <Seo
                title="Viagens Corporativas | Anhangá Viagens"
                description="Viagens corporativas sob medida para micro e pequenas empresas. Incentivo, confraternização, eventos e viagens a trabalho com atendimento dedicado."
                canonical="https://www.anhanga.tur.br/corporativo/"
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Início', item: 'https://www.anhanga.tur.br/' },
                    { name: 'Corporativo', item: 'https://www.anhanga.tur.br/corporativo/' },
                ]}
            />
            {/*
              No-JS / pre-hydration fallback: framer-motion serializes `initial`
              styles (opacity:0) into the prerendered HTML. Without JS the reveal
              never fires, so the sections would ship blank. This forces them
              visible when scripts are disabled; with JS it's inert and the
              entrances animate normally.
            */}
            <noscript>
                <style>{`[data-corp-landing] [style*="opacity"]{opacity:1!important}`}</style>
            </noscript>
            <MotionConfig reducedMotion="user">
            <div data-corp-landing className="bg-brand-surface min-h-screen font-sans">
                <CorpNav />
                <CorpHero />
                <CorpPillars />
                <CorpProcess />
                <CorpWhatsAppBand />
                <CorpContactSection />
                <nav aria-label="Outros serviços" className="bg-brand-surface py-12 border-t border-zinc-100">
                    <div className="container mx-auto px-6 text-center">
                        <p className="text-sm text-zinc-500 font-medium mb-4">Conheça também</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link to="/consultoria-de-viagem/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action">
                                Consultoria de Viagem
                            </Link>
                            <Link to="/melhor-idade/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action">
                                Viagens Melhor Idade
                            </Link>
                            <Link to="/curadoria-cruzeiros-brasil/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action">
                                Cruzeiros pelo Brasil
                            </Link>
                        </div>
                    </div>
                </nav>
                <CorpFooter />
            </div>
            </MotionConfig>
        </>
    );
};

export default CorporativoLanding;
