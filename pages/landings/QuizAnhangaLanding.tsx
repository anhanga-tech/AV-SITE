import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SEO } from '../../components/SEO';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { useQuizCapture } from '../../hooks/useQuizCapture';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { matchProfile, type ProfileKey } from '../../lib/quiz-scoring';
import {
    selectMainDestination,
    selectInspirationDestinations,
    type MainDestination,
    type InspirationDestination,
} from '../../lib/quiz-destinations';
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
   Dados do quiz
   ========================================================================== */

interface QuizOption {
    id: string;
    label: string;
    hint?: string;
    emoji?: string;
}

interface QuizQuestion {
    id: string;
    eyebrow: string;
    title: string;
    subtitle?: string;
    multi: boolean;
    layout?: 'cards' | 'pills';
    options: QuizOption[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 'destino',
        eyebrow: 'Pergunta 01',
        title: 'Você acabou de pousar. Onde chegou?',
        subtitle: 'Pode escolher mais de um.',
        multi: true,
        layout: 'cards',
        options: [
            { id: 'europa',         label: 'Europa',           hint: 'Cidades, vinho, história',      emoji: '🏛️' },
            { id: 'america-norte',  label: 'América do Norte', hint: 'Parques, road trips, NY',       emoji: '🗽' },
            { id: 'latam',          label: 'América Latina',   hint: 'Cultura viva, vizinho querido', emoji: '🌴' },
            { id: 'caribe',         label: 'Caribe',           hint: 'Águas turquesa, ilha em ilha',  emoji: '🏝️' },
            { id: 'asia',           label: 'Ásia',             hint: 'Templos, mercado, sushi',       emoji: '⛩️' },
            { id: 'africa-oriente', label: 'África & Oriente', hint: 'Deserto, safari, culturas',     emoji: '🦁' },
            { id: 'surpresa',       label: 'Me surpreenda!',   hint: 'Pode ser qualquer coisa',       emoji: '✨' },
        ],
    },
    {
        id: 'cena',
        eyebrow: 'Pergunta 02',
        title: 'Qual cena de viagem mais combina com você?',
        subtitle: 'Escolha a que mais te representa.',
        multi: false,
        layout: 'cards',
        options: [
            { id: 'aventura',      label: 'Aventura & autenticidade', hint: 'Trilhas, locais, fora do mapa' },
            { id: 'familia',       label: 'Família em movimento',     hint: 'Roteiro pra todas as idades' },
            { id: 'luxo',          label: 'Luxo & conforto',          hint: 'Hotel incrível, jantar premiado' },
            { id: 'microescapada', label: 'Microescapada',            hint: '3-4 dias e bora' },
            { id: 'natureza',      label: 'Natureza & ecoturismo',    hint: 'Florestas, parques, silêncio' },
            { id: 'wellness',      label: 'Descanso & wellness',      hint: 'Spa, praia, nada na agenda' },
        ],
    },
    {
        id: 'companhia',
        eyebrow: 'Pergunta 03',
        title: 'Com quem você viaja, na maior parte das vezes?',
        multi: false,
        options: [
            { id: 'solo',    label: 'Só eu',         hint: 'Modo livre total' },
            { id: 'parceiro',label: 'Eu e meu par',  hint: 'A dois' },
            { id: 'familia', label: 'Família',        hint: 'Crianças e/ou pais' },
            { id: 'variado', label: 'Turma variada', hint: 'Amigos, grupos, quanto mais melhor' },
        ],
    },
    {
        id: 'frustracao',
        eyebrow: 'Pergunta 04',
        title: 'O que mais te frustra em uma viagem?',
        multi: false,
        options: [
            { id: 'sem-liberdade', label: 'Roteiro engessado',  hint: 'Sem espaço pra improvisar' },
            { id: 'multidao',      label: 'Multidão',           hint: 'Turistada, filas, selfie stick' },
            { id: 'hotel-ruim',    label: 'Hospedagem ruim',    hint: 'Conforto abaixo do esperado' },
            { id: 'genericas',     label: 'Atrações genéricas', hint: 'Mesmo de sempre, sem surpresa' },
            { id: 'caro-demais',   label: 'Custo alto demais',  hint: 'Não cabe no bolso' },
        ],
    },
    {
        id: 'horizonte',
        eyebrow: 'Pergunta 05',
        title: 'O que trava essa viagem de sair do papel?',
        multi: false,
        options: [
            { id: 'budget',     label: 'Dinheiro. Preciso guardar mais um pouco.' },
            { id: 'tempo',      label: 'Tempo. Minha agenda não colabora agora.' },
            { id: 'companhia',  label: 'Companhia. Ainda não achei quem tope.' },
            { id: 'destino',    label: 'Só não me decidi para onde ir ainda.' },
        ],
    },
    {
        id: 'ritmo',
        eyebrow: 'Pergunta 06',
        title: 'Como você organiza uma viagem antes de sair?',
        multi: false,
        options: [
            { id: 'planejado',       label: 'Tudo planejado',    hint: 'Roteiro fechado, sem improviso' },
            { id: 'semi-planejado',  label: 'Semi-planejado',    hint: 'Base definida, liberdade no meio' },
            { id: 'quase-livre',     label: 'Quase livre',       hint: 'Só hotel reservado, o resto vejo lá' },
            { id: 'livre',           label: 'Totalmente livre',  hint: 'Decido tudo na hora' },
        ],
    },
];

interface TravelerProfile {
    name: string;
    tagline: string;
    description: string;
    color: 'orange' | 'emerald' | 'blue' | 'sky' | 'yellow';
    icon: string;
}

const TRAVELER_PROFILES: Record<ProfileKey, TravelerProfile> = {
    'escapista': {
        name: 'Escapista',
        tagline: 'Você quer sair da rotina — sem sair da zona de conforto.',
        description: 'Praia, resort, tudo incluído e nem uma preocupação para gerenciar. Sua viagem ideal é aquela em que você desembarca e só precisa decidir se quer sol ou sombra. A Anhangá conhece os destinos certos para quem quer descansar de verdade.',
        color: 'sky',
        icon: '☀',
    },
    'bon-vivant': {
        name: 'Bon Vivant',
        tagline: 'Você viaja pra curtir a boa vida — com estilo.',
        description: 'Hotel com vista, jantar em restaurante premiado, um roteiro que combina o melhor da gastronomia, cultura e conforto. Você não abre mão de qualidade, mas também curte explorar. A Anhangá monta o itinerário perfeito para quem sabe viver bem.',
        color: 'yellow',
        icon: '◆',
    },
    'viajante-de-verdade': {
        name: 'Viajante de Verdade',
        tagline: 'Você equilibra conforto e descoberta com maestria.',
        description: 'Nem tudo planejado, nem totalmente improvisado. Você curte um bom hotel, mas também embica pela rua sem destino e acha o melhor restaurante da cidade assim. A Anhangá adora montar roteiros para quem quer o melhor dos dois mundos.',
        color: 'emerald',
        icon: '✦',
    },
    'desbravador': {
        name: 'Desbravador',
        tagline: 'Você vai além do roteiro e volta com história pra contar.',
        description: 'Trilhas, cidades pouco visitadas, contato com a cultura local de verdade. Você não tem medo de sair do mapa — e é aí que estão as melhores memórias. A Anhangá tem especialistas que conhecem os destinos que você ainda não descobriu.',
        color: 'orange',
        icon: '⛰',
    },
    'nomade-de-alma': {
        name: 'Nômade de Alma',
        tagline: 'O mundo é o seu quintal — e você ainda não viu tudo.',
        description: 'Você quer o que poucos ousam: destinos diferentes, experiências únicas, total liberdade. O roteiro é um ponto de partida, não um manual. A Anhangá tem consultores que já viajaram para os lugares mais improváveis — e sabem como te mandar pra lá.',
        color: 'blue',
        icon: '◐',
    },
};

type QuizAnswers = Record<string, string[]>;

const SUMMARY_LABELS: Record<string, Record<string, string>> = {
    destino: {
        'europa': 'Europa', 'america-norte': 'América do Norte', 'latam': 'América Latina',
        'caribe': 'Caribe', 'asia': 'Ásia', 'africa-oriente': 'África & Oriente', 'surpresa': 'Surpresa',
    },
    cena: {
        'aventura': 'Aventura', 'familia': 'Família', 'luxo': 'Luxo',
        'microescapada': 'Microescapada', 'natureza': 'Natureza', 'wellness': 'Wellness',
    },
    companhia: { 'solo': 'Solo', 'parceiro': 'Casal', 'familia': 'Família', 'variado': 'Grupo' },
    frustracao: {
        'sem-liberdade': 'Roteiro engessado', 'multidao': 'Multidão',
        'hotel-ruim': 'Hospedagem ruim', 'genericas': 'Atrações genéricas', 'caro-demais': 'Custo alto',
    },
    horizonte: { 'budget': 'Dinheiro', 'tempo': 'Tempo', 'companhia': 'Companhia', 'destino': 'Destino indefinido' },
    ritmo: {
        'planejado': 'Planejado', 'semi-planejado': 'Semi-planejado',
        'quase-livre': 'Quase livre', 'livre': 'Livre',
    },
};

function buildAnswersSummary(answers: QuizAnswers): string {
    return Object.entries(answers)
        .flatMap(([qId, sel]) => {
            if (!sel?.length) return [];
            const map = SUMMARY_LABELS[qId];
            if (!map) return [];
            return [sel.map((id) => map[id] ?? id).join(', ')];
        })
        .join(' · ');
}

/* ==========================================================================
   Tipos do orquestrador
   ========================================================================== */

type Stage =
    | { kind: 'hero' }
    | { kind: 'question'; index: number }
    | { kind: 'lead' }
    | { kind: 'result' };

interface LeadForm {
    nome: string;
    sobrenome: string;
    email: string;
    aceite: boolean;
}

/* ==========================================================================
   Componente: ChunkyQuiz
   ========================================================================== */

function ChunkyQuiz() {
    const letters = ['Q', 'U', 'I', 'Z', '!'];
    const layerColors = ['#FFD600', '#FFB800', '#FF9100', '#F97316', '#EA580C'];

    return (
        <div className="quiz-chunky-wrap">
            <div className="quiz-chunky quiz-chunky-layered">
                {layerColors.map((c, idx) => (
                    <div
                        key={c}
                        className="quiz-ch-layer"
                        aria-hidden="true"
                        style={{
                            transform: `translate(${(layerColors.length - idx) * 6}px, ${(layerColors.length - idx) * 6}px)`,
                            color: c,
                            zIndex: idx,
                        }}
                    >
                        {letters.map((l) => <span key={l} className="quiz-ch-letter">{l}</span>)}
                    </div>
                ))}
                <div className="quiz-ch-front" style={{ zIndex: 99 }}>
                    {letters.map((l) => <span key={l} className="quiz-ch-letter">{l}</span>)}
                </div>
            </div>
        </div>
    );
}

/* ==========================================================================
   Componente: HeroScreen
   ========================================================================== */

function HeroScreen({ onStart }: { onStart: () => void }) {
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
                    <button className="quiz-btn quiz-btn-primary quiz-btn-lg quiz-btn--hero" onClick={onStart}>
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

/* ==========================================================================
   Componente: Progress
   ========================================================================== */

const PROGRESS_MILESTONES: Record<number, string> = {
    3: 'Na metade!',
    6: 'Última!',
};

function Progress({ current, total }: { current: number; total: number }) {
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
            <div className="quiz-progress-bar" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
                <div className="quiz-progress-fill" style={{ '--progress': progress } as React.CSSProperties} />
            </div>
        </div>
    );
}

/* ==========================================================================
   Componente: QuestionScreen — auto-avanço com feedback visual de 500ms
   ========================================================================== */

interface QuestionScreenProps {
    q: QuizQuestion;
    qIndex: number;
    total: number;
    value: string[] | undefined;
    onChange: (v: string[]) => void;
    onNext: () => void;
    onBack: () => void;
}

function QuestionScreen({ q, qIndex, total, value, onChange, onNext, onBack }: QuestionScreenProps) {
    const selected: string[] = value ?? [];
    const [pendingId, setPendingId] = useState<string | null>(null);
    const advanceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // reset pending when question changes and clear any pending timer
    useEffect(() => {
        setPendingId(null);
        return () => {
            if (advanceTimerRef.current !== null) {
                clearTimeout(advanceTimerRef.current);
            }
        };
    }, [q.id]);

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
                <button className="quiz-q-back" onClick={onBack} aria-label="Voltar">
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
                            key={opt.id}
                            className={[
                                `quiz-opt ${optClass}`,
                                isSelected(opt.id) ? 'is-selected' : '',
                                pendingId === opt.id ? 'is-confirming' : '',
                            ].join(' ').trim()}
                            onClick={() => !pendingId && toggle(opt.id)}
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
                            className="quiz-btn quiz-btn-primary"
                            disabled={selected.length === 0}
                            onClick={onNext}
                        >
                            Próxima
                            <span className="quiz-arrow">→</span>
                        </button>
                        <span className="quiz-q-foot-meta">
                            {selected.length === 1 ? '1 escolhido' : `${selected.length} escolhidos`}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ==========================================================================
   Componente: PreLeadScreen — passo 1: nome + email antes do resultado
   ========================================================================== */

interface PreLeadScreenProps {
    profile: TravelerProfile;
    onSubmit: (form: LeadForm) => void;
    onBack: () => void;
}

function PreLeadScreen({ profile, onSubmit, onBack }: PreLeadScreenProps) {
    const [form, setForm] = useState<LeadForm>({ nome: '', sobrenome: '', email: '', aceite: false });
    const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>({});

    function update<K extends keyof LeadForm>(k: K, v: LeadForm[K]) {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: undefined }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const errs: typeof errors = {};
        if (!form.nome.trim()) errs.nome = 'Conta pra gente seu nome';
        if (!form.sobrenome.trim()) errs.sobrenome = 'E o sobrenome?';
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = 'E-mail inválido';
        if (!form.aceite) errs.aceite = 'Precisa do aceite pra continuar';
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSubmit(form);
    }

    return (
        <div className="quiz-screen quiz-screen-lead">
            <div className="quiz-q-top">
                <button className="quiz-q-back" onClick={onBack} aria-label="Voltar">← voltar</button>
                <span className="quiz-q-step">Último passo!</span>
            </div>

            <div className="quiz-lead-card">
                <span className="quiz-stamp-lead">PRONTO</span>

                <div className={`quiz-lead-preview quiz-lead-preview--${profile.color}`} aria-hidden="true">
                    <div className="quiz-lead-preview-orbit">
                        <span className="quiz-lead-preview-icon">{profile.icon}</span>
                    </div>
                    <div className="quiz-lead-preview-copy">
                        <span className="quiz-lead-preview-kicker">perfil calculado</span>
                        <strong>Resultado reservado</strong>
                        <span className="quiz-lead-preview-line" />
                    </div>
                </div>

                <h2 className="quiz-lead-title">Seu perfil está pronto.</h2>
                <p className="quiz-lead-sub">
                    Seu perfil, destino principal e três ideias para sonhar já estão separados.
                    Deixe um contato para guardar o resultado e abrir tudo agora.
                </p>

                <form className="quiz-lead-form" onSubmit={submit}>
                    <div className="quiz-field">
                        <label htmlFor="quiz-nome">Como podemos te chamar?</label>
                        <input
                            id="quiz-nome"
                            type="text"
                            placeholder="Seu nome"
                            value={form.nome}
                            onChange={(e) => update('nome', e.target.value)}
                            className={errors.nome ? 'has-error' : ''}
                            autoComplete="given-name"
                        />
                        {errors.nome && <span className="quiz-err">{errors.nome}</span>}
                    </div>

                    <div className="quiz-field">
                        <label htmlFor="quiz-sobrenome">Sobrenome</label>
                        <input
                            id="quiz-sobrenome"
                            type="text"
                            placeholder="Seu sobrenome"
                            value={form.sobrenome}
                            onChange={(e) => update('sobrenome', e.target.value)}
                            className={errors.sobrenome ? 'has-error' : ''}
                            autoComplete="family-name"
                        />
                        {errors.sobrenome && <span className="quiz-err">{errors.sobrenome}</span>}
                    </div>

                    <div className="quiz-field">
                        <label htmlFor="quiz-email">E-mail</label>
                        <input
                            id="quiz-email"
                            type="email"
                            placeholder="voce@email.com"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            className={errors.email ? 'has-error' : ''}
                            autoComplete="email"
                        />
                        {errors.email && <span className="quiz-err">{errors.email}</span>}
                    </div>

                    <label className="quiz-check">
                        <input
                            type="checkbox"
                            checked={form.aceite}
                            onChange={(e) => update('aceite', e.target.checked)}
                        />
                        <span className="quiz-check-box" aria-hidden="true" />
                        <span className="quiz-check-label">
                            Topo receber novidades e ofertas da Anhangá. Posso cancelar quando quiser.
                            Veja nossa <a href="/politica-privacidade/">política de privacidade</a>.
                        </span>
                    </label>
                    {errors.aceite && <span role="status" className="quiz-err quiz-err-block">{errors.aceite}</span>}

                    <button type="submit" className="quiz-btn quiz-btn-primary quiz-btn-lg">
                        Revelar meu perfil
                        <span className="quiz-arrow">→</span>
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ==========================================================================
   Componente: Confetti
   ========================================================================== */

interface ConfettiPiece {
    id: number; left: number; delay: number; duration: number;
    rotate: number; drift: number; size: number; color: string;
    shape: 'paper' | 'circle' | 'star';
}

const CONF_SHAPES: ConfettiPiece['shape'][] = [
    'paper', 'paper', 'paper', 'circle', 'star',
    'paper', 'circle', 'paper', 'paper', 'star',
];

function Confetti({ active }: { active: boolean }) {
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

/* ==========================================================================
   Componente: Polaroid — com imagem Cloudflare
   ========================================================================== */

const QUIZ_IMG_BASE = 'https://media.anhanga.tur.br/quiz';

function Polaroid({ dest, index }: { dest: InspirationDestination; index: number }) {
    const tilts = [-2.4, 1.6, -1.2, 2, -1.8];
    const tilt = tilts[index % tilts.length];
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

/* ==========================================================================
   Componente: MainDestCard — destino principal contextualizado
   ========================================================================== */

function MainDestCard({ dest }: { dest: MainDestination }) {
    return (
        <div className="quiz-main-dest-card">
            <span className="quiz-main-dest-region">{dest.region.toUpperCase()}</span>
            <strong className="quiz-main-dest-name">{dest.name}</strong>
            <span className="quiz-main-dest-sub">{dest.subtitle}</span>
            <span className="quiz-main-dest-tag">{dest.tag}</span>
        </div>
    );
}

/* ==========================================================================
   Componente: WhatsAppUpgrade — passo 2: WhatsApp opcional no resultado
   ========================================================================== */

interface WhatsAppUpgradeProps {
    profileName: string;
    mainDestName: string;
    firstName: string;
    baseWaUrl: string;
}

function WhatsAppUpgrade({ profileName, mainDestName, firstName, baseWaUrl }: WhatsAppUpgradeProps) {
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);

    function maskPhone(v: string): string {
        const d = v.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }

    const digits = phone.replace(/\D/g, '');
    const isValid = digits.length >= 10;

    const waUrl = isValid && submitted
        ? getWhatsAppLink(
            `Oi! Sou ${firstName}. Descobri no Quiz da Anhangá que meu perfil é ${profileName} e meu próximo destino pode ser ${mainDestName}. Bora planejar essa viagem?`,
            { appendTrackingRef: true },
          )
        : baseWaUrl;

    if (submitted) {
        return (
            <div className="quiz-wa-upgrade quiz-wa-upgrade--done">
                <p className="quiz-wa-upgrade-done">
                    Perfeito! Agora é só abrir o WhatsApp.
                </p>
                <a
                    className="btn-whatsapp btn-specialist quiz-btn quiz-btn-primary quiz-btn-lg"
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-tracking="result-quiz-whatsapp"
                >
                    Montar minha viagem
                    <span className="quiz-arrow">→</span>
                </a>
            </div>
        );
    }

    return (
        <div className="quiz-wa-upgrade">
            <p className="quiz-wa-upgrade-label">
                Quer guardar seu perfil no WhatsApp?
            </p>
            <div className="quiz-wa-upgrade-row">
                <input
                    type="tel"
                    className="quiz-wa-input"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    aria-label="Número de WhatsApp (opcional)"
                />
                <button
                    type="button"
                    className={`quiz-btn quiz-btn-primary ${isValid ? 'quiz-btn--ready' : ''}`}
                    onClick={() => isValid && setSubmitted(true)}
                    disabled={!isValid}
                >
                    Enviar
                </button>
            </div>
            <a
                className="btn-whatsapp btn-specialist quiz-wa-skip"
                href={baseWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-tracking="result-quiz-skip"
            >
                Ir pro WhatsApp sem deixar número →
            </a>
        </div>
    );
}

/* ==========================================================================
   Componente: ResultScreen — reveal escalonado + upgrade de WhatsApp
   ========================================================================== */

interface ResultScreenProps {
    profile: TravelerProfile;
    mainDest: MainDestination;
    inspirations: InspirationDestination[];
    lead: LeadForm;
    onRestart: () => void;
    baseWaUrl: string;
    submitFailed: boolean;
}

function ResultScreen({ profile, mainDest, inspirations, lead, onRestart, baseWaUrl, submitFailed }: ResultScreenProps) {
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
                            <Polaroid key={d.name} dest={d} index={i} />
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
                    <button className="quiz-btn quiz-btn-ghost quiz-result-restart" onClick={onRestart}>
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

/* ==========================================================================
   StageContent — renderiza a tela correta do quiz
   ========================================================================== */

interface StageContentProps {
    stage: Stage;
    answers: Record<string, string[]>;
    profileKey: ProfileKey | null;
    leadForm: LeadForm | null;
    baseWaUrl: string;
    submitFailed: boolean;
    onStart: () => void;
    onAnswerQ: (qId: string, value: string[]) => void;
    onNextQ: (currentIndex: number) => void;
    onBackQ: (currentIndex: number) => void;
    onLeadSubmit: (data: LeadForm, skipped?: boolean) => void;
    onRestart: () => void;
    onGo: (next: Stage, dir?: 'forward' | 'back') => void;
}

function StageContent({
    stage, answers, profileKey, leadForm, baseWaUrl, submitFailed,
    onStart, onAnswerQ, onNextQ, onBackQ, onLeadSubmit, onRestart, onGo,
}: StageContentProps) {
    if (stage.kind === 'hero') return <HeroScreen onStart={onStart} />;
    if (stage.kind === 'question') {
        const q = QUIZ_QUESTIONS[stage.index];
        return (
            <QuestionScreen
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
            />
        );
    }
    return null;
}

/* ==========================================================================
   Componente principal
   ========================================================================== */

export default function QuizAnhangaLanding() {
    const urlParams = useQuizUrlParams();
    const [stage, setStage] = useState<Stage>({ kind: 'hero' });
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const [answers, setAnswers] = useState<QuizAnswers>({});
    const [leadForm, setLeadForm] = useState<LeadForm | null>(null);
    const [profileKey, setProfileKey] = useState<ProfileKey | null>(null);
    const [baseWaUrl, setBaseWaUrl] = useState('');
    const [submitFailed, setSubmitFailed] = useState(false);
    const { submitQuiz } = useQuizCapture();

    const go = useCallback((next: Stage, dir: 'forward' | 'back' = 'forward') => {
        setDirection(dir);
        setStage(next);
        window.scrollTo(0, 0);
    }, []);

    function start() { go({ kind: 'question', index: 0 }); }

    function answerQ(qId: string, value: string[]) {
        setAnswers((a) => ({ ...a, [qId]: value }));
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
        const lastName = form.sobrenome.trim();
        const bantSummary = `Quiz Anhangá · Perfil: ${profile.name} · Destino: ${mainDest.name} · ${buildAnswersSummary(answers)}`;

        const waMsg = `Oi! Sou ${firstName}. Descobri no Quiz da Anhangá que meu perfil é ${profile.name} e meu próximo destino pode ser ${mainDest.name}. Bora planejar essa viagem?`;
        const waUrl = getWhatsAppLink(waMsg, { appendTrackingRef: true });

        // Avança para o resultado imediatamente — API roda em paralelo
        setLeadForm(form);
        setProfileKey(pKey);
        setBaseWaUrl(waUrl);
        setSubmitFailed(false);
        go({ kind: 'result' });

        const result = await submitQuiz({
            firstName,
            lastName,
            email: form.email,
            profileKey: pKey,
            profileName: profile.name,
            bantSummary,
            destinos: answers.destino ?? [],
            skipped,
        });

        if (!result.ok) {
            setSubmitFailed(true);
        }
    }

    function restart() {
        setAnswers({});
        setLeadForm(null);
        setProfileKey(null);
        setBaseWaUrl('');
        setSubmitFailed(false);
        go({ kind: 'hero' }, 'back');
    }

    const stageKey = stage.kind === 'question' ? `q-${stage.index}` : stage.kind;

    return (
        <>
            <SEO
                title="Quiz de Destinos | Descubra seu próximo rolê — Anhangá Viagens"
                description="6 perguntas rápidas para descobrir seu perfil de viajante e os destinos que mais combinam com você. Gratuito e sem compromisso."
                canonical="https://www.anhanga.tur.br/quiz/"
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
                                baseWaUrl={baseWaUrl}
                                submitFailed={submitFailed}
                                onStart={start}
                                onAnswerQ={answerQ}
                                onNextQ={nextQ}
                                onBackQ={backQ}
                                onLeadSubmit={handleLeadSubmit}
                                onRestart={restart}
                                onGo={go}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
