import React, { useEffect, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck } from '@phosphor-icons/react';
import { Seo } from '../components/Seo';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';
import { linksPageConfig } from '../data/linksPage';
import { withTrackingParams, pushLinksPageView, pushLinksPageClick } from '../utils/linksTracking';
import {
    FEATURED_DESTINATION_IDS,
    MORE_DESTINATION_IDS,
    PRODUCT_LINK_IDS,
    getUnassignedVisibleLinks,
    getLinksPageVisibility,
    getVisibleLinksForIds,
    getSoleIntentCardSpanClass,
    resolveSelectedIntent,
} from '../utils/linksPageLayout';
import LinkButton from '../components/links/LinkButton';
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

// Rastreia qual porta de intenção a pessoa já escolheu (via #destinos / #preparar) para
// rebaixar visualmente a seção que ela NÃO escolheu — ver Priority Issue P1 da crítica de
// 2026-08-26. `hashchange` cobre tanto o clique nos cards quanto navegação direta por link
// compartilhado com hash. Sem hash (padrão, inclusive no HTML prerenderizado) nenhuma seção
// é rebaixada: a escolha nunca é assumida, só refletida depois que a pessoa a fizer.
const subscribeToHash = (onStoreChange: () => void) => {
    window.addEventListener('hashchange', onStoreChange);
    return () => window.removeEventListener('hashchange', onStoreChange);
};
const getHashSnapshot = (): string => window.location.hash;
const getServerHashSnapshot = (): string => '';

const intentLinks = {
    destinos: { id: 'intent-destinos', type: 'internal' as const, destination: '#destinos' },
    produtos: { id: 'intent-produtos', type: 'internal' as const, destination: '#preparar' },
};

// Pura (só depende do parâmetro): fica fora do componente para não ser recriada a cada render.
const sectionHeadingClass = (deemphasized: boolean) =>
    deemphasized ? 'text-base font-bold text-white/60' : 'text-lg font-black text-white/90';

const LinksPage: React.FC = () => {
    const search = useSyncExternalStore(subscribeToLocation, getSearchSnapshot, getServerSearchSnapshot);
    const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, getServerHashSnapshot);

    useEffect(() => {
        pushLinksPageView();
    }, []);

    const { banner, links } = linksPageConfig;
    const visibleLinks = links.filter((link) => link.visible);
    const visibleFeaturedDestinationLinks = getVisibleLinksForIds(visibleLinks, FEATURED_DESTINATION_IDS);
    const visibleMoreDestinationLinks = getVisibleLinksForIds(visibleLinks, MORE_DESTINATION_IDS);
    const visibleProductLinks = getVisibleLinksForIds(visibleLinks, PRODUCT_LINK_IDS);
    const unassignedVisibleLinks = getUnassignedVisibleLinks(visibleLinks);
    const linkById = new Map(visibleLinks.map((link) => [link.id, link]));
    const { hasPrimaryDestinations, hasVisibleDestinations, hasVisibleContact, hasVisibleOtherLinks } = getLinksPageVisibility(links);
    const hasProductIntent = visibleProductLinks.length > 0;
    const soleIntentCardSpanClass = getSoleIntentCardSpanClass(hasVisibleDestinations, hasProductIntent);
    // Depois que a pessoa escolhe uma porta (#destinos ou #preparar), a outra seção continua
    // visível e a um toque de distância — só perde peso tipográfico, nunca conteúdo. Uma hash
    // apontando para um ramo que não existe na config atual não conta como escolha real — ver
    // resolveSelectedIntent.
    const selectedIntent = resolveSelectedIntent(hash, hasVisibleDestinations, hasProductIntent);
    const destinosSectionClass = `mt-10 w-full scroll-mt-6${selectedIntent === 'preparar' ? ' border-t border-white/10 pt-6' : ''}`;
    const preparoSectionClass = `mt-10 w-full scroll-mt-6${selectedIntent === 'destinos' ? ' border-t border-white/10 pt-6' : ''}`;
    const productIntentDescription = visibleProductLinks.length === PRODUCT_LINK_IDS.length
        ? 'Seguro e chip / eSIM'
        : visibleProductLinks.map((link) => link.label).join(' e ');
    const productSectionDescription = visibleProductLinks.length === 1
        ? 'Resolva um detalhe importante antes de embarcar.'
        : 'Resolva dois detalhes importantes antes de embarcar.';
    const renderLink = (id: string, className?: string) => {
        const item = linkById.get(id);
        return item ? <LinkButton key={id} item={item} search={search} className={className} /> : null;
    };

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
                <div className="mx-auto flex w-full max-w-lg flex-col items-center">
                    <img
                        src={BRAND_LOGO_WHITE_URL}
                        alt="Anhangá Viagens"
                        width={185}
                        height={96}
                        className="h-16 w-auto object-contain"
                    />

                    <section className="mt-8 w-full" aria-labelledby="links-intent-heading">
                        <h1 id="links-intent-heading" className="text-center text-2xl font-black leading-tight text-white/90">
                            Qual é o próximo passo da sua viagem?
                        </h1>
                        <p className="mx-auto mt-3 max-w-[34ch] text-center text-sm leading-6 text-white/75">
                            Escolha por onde começar. A gente pode conversar agora ou ajudar você a pesquisar primeiro.
                        </p>

                        <div className="mt-6 flex w-full flex-col gap-3">
                            {renderLink('whatsapp')}
                            <div className="grid gap-3 sm:grid-cols-2">
                                {hasVisibleDestinations ? (
                                    <a
                                        href={intentLinks.destinos.destination}
                                        data-testid="intent-destinos"
                                        onClick={() => pushLinksPageClick(intentLinks.destinos, intentLinks.destinos.destination)}
                                        className={`flex min-w-0 min-h-[4.5rem] items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 text-left text-white/90 ring-1 ring-white/20 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action${soleIntentCardSpanClass}`}
                                    >
                                        <Compass size={24} weight="fill" aria-hidden="true" className="shrink-0" />
                                        <span className="flex min-w-0 flex-col break-words">
                                            <span className="font-bold">Ainda estou escolhendo</span>
                                            <span className="mt-1 text-xs text-white/75">Conhecer destinos e ideias</span>
                                        </span>
                                    </a>
                                ) : null}
                                {visibleProductLinks.length > 0 ? (
                                    <a
                                        href={intentLinks.produtos.destination}
                                        data-testid="intent-produtos"
                                        onClick={() => pushLinksPageClick(intentLinks.produtos, intentLinks.produtos.destination)}
                                        className={`flex min-w-0 min-h-[4.5rem] items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 text-left text-white/90 ring-1 ring-white/20 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action${soleIntentCardSpanClass}`}
                                    >
                                        <ShieldCheck size={24} weight="fill" aria-hidden="true" className="shrink-0" />
                                        <span className="flex min-w-0 flex-col break-words">
                                            <span className="font-bold">Quero preparar a viagem</span>
                                            <span className="mt-1 text-xs text-white/75">{productIntentDescription}</span>
                                        </span>
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    {banner.visible ? (
                        <Link
                            to={withTrackingParams(banner.href, search ?? '')}
                            className="mt-8 w-full rounded-2xl bg-anhanga-yellow/15 p-5 text-center ring-1 ring-anhanga-yellow/40 transition-colors hover:bg-anhanga-yellow/25"
                            data-testid="links-banner"
                        >
                            <p className="text-lg font-bold text-white/90">{banner.title}</p>
                            {banner.subtitle ? <p className="mt-1 text-sm text-white/80">{banner.subtitle}</p> : null}
                            <span className="mt-3 inline-block rounded-full bg-anhanga-yellow px-4 py-1.5 text-sm font-semibold text-anhanga-darkBlue">
                                {banner.ctaLabel}
                            </span>
                        </Link>
                    ) : null}

                    {hasVisibleContact ? (
                        <section id="contato" className="mt-10 w-full scroll-mt-6" aria-labelledby="contact-heading">
                            <h2 id="contact-heading" className="text-lg font-black text-white/90">Já tem destino e datas?</h2>
                            <p className="mt-1 text-sm leading-6 text-white/70">Envie os detalhes e receba um orçamento para a sua viagem.</p>
                            <div className="mt-4">{renderLink('orcamento')}</div>
                        </section>
                    ) : null}

                    {hasVisibleDestinations ? (
                        <section id="destinos" className={destinosSectionClass} aria-labelledby="destinations-heading">
                            <h2 id="destinations-heading" className={sectionHeadingClass(selectedIntent === 'preparar')}>Conheça destinos e ideias</h2>
                            <p className="mt-1 text-sm leading-6 text-white/70">Veja algumas possibilidades antes de decidir como quer viajar.</p>
                            {hasPrimaryDestinations ? (
                                <nav aria-label="Destinos e ideias de viagem" className="mt-4 flex w-full flex-col gap-3">
                                    {renderLink('quiz')}
                                    {visibleFeaturedDestinationLinks.map((item) => (
                                        <LinkButton key={item.id} item={item} search={search} />
                                    ))}
                                </nav>
                            ) : null}
                            {visibleMoreDestinationLinks.length > 0 ? (
                                <details className="mt-3 rounded-2xl bg-white/5 ring-1 ring-white/15">
                                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action">
                                        Ver mais páginas de viagem
                                    </summary>
                                    <nav aria-label="Mais páginas de viagem" className="flex flex-col gap-3 px-3 pb-3">
                                        {visibleMoreDestinationLinks.map((item) => (
                                            <LinkButton key={item.id} item={item} search={search} />
                                        ))}
                                    </nav>
                                </details>
                            ) : null}
                        </section>
                    ) : null}

                    {visibleProductLinks.length > 0 ? (
                        <section id="preparar" className={preparoSectionClass} aria-labelledby="prepare-heading">
                            <h2 id="prepare-heading" className={sectionHeadingClass(selectedIntent === 'destinos')}>Prepare sua viagem</h2>
                            <p className="mt-1 text-sm leading-6 text-white/70">{productSectionDescription}</p>
                            <nav aria-label="Produtos para preparar a viagem" className="mt-4 flex w-full flex-col gap-3">
                                {visibleProductLinks.map((item) => (
                                    <LinkButton key={item.id} item={item} search={search} />
                                ))}
                            </nav>
                        </section>
                    ) : null}

                    {hasVisibleOtherLinks ? (
                        <section className="mt-10 w-full" aria-labelledby="other-links-heading">
                            <h2 id="other-links-heading" className="text-lg font-black text-white/90">Outros acessos</h2>
                            <nav aria-label="Outros acessos" className="mt-4 flex flex-col gap-3">
                                {renderLink('site')}
                                {unassignedVisibleLinks.map((item) => (
                                    <LinkButton key={item.id} item={item} search={search} />
                                ))}
                            </nav>
                        </section>
                    ) : null}

                    <TrustSeals />
                </div>
            </main>
        </>
    );
};

export default LinksPage;
