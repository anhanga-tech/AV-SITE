import React from 'react';
import { Link } from 'react-router-dom';
import { WhatsappLogo, Compass, Globe, ShieldCheck, SimCard, type Icon } from '@phosphor-icons/react';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { withTrackingParams, pushLinksPageClick } from '../../utils/linksTracking';
import type { LinkItem } from '../../data/linksPage';

const ICON_MAP: Record<string, Icon> = {
    WhatsappLogo,
    Compass,
    Globe,
    ShieldCheck,
    SimCard,
};

interface LinkButtonProps {
    item: LinkItem;
}

// Slot de ícone com largura fixa garante que todos os rótulos alinhem na mesma coluna,
// com ou sem ícone — o que evita o efeito "ziguezague" de bordas esquerdas desiguais.
const baseClasses =
    'flex w-full items-center gap-4 rounded-2xl px-5 text-left font-semibold transition-[transform,box-shadow] duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-anhanga-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-anhanga-darkBlue';

// Press-down físico (assinatura "O Diário de Bordo"): rest → hover → active, como um carimbo.
const pressPrimary =
    'shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none';
const pressSecondary =
    'shadow-[2px_2px_0_0_rgba(15,23,42,0.5)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_rgba(15,23,42,0.5)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none';

// Dois níveis de peso quebram a monotonia da pilha: ações (WhatsApp/quiz/utilidades) com
// peso físico cheio; destinos "secos" ficam mais leves e compactos, como uma lista de apoio.
function tierClasses(item: LinkItem): string {
    const isPrimary = item.highlight || Boolean(item.icon) || Boolean(item.sublabel);
    if (item.highlight) {
        return `min-h-[4.5rem] py-4 text-base bg-anhanga-yellow text-anhanga-darkBlue ${pressPrimary}`;
    }
    if (isPrimary) {
        return `min-h-[4.5rem] py-4 text-base bg-white text-anhanga-darkBlue ${pressPrimary}`;
    }
    return `min-h-[3.25rem] py-3 text-[0.95rem] bg-white/90 text-anhanga-darkBlue ${pressSecondary}`;
}

export const LinkButton: React.FC<LinkButtonProps> = ({ item }) => {
    const className = `${baseClasses} ${tierClasses(item)}`;
    const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined;

    const content = (
        <>
            <span className="flex w-6 shrink-0 items-center justify-center" aria-hidden="true">
                {IconComponent ? <IconComponent size={22} weight="fill" /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{item.label}</span>
                {item.sublabel ? (
                    <span className="text-xs font-normal text-anhanga-darkBlue/80">{item.sublabel}</span>
                ) : null}
            </span>
        </>
    );

    if (item.type === 'whatsapp') {
        const href = getWhatsAppLink(item.whatsappMessage ?? '', { appendTrackingRef: true });
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}
               data-testid={`link-${item.id}`} onClick={() => pushLinksPageClick(item, href)}>
                {content}
            </a>
        );
    }

    if (item.type === 'external') {
        const href = item.href ?? '#';
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}
               data-testid={`link-${item.id}`} onClick={() => pushLinksPageClick(item, href)}>
                {content}
            </a>
        );
    }

    const to = withTrackingParams(item.href ?? '/');
    return (
        <Link to={to} className={className} data-testid={`link-${item.id}`}
              onClick={() => pushLinksPageClick(item, to)}>
            {content}
        </Link>
    );
};

export default LinkButton;
