import type { MainDestination } from '../../../lib/quiz-destinations';

export function MainDestCard({ dest }: { dest: MainDestination }) {
    return (
        <div className="quiz-main-dest-card">
            <span className="quiz-main-dest-region">{dest.region.toUpperCase()}</span>
            <strong className="quiz-main-dest-name">{dest.name}</strong>
            <span className="quiz-main-dest-sub">{dest.subtitle}</span>
            <span className="quiz-main-dest-tag">{dest.tag}</span>
        </div>
    );
}
