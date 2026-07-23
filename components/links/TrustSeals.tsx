import React from 'react';
import googleReviewsRaw from '../../data/googleReviews.json';
import type { GoogleReviewsData } from '../../types/reviews';

const CADASTUR = '37.036.732/0001-41';
const googleReviews = googleReviewsRaw as GoogleReviewsData;

export const TrustSeals: React.FC = () => {
    const rating = googleReviews.averageRating ? googleReviews.averageRating.toFixed(1) : '5.0';

    return (
        <footer className="mt-10 flex flex-col items-center gap-1 text-center text-xs text-white">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <a href="https://cadastur.turismo.gov.br/hotsite/" target="_blank" rel="noopener noreferrer"
                   className="underline underline-offset-2 hover:text-anhanga-yellow transition-colors">
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
