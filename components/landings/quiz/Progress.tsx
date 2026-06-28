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
            <progress className="quiz-progress-bar" value={current} max={total}>
                {Math.round(progress * 100)}%
            </progress>
        </div>
    );
}
