import React, { useEffect } from 'react';
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
            <div className="bg-brand-surface min-h-screen font-sans">
                <CorpNav />
                <CorpHero />
                <CorpPillars />
                <CorpProcess />
                <CorpWhatsAppBand />
                <CorpContactSection />
                <CorpFooter />
            </div>
        </>
    );
};

export default CorporativoLanding;
