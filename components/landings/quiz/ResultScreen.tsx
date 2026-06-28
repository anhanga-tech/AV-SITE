import { useState, useEffect } from 'react';
import type { LeadForm, TravelerProfile } from '../../../data/quiz';
import type { MainDestination, InspirationDestination } from '../../../lib/quiz-destinations';
import { Confetti } from './Confetti';
import { Polaroid } from './Polaroid';
import { MainDestCard } from './MainDestCard';
import { WhatsAppUpgrade } from './WhatsAppUpgrade';

interface ResultScreenProps {
    profile: TravelerProfile;
    mainDest: MainDestination;
    inspirations: InspirationDestination[];
    lead: LeadForm;
    onRestart: () => void;
    baseWaUrl: string;
    submitFailed: boolean;
}

export function ResultScreen({ profile, mainDest, inspirations, lead, onRestart, baseWaUrl, submitFailed }: ResultScreenProps) {
    const [reveal, setReveal] = useState(false);
    const firstName = lead.nome.trim().split(/\s+/)[0] || 'Viajante';

    useEffect(() => {
        const t = setTimeout(() => setReveal(true), 300);
        return () => clearTimeout(t);
    }, []);

    const revealed = reveal ? 'is-revealed' : '';

    return (
        <div className="quiz-screen quiz-screen-result">
            <Confetti active={reveal} />

            <div className={`quiz-result-inner ${revealed}`} aria-live="polite" aria-atomic="false">

                {/* Bloco 0 — pill de eyebrow */}
                <div className="quiz-reveal-block quiz-result-eyebrow" style={{ ['--reveal-delay' as string]: '0ms' }}>
                    <span className="quiz-pill-result">RESULTADO · {firstName}</span>
                </div>

                {/* Bloco 1 — "Você é um(a)..." + nome do perfil — PICO EMOCIONAL */}
                <div className="quiz-reveal-block quiz-result-peak" style={{ ['--reveal-delay' as string]: '180ms' }}>
                    <p className="quiz-result-lead">Você é:</p>
                    <div className={`quiz-result-name quiz-result-color--${profile.color}`}>
                        <span className="quiz-result-icon" aria-hidden="true">{profile.icon}</span>
                        <h2 className="quiz-result-h2">{profile.name}</h2>
                    </div>
                </div>

                {/* Bloco 2 — tagline + descrição */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '480ms' }}>
                    <p className="quiz-result-tagline">{profile.tagline}</p>
                    <p className="quiz-result-desc">{profile.description}</p>
                </div>

                {/* Bloco 3 — destino principal */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '640ms' }}>
                    <div className="quiz-result-eyebrow quiz-result-eyebrow--mid">
                        <span className="quiz-pill-soft">SEU PRÓXIMO DESTINO</span>
                    </div>
                    <MainDestCard dest={mainDest} />
                </div>

                {/* Bloco 4 — 3 destinos de inspiração */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '800ms' }}>
                    <div className="quiz-result-eyebrow quiz-result-eyebrow--mid">
                        <span className="quiz-pill-soft">3 DESTINOS PARA SONHAR</span>
                    </div>
                    <div className="quiz-dest-grid">
                        {inspirations.map((d, i) => (
                            <Polaroid key={`${d.name}-${d.region}`} dest={d} index={i} />
                        ))}
                    </div>
                </div>

                {/* Bloco 5 — upgrade WhatsApp + CTA */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '1000ms' }}>
                    <WhatsAppUpgrade
                        profileName={profile.name}
                        mainDestName={mainDest.name}
                        firstName={firstName}
                        baseWaUrl={baseWaUrl}
                    />
                    <button type="button" className="quiz-btn quiz-btn-ghost quiz-result-restart" onClick={onRestart}>
                        Refazer o quiz
                    </button>
                </div>

                {/* Bloco 6 — fineprint + erro de API */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '1100ms' }}>
                    {submitFailed ? (
                        <p role="alert" className="quiz-result-fineprint quiz-result-fineprint--warn">
                            Algo deu errado ao salvar seus dados. Use o WhatsApp acima para garantir o contato.
                        </p>
                    ) : (
                        <p className="quiz-result-fineprint">
                            Nossa equipe entra em contato pelo e-mail que você informou em breve.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
