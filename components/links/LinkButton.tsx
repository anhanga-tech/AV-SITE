import React from 'react';
import { Link } from 'react-router-dom';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { withTrackingParams, applyOriginToMessage, pushLinksPageClick } from '../../utils/linksTracking';
import type { LinkItem } from '../../data/linksPage';
import { ICON_MAP } from './linkIcons';

interface LinkButtonProps {
    item: LinkItem;
    /**
     * Query de rastreio já resolvida pelo LinksPage. Vem vazia no primeiro render (SSR e
     * hidratação) e é preenchida depois da montagem — /links é prerenderizada, então ler
     * `window.location.search` durante o render faria o HTML do servidor divergir do
     * cliente em todo `href`.
     */
    search: string;
    /** classes extra (ex.: margem de ritmo na fronteira entre tiers) */
    className?: string;
}

// Tier de peso: ações (WhatsApp/quiz/utilidades — com ícone ou sublabel) ganham peso físico cheio;
// destinos "secos" ficam mais leves. Exportado para o LinksPage marcar a quebra de ritmo entre tiers.
export function isPrimaryLink(item: LinkItem): boolean {
    return Boolean(item.highlight) || Boolean(item.icon) || Boolean(item.sublabel);
}

// Slot de ícone com largura fixa garante que todos os rótulos alinhem na mesma coluna,
// com ou sem ícone — o que evita o efeito "ziguezague" de bordas esquerdas desiguais.
//
// Padding, gap e slot de ícone em px (e não nas escalas em rem do Tailwind): sob zoom de
// texto a 200% o chrome em rem dobrava junto com a fonte e sobravam 80px de 240 para o
// rótulo, empurrando a página para scroll horizontal (WCAG 1.4.10 Reflow). Em px o chrome
// fica parado e o texto cresce para dentro do espaço. Os valores são idênticos aos de
// `px-5`/`gap-4`/`w-6` no zoom padrão — e px é a unidade que o DESIGN.md usa em spacing.
const baseClasses =
    'flex w-full items-center gap-[16px] rounded-2xl px-[20px] text-left font-semibold transition-[transform,box-shadow] duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-anhanga-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-anhanga-dark';

// Press-down físico (assinatura "O Diário de Bordo"): rest → hover → active, como um carimbo.
const pressPrimary =
    'shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none';
const pressSecondary =
    'shadow-[2px_2px_0_0_rgba(15,23,42,0.5)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_rgba(15,23,42,0.5)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none';

// Dois níveis de peso quebram a monotonia da pilha: ações (WhatsApp/quiz/utilidades) com
// peso físico cheio; destinos "secos" ficam mais leves e compactos, como uma lista de apoio.
function tierClasses(item: LinkItem): string {
    if (item.highlight) {
        return `min-h-[4.5rem] py-4 text-base bg-anhanga-yellow text-anhanga-darkBlue ${pressPrimary}`;
    }
    if (isPrimaryLink(item)) {
        return `min-h-[4.5rem] py-4 text-base bg-white text-anhanga-darkBlue ${pressPrimary}`;
    }
    return `min-h-[3.25rem] py-3 text-base bg-white/90 text-anhanga-darkBlue ${pressSecondary}`;
}

export const LinkButton: React.FC<LinkButtonProps> = ({ item, search, className: extraClassName }) => {
    const className = `${baseClasses} ${tierClasses(item)}${extraClassName ? ` ${extraClassName}` : ''}`;
    const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined;

    const content = (
        <>
            <span className="flex w-[24px] shrink-0 items-center justify-center" aria-hidden="true">
                {IconComponent ? <IconComponent size={22} weight="fill" /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                {/* Sem `truncate`: `white-space: nowrap` cortava o rótulo com reticências em
                    zoom de texto a 200% (perda de conteúdo, WCAG 1.4.4). As alturas dos tiers
                    são `min-h`, não fixas, então a segunda linha cabe sem mexer no ritmo. */}
                <span data-testid="link-label" className="text-balance break-words">{item.label}</span>
                {item.sublabel ? (
                    <span className="text-xs font-normal text-anhanga-darkBlue/80">{item.sublabel}</span>
                ) : null}
            </span>
        </>
    );

    if (item.type === 'whatsapp') {
        const href = getWhatsAppLink(applyOriginToMessage(item.whatsappMessage ?? '', search));
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

    const to = withTrackingParams(item.href ?? '/', search);
    return (
        <Link to={to} className={className} data-testid={`link-${item.id}`}
              onClick={() => pushLinksPageClick(item, to)}>
            {content}
        </Link>
    );
};

export default LinkButton;
