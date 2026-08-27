import React from 'react';
import { Heart } from '@phosphor-icons/react';
import googleReviewsRaw from '../../data/googleReviews.json';
import type { GoogleReviewsData } from '../../types/reviews';
import { formatReviewCountLabel } from './reviewFormatting';
import { ANHANGA_TECH_LOGO_URL } from '../../lib/media-assets';
import { useFooterRuntimeMetadata } from '../../lib/footer-runtime';

const CADASTUR = '37.036.732/0001-41';
const googleReviews = googleReviewsRaw as GoogleReviewsData;

export const TrustSeals: React.FC = () => {
    const rating = googleReviews.averageRating ? googleReviews.averageRating.toFixed(1) : '5.0';
    const reviewCountLabel = formatReviewCountLabel(googleReviews.totalReviews ?? 0);
    // Mesmo crédito e mesmo padrão do rodapé do site principal (components/Footer.tsx) — o
    // ano é preenchido só depois de montar para manter o HTML pré-renderizado desta rota
    // determinístico (ver useFooterRuntimeMetadata).
    const runtimeMetadata = useFooterRuntimeMetadata();

    return (
        // Peak-end rule (crítica de /links de 2026-08-27, P2): o rodapé é o último conteúdo da
        // página, então uma linha calorosa vem antes do bloco de compliance, em vez da visita
        // terminar direto em Cadastur/razão social. `text-white/90` na linha calorosa e não branco
        // pleno: a Regra do Branco Rebaixado do DESIGN.md vale em todo contexto escuro. Sobre
        // Ardósia Profunda o par mede ~14,6:1. O bloco de compliance abaixo é rebaixado ainda mais
        // (`white/70`/`white/60`, ~9:1 e ~7:1 — folga confortável acima do piso AA de 4.5:1) para
        // que a hierarquia visual reflita a hierarquia emocional: o calor primeiro, o dado legal
        // depois, sem escondê-lo.
        <footer className="mt-10 flex flex-col items-center gap-3 text-center text-white/90">
            <p className="text-sm font-semibold">Um WhatsApp de distância, sempre que precisar.</p>
            <div className="flex flex-col items-center gap-1 text-xs text-white/70">
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    {/* `min-h-11` (44px): o piso de alvo de toque do PRODUCT.md vale também para o
                        link inline do rodapé — em `text-xs` ele media ~16px de altura. Hover em
                        `anhanga-action` (ciano), não `anhanga-yellow`: um segundo elemento âmbar
                        na tela violaria a Regra do Âmbar do WhatsApp já em destaque acima. */}
                    <a href="https://cadastur.turismo.gov.br/hotsite/" target="_blank" rel="noopener noreferrer"
                       className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-anhanga-action transition-colors">
                        Cadastur {CADASTUR}
                    </a>
                    <span aria-hidden="true">·</span>
                    <span>Nota {rating}{reviewCountLabel ? ` · ${reviewCountLabel}` : ''} no Google</span>
                </div>
                <p className="mt-1 text-white/60">ANHANGA TURISMO LTDA</p>
                <p className="mt-1 text-white/60">
                    Feito com <Heart className="inline-block size-3 text-red-500" weight="fill" aria-hidden="true" /> pela{' '}
                    <img src={ANHANGA_TECH_LOGO_URL} alt="Anhangá.tech" width={80} height={16} loading="lazy"
                         className="inline-block h-4 w-auto mx-1 align-sub" />
                    {runtimeMetadata ? ` · ${runtimeMetadata.currentYear}` : null}
                </p>
            </div>
        </footer>
    );
};

export default TrustSeals;
