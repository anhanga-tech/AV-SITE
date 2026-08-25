import React, { useEffect, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';
import { linksPageConfig } from '../data/linksPage';
import { withTrackingParams, pushLinksPageView } from '../utils/linksTracking';
import LinkButton, { isPrimaryLink } from '../components/links/LinkButton';
import TrustSeals from '../components/links/TrustSeals';

// A query da URL é estado externo ao React. /links é prerenderizada (lib/prerender-routes.js),
// então ler `window.location.search` durante o render faria o HTML do servidor divergir do
// primeiro render do cliente em todo `href`.
//
// O snapshot de servidor é `null` — "origem ainda desconhecida" —, e não string vazia. A
// diferença importa: `''` significa "visitante sem UTM", que resolve para o padrão Instagram.
// Como o mesmo HTML estático é servido para toda query string, cravar esse padrão nele faria
// quem abre `/links/?utm_source=indicacao` e clica antes de hidratar mandar "Vim pelo
// Instagram." — falso. Com `null` o HTML prerenderizado não afirma origem nenhuma, e a
// hidratação preenche a verdadeira.
const subscribeToLocation = (onStoreChange: () => void) => {
    window.addEventListener('popstate', onStoreChange);
    return () => window.removeEventListener('popstate', onStoreChange);
};
const getSearchSnapshot = (): string | null => window.location.search;
const getServerSearchSnapshot = (): string | null => null;

const LinksPage: React.FC = () => {
    const search = useSyncExternalStore(subscribeToLocation, getSearchSnapshot, getServerSearchSnapshot);

    useEffect(() => {
        pushLinksPageView();
    }, []);

    const { banner, links } = linksPageConfig;
    const visibleLinks = links.filter((link) => link.visible);

    return (
        <>
            <Seo
                title="Links | Anhangá Viagens"
                description="Fale com a Anhangá Viagens, planeje sua viagem e acesse nossos destinos."
                canonical="https://www.anhanga.tur.br/links"
                robots="noindex, follow"
                noHreflang
            />
            {/* Ardósia Profunda chapada: o contexto dark canônico do DESIGN.md. O gradiente
                anterior deixava o contraste dos selos dependente da altura da página — numa
                janela alta eles caíam na faixa de Céu Vivo e o branco descia a ~4:1 — e
                flertava com a anti-referência "gradientes de tech" do PRODUCT.md.
                O padding inferior reserva a altura do banner de cookies (--cookie-banner-h,
                exposto por CookieConsentBanner) para que ele não cubra os selos de confiança. */}
            <main className="min-h-screen bg-anhanga-dark px-[20px] pt-10 pb-[calc(2.5rem+var(--cookie-banner-h,0px))] font-sans">
                <div className="mx-auto flex w-full max-w-md flex-col items-center">
                    <h1 className="sr-only">Anhangá Viagens — links</h1>
                    <img
                        src={BRAND_LOGO_WHITE_URL}
                        alt="Anhangá Viagens"
                        width={180}
                        height={48}
                        className="h-12 w-auto object-contain"
                    />

                    {banner.visible ? (
                        <Link
                            to={withTrackingParams(banner.href, search ?? '')}
                            className="mt-8 w-full rounded-2xl bg-anhanga-yellow/15 p-5 text-center ring-1 ring-anhanga-yellow/40 transition-colors hover:bg-anhanga-yellow/25"
                            data-testid="links-banner"
                        >
                            <p className="text-lg font-bold text-white">{banner.title}</p>
                            {banner.subtitle ? <p className="mt-1 text-sm text-white/80">{banner.subtitle}</p> : null}
                            <span className="mt-3 inline-block rounded-full bg-anhanga-yellow px-4 py-1.5 text-sm font-semibold text-anhanga-darkBlue">
                                {banner.ctaLabel}
                            </span>
                        </Link>
                    ) : null}

                    <nav aria-label="Links Anhangá Viagens" className="mt-8 flex w-full flex-col gap-3">
                        {visibleLinks.map((link, index) => {
                            // Quebra de ritmo na fronteira ações → destinos: um respiro a mais
                            // marca a mudança de tier sem precisar de divisor ou rótulo.
                            const previous = index > 0 ? visibleLinks[index - 1] : undefined;
                            const startsDestinations = Boolean(previous && isPrimaryLink(previous) && !isPrimaryLink(link));
                            return (
                                <LinkButton key={link.id} item={link} search={search} className={startsDestinations ? 'mt-3' : undefined} />
                            );
                        })}
                    </nav>

                    <TrustSeals />
                </div>
            </main>
        </>
    );
};

export default LinksPage;
