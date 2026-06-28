import { m } from 'framer-motion';
import { WhatsappLogo, CheckCircle } from '@phosphor-icons/react';

interface CorpSuccessStateProps {
    whatsappUrl: string;
}

export function CorpSuccessState({ whatsappUrl }: CorpSuccessStateProps) {
    return (
        <output className="flex flex-col items-center text-center p-8 sm:p-12" aria-live="polite">
            <m.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                <CheckCircle className="size-16 text-emerald-500 mb-4" weight="fill" />
            </m.div>
            <h3 className="text-2xl font-black text-brand-dark mb-3">
                Mensagem recebida!
            </h3>
            <p className="text-zinc-500 max-w-xs leading-relaxed mb-8">
                Um consultor da Anhangá vai entrar em contato em breve. Fique de olho no WhatsApp ou e-mail.
            </p>
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp btn-specialist flex items-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-xl font-bold text-sm shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
                data-contact-intent
                data-tracking="success-corporativo"
            >
                <WhatsappLogo className="size-4" weight="fill" />
                Ou fale agora no WhatsApp
            </a>
        </output>
    );
}
