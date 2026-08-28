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
        // Ardósia Profunda o par mede ~14,6:1. Abaixo, quatro níveis de rebaixamento reflitem a
        // hierarquia emocional — calor (90, ~14,6:1) → dado legal (70/60, ~9:1/~7:1) → assinatura
        // de quem construiu (50, ~5,2:1) — todos com folga confortável acima do piso AA de 4.5:1.
        <footer className="mt-10 flex flex-col items-center gap-3 text-center text-white/90">
            <p className="text-sm font-semibold">Um WhatsApp de distância, sempre que precisar.</p>
            <div className="flex flex-col items-center text-xs text-white/70">
                <div className="flex flex-col items-center gap-1">
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                        <a href="https://cadastur.turismo.gov.br/hotsite/" target="_blank" rel="noopener noreferrer"
                           className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-anhanga-action transition-colors">
                            Cadastur {CADASTUR}
                        </a>
                        <span aria-hidden="true">·</span>
                        <span>Nota {rating}{reviewCountLabel ? ` · ${reviewCountLabel}` : ''} no Google</span>
                    </div>
                    <p className="text-white/60">ANHANGA TURISMO LTDA</p>
                </div>
                {/* Assinatura separada do bloco legal (crítica de /links, sessão live 2026-08-28):
                    o logo da Anhangá.tech vivia dentro de um parágrafo de texto corrido, alinhado
                    por `align-sub` — heurística frágil que ficava visivelmente desalinhada contra
                    o ícone de coração ao lado. Ícone e logo compartilham a mesma altura (12px) e
                    ficam numa linha flex própria: alinhamento correto por construção, não por
                    ajuste fino de baseline. As hairlines (`bg-white/15`) leem como uma assinatura/
                    colofão do diário, não como compliance — separando visualmente "o dado legal"
                    de "quem construiu isto". */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-white/50">
                    <span className="h-px w-6 bg-white/15" aria-hidden="true" />
                    <span className="inline-flex items-center gap-1">
                        Feito com <Heart className="size-3 text-red-500" weight="fill" aria-hidden="true" /> pela
                    </span>
                    {/* Proporção real do logo é ~5:1 (Footer.tsx:122 usa width=80 height=16 para h-4);
                        aqui a altura CSS é h-3 (12px), então width precisa ser 60, não 80, senão o
                        navegador reserva o espaço errado pré-load e reflowa quando a imagem chega
                        (review claude[bot] na PR #1536). */}
                    <img src={ANHANGA_TECH_LOGO_URL} alt="Anhangá.tech" width={60} height={12} loading="lazy" className="h-3 w-auto" />
                    {runtimeMetadata ? <span>· {runtimeMetadata.currentYear}</span> : null}
                    <span className="h-px w-6 bg-white/15" aria-hidden="true" />
                </div>
            </div>
        </footer>
    );
};

export default TrustSeals;
