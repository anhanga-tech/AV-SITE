import { useMemo } from 'react';

interface ConfettiPiece {
    id: number; left: number; delay: number; duration: number;
    rotate: number; drift: number; size: number; color: string;
    shape: 'paper' | 'circle' | 'star';
}

const CONF_SHAPES: ConfettiPiece['shape'][] = [
    'paper', 'paper', 'paper', 'circle', 'star',
    'paper', 'circle', 'paper', 'paper', 'star',
];

export function Confetti({ active }: { active: boolean }) {
    const pieces = useMemo<ConfettiPiece[]>(() => {
        return Array.from({ length: 70 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.5,
            duration: 2.2 + Math.random() * 2.2,
            rotate: Math.random() * 720 - 360,
            drift: (Math.random() - 0.5) * 240,
            size: 7 + Math.random() * 11,
            color: ['#FFD600', '#0ea5e9', '#ea580c', '#10b981', '#f97316', '#ffffff'][i % 6],
            shape: CONF_SHAPES[i % CONF_SHAPES.length],
        }));
    }, []);

    if (!active) return null;

    return (
        <div className="quiz-confetti" aria-hidden="true">
            {pieces.map((p) => (
                <span
                    key={p.id}
                    className={`quiz-conf quiz-conf--${p.shape}`}
                    style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        ['--rot' as string]: `${p.rotate}deg`,
                        ['--drift' as string]: `${p.drift}px`,
                        ['--size' as string]: `${p.size}px`,
                        ['--color' as string]: p.color,
                    }}
                >
                    {p.shape === 'star' ? '★' : null}
                </span>
            ))}
        </div>
    );
}
