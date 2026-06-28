const CHUNKY_LETTERS = ['Q', 'U', 'I', 'Z', '!'];
const CHUNKY_LAYER_COLORS = ['#FFD600', '#FFB800', '#FF9100', '#F97316', '#EA580C'];

export function ChunkyQuiz() {
    return (
        <div className="quiz-chunky-wrap">
            <div className="quiz-chunky quiz-chunky-layered">
                {CHUNKY_LAYER_COLORS.map((c, idx) => (
                    <div
                        key={c}
                        className="quiz-ch-layer"
                        aria-hidden="true"
                        style={{
                            transform: `translate(${(CHUNKY_LAYER_COLORS.length - idx) * 6}px, ${(CHUNKY_LAYER_COLORS.length - idx) * 6}px)`,
                            color: c,
                            zIndex: idx,
                        }}
                    >
                        {CHUNKY_LETTERS.map((l) => <span key={l} className="quiz-ch-letter">{l}</span>)}
                    </div>
                ))}
                <div className="quiz-ch-front" style={{ zIndex: 99 }}>
                    {CHUNKY_LETTERS.map((l) => <span key={l} className="quiz-ch-letter">{l}</span>)}
                </div>
            </div>
        </div>
    );
}
