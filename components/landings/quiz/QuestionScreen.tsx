import React, { useState, useEffect, useId } from 'react';
import type { QuizQuestion } from '../../../data/quiz';
import { Progress } from './Progress';

interface QuestionScreenProps {
    q: QuizQuestion;
    qIndex: number;
    total: number;
    value: string[] | undefined;
    onChange: (v: string[]) => void;
    onNext: () => void;
    onBack: () => void;
}

export function QuestionScreen({ q, qIndex, total, value, onChange, onNext, onBack }: QuestionScreenProps) {
    const selected: string[] = value ?? [];
    const [pendingId, setPendingId] = useState<string | null>(null);
    const footMetaId = useId();
    const advanceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Timer cleanup on unmount (state resets via key={q.id} on the render site)
    useEffect(() => {
        const timerRef = advanceTimerRef;
        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    function toggle(optId: string) {
        if (q.multi) {
            const next = selected.includes(optId)
                ? selected.filter((x) => x !== optId)
                : [...selected, optId];
            onChange(next);
        } else {
            onChange([optId]);
            setPendingId(optId);
            // 500ms gives visual confirmation + small undo window before advancing
            advanceTimerRef.current = setTimeout(() => {
                advanceTimerRef.current = null;
                setPendingId(null);
                onNext();
            }, 500);
        }
    }

    const isSelected = (optId: string) => selected.includes(optId);
    const isTight = q.options.length > 4;
    const layout = q.layout ?? 'pills';
    const gridClass = layout === 'cards'
        ? `quiz-opt-grid--cards quiz-opt-grid--${isTight ? 'tight' : 'roomy'}`
        : 'quiz-opt-grid--pills';
    const optClass = layout === 'cards' ? 'quiz-opt--cards' : 'quiz-opt--pills';

    return (
        <div className="quiz-screen quiz-screen-question">
            <div className="quiz-q-top">
                <button type="button" className="quiz-q-back" onClick={onBack} aria-label="Voltar">
                    ← voltar
                </button>
                <Progress current={qIndex + 1} total={total} />
            </div>
            <div className="quiz-q-body">
                <div className="quiz-q-eyebrow">
                    <span className="quiz-pill-q">{q.eyebrow}</span>
                </div>
                <h2 className="quiz-q-title">{q.title}</h2>
                {q.subtitle && <p className="quiz-q-subtitle">{q.subtitle}</p>}

                <div className={`quiz-opt-grid ${gridClass}`}>
                    {q.options.map((opt, i) => (
                        <button
                            type="button"
                            key={opt.id}
                            className={[
                                `quiz-opt ${optClass}`,
                                isSelected(opt.id) ? 'is-selected' : '',
                                pendingId === opt.id ? 'is-confirming' : '',
                            ].join(' ').trim()}
                            onClick={() => !pendingId && toggle(opt.id)}
                            // O estado de escolha vivia só na classe `is-selected` e no
                            // ✓ `aria-hidden` — quem usa leitor de tela marcava opções
                            // sem nenhum retorno de que estavam marcadas (WCAG 4.1.2).
                            aria-pressed={isSelected(opt.id)}
                            disabled={!q.multi && pendingId !== null && pendingId !== opt.id}
                            style={{ ['--opt-i' as string]: i }}
                        >
                            {opt.emoji && <span className="quiz-opt-emoji">{opt.emoji}</span>}
                            <span className="quiz-opt-label">{opt.label}</span>
                            {opt.hint && <span className="quiz-opt-hint">{opt.hint}</span>}
                            <span className="quiz-opt-check" aria-hidden="true">✓</span>
                        </button>
                    ))}
                </div>

                {q.multi && (
                    <div className="quiz-q-foot">
                        <button
                            type="button"
                            className="quiz-btn quiz-btn-primary"
                            disabled={selected.length === 0}
                            onClick={onNext}
                            aria-describedby={footMetaId}
                        >
                            Próxima
                            <span className="quiz-arrow">→</span>
                        </button>
                        {/* "0 escolhidos" não explicava por que o botão estava apagado.
                            Sem seleção o texto vira instrução; com seleção, contador. */}
                        <span id={footMetaId} className="quiz-q-foot-meta" aria-live="polite">
                            {selected.length === 0
                                ? 'Escolha ao menos uma opção'
                                : selected.length === 1 ? '1 escolhido' : `${selected.length} escolhidos`}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
