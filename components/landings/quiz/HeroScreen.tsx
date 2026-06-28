import { ChunkyQuiz } from './ChunkyQuiz';

export function HeroScreen({ onStart }: { onStart: () => void }) {
    return (
        <div className="quiz-screen quiz-screen-hero">
            <div className="quiz-hero-deco-stars" aria-hidden="true">
                <span className="quiz-deco-star quiz-deco-star-1">✦</span>
                <span className="quiz-deco-star quiz-deco-star-2">✦</span>
                <span className="quiz-deco-star quiz-deco-star-3">✦</span>
                <span className="quiz-deco-star quiz-deco-star-4">✦</span>
            </div>
            <div className="quiz-hero-content">
                <div className="quiz-hero-eyebrow">
                    <span className="quiz-pill-hero">
                        <span className="dot" />
                        ANHANGÁ VIAGENS
                    </span>
                </div>
                <h1 className="quiz-hero-h1">
                    <span className="quiz-h1-line--top">Descubra seu</span>
                    <span className="quiz-h1-keyword">próximo destino</span>
                </h1>
                <div className="quiz-chunky-block">
                    <ChunkyQuiz />
                </div>
                <p className="quiz-hero-sub">
                    6 perguntinhas rápidas. No final, a gente revela seu{' '}
                    <em>perfil de viajante</em> e os destinos que combinam com você.
                </p>
                <div className="quiz-hero-cta">
                    <button type="button" className="quiz-btn quiz-btn-primary quiz-btn-lg quiz-btn--hero" onClick={onStart}>
                        Bora começar
                        <span className="quiz-arrow">→</span>
                    </button>
                    <span className="quiz-hero-meta">⏱ 90 segundos · 100% gratuito</span>
                </div>
                <div className="quiz-hero-tape" aria-hidden="true">
                    <span className="quiz-tape-tilt">PARA QUEM AINDA NÃO SABE PRA ONDE IR</span>
                </div>
            </div>
        </div>
    );
}
