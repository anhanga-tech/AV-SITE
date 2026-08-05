const PROGRESS_MILESTONES: Record<number, string> = {
    3: 'Na metade!',
    6: 'Última!',
};

export function Progress({ current, total }: { current: number; total: number }) {
    const progress = total > 0 ? current / total : 0;
    const milestone = PROGRESS_MILESTONES[current];
    return (
        <div className="quiz-progress">
            <div className="quiz-progress-text" aria-live="polite">
                {milestone
                    ? <span key={current} className="quiz-progress-milestone">{milestone}</span>
                    : `${current}/${total}`
                }
            </div>
            {/* A barra precisa do próprio nome acessível: o texto ao lado vira
                "Na metade!" nos milestones, então "3/7" some do que a AT lê. */}
            <progress
                className="quiz-progress-bar"
                value={current}
                max={total}
                aria-label={`Pergunta ${current} de ${total}`}
            >
                {Math.round(progress * 100)}%
            </progress>
        </div>
    );
}
