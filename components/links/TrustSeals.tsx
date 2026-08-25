import React from 'react';
import googleReviewsRaw from '../../data/googleReviews.json';
import type { GoogleReviewsData } from '../../types/reviews';

const CADASTUR = '37.036.732/0001-41';
const googleReviews = googleReviewsRaw as GoogleReviewsData;

export const TrustSeals: React.FC = () => {
    const rating = googleReviews.averageRating ? googleReviews.averageRating.toFixed(1) : '5.0';

    return (
        // `text-white/90` e não branco pleno: a Regra do Branco Rebaixado do DESIGN.md vale em
        // todo contexto escuro. Sobre Ardósia Profunda o par mede ~14,6:1.
        <footer className="mt-10 flex flex-col items-center gap-1 text-center text-xs text-white/90">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                {/* `min-h-11` (44px): o piso de alvo de toque do PRODUCT.md vale também para o
                    link inline do rodapé — em `text-xs` ele media ~16px de altura. */}
                <a href="https://cadastur.turismo.gov.br/hotsite/" target="_blank" rel="noopener noreferrer"
                   className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-anhanga-yellow transition-colors">
                    Cadastur {CADASTUR}
                </a>
                <span aria-hidden="true">·</span>
                <span>Nota {rating} no Google</span>
            </div>
            <p className="mt-1 text-white/85">ANHANGA TURISMO LTDA</p>
        </footer>
    );
};

export default TrustSeals;
