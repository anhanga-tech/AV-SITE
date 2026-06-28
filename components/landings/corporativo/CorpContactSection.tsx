import { useWhatsAppLink } from '@/utils/whatsapp';
import { WHATSAPP_MESSAGE } from './constants';
import { CorpContactInfo } from './CorpContactInfo';
import { CorpContactForm } from './CorpContactForm';

export function CorpContactSection() {
    const whatsappUrl = useWhatsAppLink(WHATSAPP_MESSAGE, { appendTrackingRef: true });

    return (
        <section id="contato" className="py-24 bg-brand-surface relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 opacity-[0.3]"
                style={{ backgroundImage: 'radial-gradient(#c2d3e8 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
            />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
                    <CorpContactInfo whatsappUrl={whatsappUrl} />
                    <CorpContactForm whatsappUrl={whatsappUrl} />
                </div>
            </div>
        </section>
    );
}
