import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';
import { linksPageConfig } from '../data/linksPage';
import { withTrackingParams, pushLinksPageView } from '../utils/linksTracking';
import LinkButton from '../components/links/LinkButton';
import TrustSeals from '../components/links/TrustSeals';

const LinksPage: React.FC = () => {
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
            <main className="min-h-screen bg-gradient-to-b from-anhanga-darkBlue to-anhanga-action px-5 py-10 font-sans">
                <div className="mx-auto flex w-full max-w-md flex-col items-center">
                    <img
                        src={BRAND_LOGO_WHITE_URL}
                        alt="Anhangá Viagens"
                        width={180}
                        height={48}
                        className="h-12 w-auto object-contain"
                    />

                    {banner.visible ? (
                        <Link
                            to={withTrackingParams(banner.href)}
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

                    <nav aria-label="Links Anhangá Viagens" className="mt-6 flex w-full flex-col gap-3">
                        {visibleLinks.map((link) => (
                            <LinkButton key={link.id} item={link} />
                        ))}
                    </nav>

                    <TrustSeals />
                </div>
            </main>
        </>
    );
};

export default LinksPage;
