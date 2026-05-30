import { LandingWhatsAppBand } from '../shared/LandingWhatsAppBand';

export function CorpWhatsAppBand() {
    return (
        <LandingWhatsAppBand
            source="corporativo"
            subtitle="Bate-papo rápido"
            headline={<>Quer uma proposta? <br /><span className="text-brand-cyan">Chama no WhatsApp.</span></>}
        />
    );
}
