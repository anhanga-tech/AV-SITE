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

const baseClasses =
    'flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-semibold shadow-sm transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-anhanga-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-anhanga-darkBlue';

function variantClasses(highlight?: boolean): string {
    return highlight
        ? 'bg-anhanga-yellow text-anhanga-darkBlue hover:brightness-95'
        : 'bg-white/95 text-anhanga-darkBlue hover:bg-white';
}

export const LinkButton: React.FC<LinkButtonProps> = ({ item }) => {
    const className = `${baseClasses} ${variantClasses(item.highlight)}`;
    const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined;

    const content = (
        <>
            {IconComponent ? <IconComponent size={22} weight="fill" aria-hidden="true" /> : null}
            <span className="flex flex-col text-left">
                <span>{item.label}</span>
                {item.sublabel ? <span className="text-xs font-normal opacity-70">{item.sublabel}</span> : null}
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
