import { LandingWhatsAppBand } from '../shared/LandingWhatsAppBand';

const HEADLINE = <>Quer uma proposta? <br /><span className="text-brand-cyan">Chama no WhatsApp.</span></>;

export function CorpWhatsAppBand() {
    return <LandingWhatsAppBand source="corporativo" headline={HEADLINE} />;
}
