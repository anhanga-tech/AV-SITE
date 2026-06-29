import { useMemo, useCallback, useReducer } from 'react';
import { Seo } from '../../components/Seo';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { useQuizCapture } from '../../hooks/useQuizCapture';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { matchProfile, type ProfileKey } from '../../lib/quiz-scoring';
import {
    selectMainDestination,
    selectInspirationDestinations,
} from '../../lib/quiz-destinations';
import {
    QUIZ_QUESTIONS,
    TRAVELER_PROFILES,
    buildAnswersSummary,
    type QuizAnswers,
    type LeadForm,
} from '../../data/quiz';
import { HeroScreen } from '../../components/landings/quiz/HeroScreen';
import { QuestionScreen } from '../../components/landings/quiz/QuestionScreen';
import { PreLeadScreen } from '../../components/landings/quiz/PreLeadScreen';
import { ResultScreen } from '../../components/landings/quiz/ResultScreen';
import './quiz-anhanga.css';

/** Lê parâmetros de URL para pré-popular o quiz com dados de leads existentes.
 *  ?email=foo@bar.com&nome=João&sobrenome=Silva&skip=true
 *  Quando skip=true, o stage 'lead' é omitido e o webhook inclui skipped:true.
 */
function useQuizUrlParams() {
    return useMemo(() => {
        if (typeof window === 'undefined') {
            return { email: '', nome: '', sobrenome: '', skip: false };
        }

        const p = new URLSearchParams(window.location.search);
        const email = p.get('email') ?? '';
        const nome = p.get('nome') ?? '';
        const sobrenome = p.get('sobrenome') ?? '';
        const skip = p.get('skip') === 'true' && email.length > 0;
        return { email, nome, sobrenome, skip };
    }, []);
}

/* ==========================================================================
   Tipos do orquestrador
   ========================================================================== */

type Stage =
    | { kind: 'hero' }
    | { kind: 'question'; index: number }
    | { kind: 'lead' }
    | { kind: 'result' };

/* ==========================================================================
   StageContent — renderiza a tela correta do quiz
   ========================================================================== */

interface StageContentProps {
    stage: Stage;
    answers: QuizAnswers;
    profileKey: ProfileKey | null;
    leadForm: LeadForm | null;
    leadInitialValues: Partial<LeadForm>;
    baseWaUrl: string;
    submitFailed: boolean;
    onStart: () => void;
    onAnswerQ: (qId: string, value: string[]) => void;
    onNextQ: (currentIndex: number) => void;
    onBackQ: (currentIndex: number) => void;
    onLeadSubmit: (data: LeadForm, skipped?: boolean) => void;
    onRestart: () => void;
    onGo: (next: Stage, dir?: 'forward' | 'back') => void;
    onPhoneSubmit: (phone: string) => void;
}

function StageContent({
    stage, answers, profileKey, leadForm, leadInitialValues, baseWaUrl, submitFailed,
    onStart, onAnswerQ, onNextQ, onBackQ, onLeadSubmit, onRestart, onGo, onPhoneSubmit,
}: StageContentProps) {
    if (stage.kind === 'hero') return <HeroScreen onStart={onStart} />;
    if (stage.kind === 'question') {
        const q = QUIZ_QUESTIONS[stage.index];
        return (
            <QuestionScreen
                key={q.id}
                q={q}
                qIndex={stage.index}
                total={QUIZ_QUESTIONS.length}
                value={answers[q.id]}
                onChange={(v) => onAnswerQ(q.id, v)}
                onNext={() => onNextQ(stage.index)}
                onBack={() => onBackQ(stage.index)}
            />
        );
    }
    if (stage.kind === 'lead') {
        const leadProfileKey = matchProfile(answers);
        return (
            <PreLeadScreen
                profile={TRAVELER_PROFILES[leadProfileKey]}
                onSubmit={onLeadSubmit}
                onBack={() => onGo({ kind: 'question', index: QUIZ_QUESTIONS.length - 1 }, 'back')}
                initialValues={leadInitialValues}
            />
        );
    }
    if (stage.kind === 'result' && profileKey && leadForm) {
        const mainDest = selectMainDestination(profileKey, answers.destino ?? []);
        const inspirations = selectInspirationDestinations(profileKey, mainDest);
        return (
            <ResultScreen
                profile={TRAVELER_PROFILES[profileKey]}
                mainDest={mainDest}
                inspirations={inspirations}
                lead={leadForm}
                onRestart={onRestart}
                baseWaUrl={baseWaUrl}
                submitFailed={submitFailed}
                onPhoneSubmit={onPhoneSubmit}
            />
        );
    }
    return null;
}

/* ==========================================================================
   Componente principal
   ========================================================================== */

interface QuizState {
    stage: Stage;
    direction: 'forward' | 'back';
    answers: QuizAnswers;
    leadForm: LeadForm | null;
    profileKey: ProfileKey | null;
    baseWaUrl: string;
    submitFailed: boolean;
}

type QuizAction =
    | { type: 'GO'; stage: Stage; direction?: 'forward' | 'back' }
    | { type: 'ANSWER'; qId: string; value: string[] }
    | { type: 'SUBMIT_RESULT'; leadForm: LeadForm; profileKey: ProfileKey; baseWaUrl: string }
    | { type: 'SUBMIT_FAILED' }
    | { type: 'RESTART' };

const QUIZ_INITIAL_STATE: QuizState = {
    stage: { kind: 'hero' },
    direction: 'forward',
    answers: {},
    leadForm: null,
    profileKey: null,
    baseWaUrl: '',
    submitFailed: false,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
    switch (action.type) {
        case 'GO': return { ...state, stage: action.stage, direction: action.direction ?? 'forward' };
        case 'ANSWER': return { ...state, answers: { ...state.answers, [action.qId]: action.value } };
        case 'SUBMIT_RESULT': return { ...state, leadForm: action.leadForm, profileKey: action.profileKey, baseWaUrl: action.baseWaUrl, submitFailed: false };
        case 'SUBMIT_FAILED': return { ...state, submitFailed: true };
        case 'RESTART': return { ...QUIZ_INITIAL_STATE };
    }
}

type QuizSubmitInput = Parameters<ReturnType<typeof useQuizCapture>['submitQuiz']>[0];

/** Builds the submit-quiz payload shared by the initial reveal submit and the
 *  later WhatsApp enrichment submit, so both stay in sync on a single source. */
function buildQuizSubmitInput(
    form: LeadForm,
    pKey: ProfileKey,
    answers: QuizAnswers,
    opts: { skipped: boolean; whatsapp?: string },
): QuizSubmitInput {
    const profile = TRAVELER_PROFILES[pKey];
    const mainDest = selectMainDestination(pKey, answers.destino ?? []);
    const firstName = form.nome.trim().split(/\s+/)[0] || 'Viajante';
    const lastName = form.sobrenome.trim();
    const bantSummary = `Quiz Anhangá · Perfil: ${profile.name} · Destino: ${mainDest.name} · ${buildAnswersSummary(answers)}`;

    return {
        firstName,
        lastName,
        email: form.email,
        whatsapp: opts.whatsapp,
        profileKey: pKey,
        profileName: profile.name,
        bantSummary,
        destinos: answers.destino ?? [],
        skipped: opts.skipped,
        newsletterOptIn: form.aceite,
    };
}

export default function QuizAnhangaLanding() {
    const urlParams = useQuizUrlParams();
    const [state, dispatch] = useReducer(quizReducer, QUIZ_INITIAL_STATE);
    const { stage, direction, answers, leadForm, profileKey, baseWaUrl, submitFailed } = state;
    const { submitQuiz } = useQuizCapture();

    // Pré-preenche o PreLeadScreen quando a URL traz dados mas o form não é
    // pulado (skip ausente/false). O `aceite` segue de fora: opt-in explícito.
    const leadInitialValues = useMemo<Partial<LeadForm>>(
        () => ({ nome: urlParams.nome, sobrenome: urlParams.sobrenome, email: urlParams.email }),
        [urlParams],
    );

    const go = useCallback((next: Stage, dir: 'forward' | 'back' = 'forward') => {
        dispatch({ type: 'GO', stage: next, direction: dir });
        window.scrollTo(0, 0);
    }, []);

    function start() { go({ kind: 'question', index: 0 }); }

    function answerQ(qId: string, value: string[]) {
        dispatch({ type: 'ANSWER', qId, value });
    }

    function nextQ(currentIndex: number) {
        if (currentIndex + 1 >= QUIZ_QUESTIONS.length) {
            if (urlParams.skip) {
                // Lead já conhecido — pula formulário e dispara diretamente
                void handleLeadSubmit(
                    { nome: urlParams.nome, sobrenome: urlParams.sobrenome, email: urlParams.email, aceite: true },
                    true,
                );
            } else {
                go({ kind: 'lead' });
            }
        } else {
            go({ kind: 'question', index: currentIndex + 1 });
        }
    }

    function backQ(currentIndex: number) {
        if (currentIndex === 0) go({ kind: 'hero' }, 'back');
        else go({ kind: 'question', index: currentIndex - 1 }, 'back');
    }

    async function handleLeadSubmit(form: LeadForm, skipped = false) {
        const pKey = matchProfile(answers);
        const profile = TRAVELER_PROFILES[pKey];
        const mainDest = selectMainDestination(pKey, answers.destino ?? []);

        const firstName = form.nome.trim().split(/\s+/)[0] || 'Viajante';
        const waMsg = `Oi! Sou ${firstName}. Descobri no Quiz da Anhangá que meu perfil é ${profile.name} e meu próximo destino pode ser ${mainDest.name}. Bora planejar essa viagem?`;
        const waUrl = getWhatsAppLink(waMsg, { appendTrackingRef: true });

        dispatch({ type: 'SUBMIT_RESULT', leadForm: form, profileKey: pKey, baseWaUrl: waUrl });
        go({ kind: 'result' });

        const result = await submitQuiz(buildQuizSubmitInput(form, pKey, answers, { skipped }));

        if (!result.ok) {
            dispatch({ type: 'SUBMIT_FAILED' });
        }
    }

    // Phone is captured only on the result screen, after the lead already exists.
    // Re-submit to enrich the existing lead (n8n + Salesforce) with the WhatsApp
    // number; suppress the conversion event so it isn't double-counted.
    const handlePhoneSubmit = useCallback((phone: string) => {
        if (!leadForm || !profileKey) return;
        void submitQuiz(
            buildQuizSubmitInput(leadForm, profileKey, answers, { skipped: urlParams.skip, whatsapp: phone }),
            { trackConversion: false },
        );
    }, [leadForm, profileKey, answers, urlParams.skip, submitQuiz]);

    function restart() {
        dispatch({ type: 'RESTART' });
        window.scrollTo(0, 0);
    }

    const stageKey = stage.kind === 'question' ? `q-${stage.index}` : stage.kind;

    return (
        <>
            <Seo
                title="Quiz de Destinos | Descubra seu próximo rolê — Anhangá Viagens"
                description="6 perguntas rápidas para descobrir seu perfil de viajante e os destinos que mais combinam com você. Gratuito e sem compromisso."
                canonical="https://www.anhanga.tur.br/quiz/"
                robots="noindex, follow"
                noHreflang
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Início', item: 'https://www.anhanga.tur.br/' },
                    { name: 'Quiz de Destinos', item: 'https://www.anhanga.tur.br/quiz/' },
                ]}
            />
            <div className="quiz-page">
                <div className="quiz-app">
                    <div className={`quiz-stage quiz-stage--slide quiz-stage--${direction}`}>
                        <div className="quiz-stage-inner" key={stageKey}>
                            <StageContent
                                stage={stage}
                                answers={answers}
                                profileKey={profileKey}
                                leadForm={leadForm}
                                leadInitialValues={leadInitialValues}
                                baseWaUrl={baseWaUrl}
                                submitFailed={submitFailed}
                                onStart={start}
                                onAnswerQ={answerQ}
                                onNextQ={nextQ}
                                onBackQ={backQ}
                                onLeadSubmit={handleLeadSubmit}
                                onRestart={restart}
                                onGo={go}
                                onPhoneSubmit={handlePhoneSubmit}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
