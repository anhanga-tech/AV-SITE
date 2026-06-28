import type { InspirationDestination } from '../../../lib/quiz-destinations';

const QUIZ_IMG_BASE = 'https://media.anhanga.tur.br/quiz';

const POLAROID_TILTS = [-2.4, 1.6, -1.2, 2, -1.8];

export function Polaroid({ dest, index }: { dest: InspirationDestination; index: number }) {
    const tilt = POLAROID_TILTS[index % POLAROID_TILTS.length];
    const imgSrc = `${QUIZ_IMG_BASE}/${dest.imageKey}.webp`;

    return (
        <div
            className="quiz-polaroid"
            style={{ ['--tilt' as string]: `${tilt}deg`, ['--delay' as string]: `${index * 120}ms` }}
        >
            <div className="quiz-pol-tape" aria-hidden="true" />
            <div className="quiz-pol-img quiz-pol-img--photo">
                <img
                    src={imgSrc}
                    alt={dest.name}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    width={440}
                    height={330}
                />
                <span className="quiz-pol-img-label">{dest.region.toUpperCase()}</span>
            </div>
            <div className="quiz-pol-cap">
                <strong>{dest.name}</strong>
                <em>{dest.tag}</em>
            </div>
        </div>
    );
}
