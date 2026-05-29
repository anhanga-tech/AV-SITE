import { m } from 'framer-motion';
import {
    InstagramLogo,
    FacebookLogo,
    WhatsappLogo,
    MapPin,
    Phone,
    Envelope,
    Sparkle,
} from '@phosphor-icons/react';
import { SOCIAL_LINKS, fadeUp } from './constants';

interface BpdContactInfoProps {
    whatsappUrl: string;
}

export function BpdContactInfo({ whatsappUrl }: BpdContactInfoProps) {
    return (
        <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            custom={0}
        >
            <div className="inline-block relative mb-4">
                <span className="absolute inset-0 bg-emerald-100 transform -skew-x-12 rounded-lg" />
                <span className="relative px-3 py-1 text-emerald-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                    <Sparkle className="size-4" weight="fill" /> Fale com a gente
                </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight mb-6">
                Prefere que a gente <br />
                <span className="text-brand-cyan">
                    entre em contato?
                </span>
            </h2>

            <p className="text-zinc-500 font-medium text-lg leading-relaxed mb-10 max-w-sm">
                Preencha o formulário e um consultor entra em contato pelo canal que você preferir, sem enrolação.
            </p>

            <ul className="space-y-5 mb-10">
                {[
                    { icon: Phone, label: '(11) 5283-3309', href: 'tel:+551152833309' },
                    { icon: Envelope, label: 'contato@anhanga.tur.br', href: 'mailto:contato@anhanga.tur.br' },
                    { icon: MapPin, label: 'Av. Dom Pedro I, 773 — Vila Monumento, SP', href: null },
                ].map(({ icon: Icon, label, href }) => (
                    <li key={label} className="flex items-start gap-4">
                        <div className="size-10 rounded-xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="size-5 text-blue-600" weight="fill" />
                        </div>
                        {href ? (
                            <a href={href} className="font-semibold text-zinc-700 hover:text-brand-cyan transition-colors duration-150 pt-1.5">
                                {label}
                            </a>
                        ) : (
                            <span className="font-semibold text-zinc-700 leading-snug pt-1.5">{label}</span>
                        )}
                    </li>
                ))}
            </ul>

            <div>
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-4">
                    Nos siga nas redes
                </p>
                <div className="flex gap-3">
                    {[
                        { href: SOCIAL_LINKS.instagram, icon: InstagramLogo, label: 'Instagram da Anhangá Viagens' },
                        { href: SOCIAL_LINKS.facebook, icon: FacebookLogo, label: 'Facebook da Anhangá Viagens' },
                        { href: whatsappUrl, icon: WhatsappLogo, label: 'WhatsApp da Anhangá Viagens', contact: true },
                    ].map(({ href, icon: Icon, label, contact }) => (
                        <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-11 rounded-xl bg-white border-2 border-zinc-200 flex items-center justify-center text-zinc-500 hover:border-brand-cyan hover:text-brand-cyan shadow-[2px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-hard-yellow hover:-translate-y-1 transition duration-200"
                            aria-label={label}
                            {...(contact ? { 'data-contact-intent': true, 'data-tracking': 'social-whatsapp-brazil-promotion-day' } : {})}
                        >
                            <Icon className="size-5" weight="fill" />
                        </a>
                    ))}
                </div>
            </div>
        </m.div>
    );
}
