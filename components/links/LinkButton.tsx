import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { withTrackingParams, applyOriginToMessage, pushLinksPageClick } from '../../utils/linksTracking';
import { openConsultoriaBooking, CONSULTORIA_BOOKING_URL } from '../../lib/cal-embed';
import { openContactModal } from '../../utils/contactForm';
import type { LinkItem } from '../../data/linksPage';
import { ICON_MAP } from './linkIcons';

interface LinkButtonProps {
    item: LinkItem;
    /**
     * Query de rastreio já resolvida pelo LinksPage, ou `null` enquanto ela é desconhecida
     * (HTML prerenderizado, antes da hidratação). `null` faz a mensagem do WhatsApp omitir
     * a origem em vez de cravar o padrão — ver `resolveOriginClause`. Os UTMs dos links
     * internos entram na hidratação; um clique antes disso perde a query, mas
     * `utils/whatsapp.ts` já persistiu os UTMs em sessionStorage e cookie no import, então
     * a página de destino recupera a atribuição.
     */
    search: string | null;
    /** classes extra (ex.: margem de ritmo na fronteira entre tiers) */
    className?: string;
    /**
     * Emblema circular Safira Profunda ao redor do ícone — reservado aos 4 destinos em
     * destaque (LinksPage.tsx) para sinalizar "isto é curadoria", não a lista inteira.
     * Sem tocar no vocabulário de sombra: hard shadow continua exclusiva de highlight/primary
     * (ver `tierClasses`). Safira Profunda é a cor documentada em DESIGN.md para "superfícies
     * que precisam de peso de marca sem a leveza do Céu Vivo" — o uso de badge é exatamente
     * esse caso, não uma cor inventada para a ocasião.
     */
    iconBadge?: boolean;
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
    'flex w-full items-center gap-[16px] rounded-2xl px-[20px] text-left font-semibold transition-[transform,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action';

// Press-down físico (assinatura "O Diário de Bordo"): rest → hover → active, como um carimbo.
// Reservado à ação de maior intenção (WhatsApp + orçamento) — PRODUCT.md: "peso físico só onde
// se age... reservados aos pontos de ação". Um hard-shadow espalhado pela pilha inteira apaga
// o sinal de que ali existe UMA ação dominante.
const pressPrimary =
    'shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none';
// Links de navegação/produto (destinos, quiz, site, seguro-viagem, chip/eSIM): elevação
// ambiente (`shadow-float`, o token do DESIGN.md para superfícies em repouso), sem offset
// direcional — continuam clicáveis, mas sem competir com o carimbo do tier primary.
const pressQuiet = 'shadow-float transition-shadow duration-150 ease-out hover:shadow-float-lg';

// Dois níveis de peso quebram a monotonia da pilha: a ação de maior intenção (`highlight` ou
// `primary`) ganha peso físico cheio; todo o resto — inclusive links com ícone/sublabel — fica
// no tier quieto. Ícone e sublabel são metadados de conteúdo, não proxy de prioridade.
function tierClasses(item: LinkItem): string {
    if (item.highlight) {
        return `min-h-[4.5rem] py-4 text-base bg-anhanga-yellow text-anhanga-darkBlue ${pressPrimary}`;
    }
    if (item.primary) {
        return `min-h-[4.5rem] py-4 text-base bg-white text-anhanga-darkBlue ${pressPrimary}`;
    }
    return `min-h-[3.25rem] py-3 text-base bg-white/90 text-anhanga-darkBlue ${pressQuiet}`;
}

// `data/linksPage.ts` é ⚙️ EDITÁVEL para quem não é engenheiro (comentário no próprio arquivo);
// um `href` ausente em produção ainda cai num link seguro (`#`/`/`) em vez de derrubar a página
// inteira por um item — mas em dev o erro deve aparecer no console assim que o item é editado,
// não só quando os testes de `tests/links-page-data.test.ts` rodarem.
//
// `import.meta.env` precisa do guard `typeof import.meta !== 'undefined'` (mesmo padrão de
// `data/mediaConfig.ts:39-41`): sob `tsx --test` (runner de `pnpm test:regression`), `import.meta`
// existe mas `.env` é `undefined` — acessar `.DEV` direto lança TypeError em qualquer teste que
// monte LinkButton com um item sem href.
function warnMissingHref(item: LinkItem, fallback: string): void {
    const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
    if (isDev) {
        console.error(`[LinkButton] item "${item.id}" (type "${item.type}") está sem href — caindo para "${fallback}". Configure href em data/linksPage.ts.`);
    }
}

export const LinkButton: React.FC<LinkButtonProps> = ({ item, search, className: extraClassName, iconBadge }) => {
    const className = `${baseClasses} ${tierClasses(item)}${extraClassName ? ` ${extraClassName}` : ''}`;
    const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined;

    // Efeito, não chamada direta no corpo do render: `console.error` é efeito colateral, e
    // chamá-lo durante o render viola a pureza que docs/standards/code-style.md exige — e
    // duplica o aviso sob `React.StrictMode` (index.tsx usa StrictMode, que invoca o corpo do
    // componente duas vezes em dev). Ver review do claude[bot] na PR #1519.
    useEffect(() => {
        if (item.type === 'external' && !item.href) warnMissingHref(item, '#');
        if (item.type === 'internal' && !item.href) warnMissingHref(item, '/');
    }, [item]);

    // `whatsapp`/`external` saem do site (app do WhatsApp ou domínio de terceiro); `internal`
    // navega dentro da própria SPA. Sem esse sinal os três tipos renderizavam pixel-idênticos —
    // quem tocava em "Calcular meu seguro viagem" caía sem aviso em go.nuvembr.com, indistinguível
    // de um link quebrado. O glifo é decorativo (`aria-hidden`); quem depende de leitor de tela
    // recebe o aviso pelo texto `sr-only` embutido no nome acessível do link.
    const content = (opensInNewTab: boolean) => (
        <>
            <span
                className={
                    iconBadge
                        ? 'flex w-[36px] h-[36px] shrink-0 items-center justify-center rounded-full bg-anhanga-blue/10'
                        : 'flex w-[24px] shrink-0 items-center justify-center'
                }
                aria-hidden="true"
            >
                {IconComponent ? (
                    <IconComponent size={iconBadge ? 20 : 22} weight="fill" className={iconBadge ? 'text-anhanga-blue' : undefined} />
                ) : null}
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
            {opensInNewTab ? (
                <>
                    <span className="sr-only"> (abre em nova aba)</span>
                    <span className="flex shrink-0 items-center" aria-hidden="true">
                        <ArrowSquareOut size={16} weight="bold" className="text-anhanga-darkBlue/60" />
                    </span>
                </>
            ) : null}
        </>
    );

    if (item.type === 'whatsapp') {
        // Mesmo padrão do Header/CorpHero/Lollapalooza: o clique abre o ContactModal (nome +
        // WhatsApp + e-mail → grava no CRM via /api/submit-contact → só então abre o WhatsApp,
        // com a mensagem estruturada deste item como pré-preenchimento). `href` real para
        // progressive enhancement (sem JS, cai direto no link de WhatsApp de hoje) —
        // `target="_blank"` só importa nesse caminho, já que o onClick sempre faz preventDefault.
        // `content(false)`: o comportamento normal (com JS) é abrir um modal, não uma nova aba.
        // `data-no-whatsapp-cta`: o href continua sendo wa.me (fallback), então
        // public/utm-tracking.js casaria em `a[href*="wa.me"]` e contaria "abriu o formulário"
        // como "chegou no WhatsApp" — o handoff real só acontece depois do envio bem-sucedido
        // (hooks/useContactForm.ts). Review chatgpt-codex-connector[bot] na PR #1536.
        const message = applyOriginToMessage(item.whatsappMessage ?? '', search);
        const href = getWhatsAppLink(message);
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}
               data-testid={`link-${item.id}`}
               data-no-whatsapp-cta
               onClick={(e) => {
                   e.preventDefault();
                   openContactModal({ source: `links-${item.id}`, message });
                   pushLinksPageClick(item, href);
               }}>
                {content(false)}
            </a>
        );
    }

    if (item.type === 'external') {
        const href = item.href ?? '#';
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}
               data-testid={`link-${item.id}`} onClick={() => pushLinksPageClick(item, href)}>
                {content(true)}
            </a>
        );
    }

    if (item.type === 'cal-modal') {
        // Mesmo mecanismo da landing /consultoria-de-viagem (lib/cal-embed.ts): `href` real para
        // progressive enhancement (sem JS/prerender é um link funcional para o Cal.com), onClick
        // com preventDefault abre o modal por cima da página. Sem `target="_blank"` — o modal
        // abre na própria aba; só o fallback de falha do embed navega para longe, na mesma aba.
        // `data-no-specialist-cta`: "Agendar consultoria" casaria no heurístico textual de
        // isSpecialistCtaText (public/utm-tracking.js) e disparia um falso specialist_cta_click.
        return (
            <a href={CONSULTORIA_BOOKING_URL} className={className} data-testid={`link-${item.id}`}
               data-no-specialist-cta
               onClick={(e) => {
                   e.preventDefault();
                   openConsultoriaBooking();
                   pushLinksPageClick(item, CONSULTORIA_BOOKING_URL);
               }}>
                {content(false)}
            </a>
        );
    }

    const to = withTrackingParams(item.href ?? '/', search ?? '');
    return (
        <Link to={to} className={className} data-testid={`link-${item.id}`}
              onClick={() => pushLinksPageClick(item, to)}>
            {content(false)}
        </Link>
    );
};

export default LinkButton;
