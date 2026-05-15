import React, { useEffect } from 'react';
import { SEO } from '../../components/SEO';
import { BpdNav } from '../../components/landings/brazil-promotion-day/BpdNav';
import { BpdHero } from '../../components/landings/brazil-promotion-day/BpdHero';
import { BpdPillars } from '../../components/landings/brazil-promotion-day/BpdPillars';
import { BpdWhatsAppBand } from '../../components/landings/brazil-promotion-day/BpdWhatsAppBand';
import { BpdContactSection } from '../../components/landings/brazil-promotion-day/BpdContactSection';
import { BpdFooter } from '../../components/landings/brazil-promotion-day/BpdFooter';

const BrazilPromotionDayLanding: React.FC = () => {
    // Push campaign data to GTM dataLayer on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'landing_view',
                campaign: 'brazil-promotion-day-2026',
                landing_type: 'event_qr',
            });
        }
    }, []);

    return (
        <>
            <SEO
                title="Anhangá Viagens na Brazil Promotion Day | Roteiros Personalizados"
                description="Conheça a Anhangá Viagens na Brazil Promotion Day. Agência de viagens em SP com roteiros exclusivos feitos do zero, sem pacote pronto."
                canonical="https://www.anhanga.tur.br/brazil-promotion-day/"
            />
            <div className="bg-[#fffdf5] min-h-screen font-sans">
                <BpdNav />
                <BpdHero />
                <BpdPillars />
                <BpdWhatsAppBand />
                <BpdContactSection />
                <BpdFooter />
            </div>
        </>
    );
};

export default BrazilPromotionDayLanding;
