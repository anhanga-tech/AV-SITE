import React, { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { CorpNav } from '@/components/landings/corporativo/CorpNav';
import { CorpHero } from '@/components/landings/corporativo/CorpHero';
import { CorpPillars } from '@/components/landings/corporativo/CorpPillars';
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
            <div className="bg-brand-surface min-h-screen font-sans">
                <CorpNav />
                <CorpHero />
                <CorpPillars />
                <CorpWhatsAppBand />
                <CorpContactSection />
                <nav aria-label="Outros serviços" className="bg-brand-surface py-12 border-t border-zinc-100">
                    <div className="container mx-auto px-6 text-center">
                        <p className="text-sm text-zinc-500 font-medium mb-4">Conheça também</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <a href="https://www.anhanga.tur.br/consultoria-de-viagem/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
                                Consultoria de Viagem
                            </a>
                            <a href="https://www.anhanga.tur.br/melhor-idade/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
                                Viagens Melhor Idade
                            </a>
                            <a href="https://www.anhanga.tur.br/curadoria-cruzeiros-brasil/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
                                Cruzeiros pelo Brasil
                            </a>
                        </div>
                    </div>
                </nav>
                <CorpFooter />
            </div>
        </>
    );
};

export default CorporativoLanding;
