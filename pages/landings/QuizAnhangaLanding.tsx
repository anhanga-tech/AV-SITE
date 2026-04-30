import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SEO } from '../../components/SEO';
import { useQuizCapture } from '../../hooks/useQuizCapture';
import { getWhatsAppLink } from '../../utils/whatsapp';
import './quiz-anhanga.css';

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
    options: QuizOption[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 'destino',
        eyebrow: 'Pergunta 01',
        title: 'Qual canto do mundo te chama?',
        subtitle: 'Pode escolher mais de um — a gente entende.',
        multi: true,
        options: [
            { id: 'europa',    label: 'Europa',           hint: 'Cidades, vinho, história',      emoji: 'EU' },
            { id: 'america-n', label: 'América do Norte', hint: 'Parques, road trips, NY',       emoji: 'NA' },
            { id: 'cruzeiros', label: 'Cruzeiros',        hint: 'Vários destinos, uma cabine',   emoji: 'CR' },
            { id: 'asia',      label: 'Ásia',             hint: 'Templos, mercado, sushi',       emoji: 'AS' },
            { id: 'latam',     label: 'América Latina',   hint: 'Cultura viva, vizinho querido', emoji: 'LA' },
            { id: 'brasil',    label: 'Brasil',           hint: 'O nosso quintal continental',   emoji: 'BR' },
            { id: 'caribe',    label: 'Caribe',           hint: 'Águas turquesa, ilha em ilha',  emoji: 'CA' },
        ],
    },
    {
        id: 'perfil',
        eyebrow: 'Pergunta 02',
        title: 'Como você gosta de viajar?',
        subtitle: 'Marca o que mais combina com você.',
        multi: false,
        options: [
            { id: 'aventura', label: 'Aventura & autenticidade', hint: 'Trilhas, locais, fora do mapa' },
            { id: 'familia',  label: 'Família',                  hint: 'Roteiro pra todas as idades' },
            { id: 'luxo',     label: 'Luxo & wellness',          hint: 'Spa, vista e silêncio bom' },
            { id: 'micro',    label: 'Microescapadas',           hint: '3-4 dias e bora' },
            { id: 'praia',    label: 'Praia',                    hint: 'Pé na areia, descanso' },
            { id: 'cultural', label: 'Cultural',                 hint: 'Museus, ruas, conversas' },
        ],
    },
    {
        id: 'companhia',
        eyebrow: 'Pergunta 03',
        title: 'Quem vai com você?',
        multi: false,
        options: [
            { id: 'sozinho', label: 'Só eu',           hint: 'Modo livre' },
            { id: 'casal',   label: 'Eu e meu par',    hint: 'A dois' },
            { id: 'familia', label: 'Família',          hint: 'Crianças e/ou pais' },
            { id: 'amigos',  label: 'Turma de amigos', hint: 'Quanto mais, melhor' },
        ],
    },
    {
        id: 'ritmo',
        eyebrow: 'Pergunta 04',
        title: 'Qual o ritmo da viagem?',
        multi: false,
        options: [
            { id: 'corrido',       label: 'Corrido',       hint: 'Quero ver o máximo possível' },
            { id: 'equilibrado',   label: 'Equilibrado',   hint: 'Um pouco de tudo' },
            { id: 'contemplativo', label: 'Contemplativo', hint: 'Devagar, com calma' },
        ],
    },
    {
        id: 'quando',
        eyebrow: 'Pergunta 05',
        title: 'Quando você pensa em ir?',
        multi: false,
        options: [
            { id: 'logo',     label: 'Nos próximos 3 meses', hint: 'A mala já tá quase pronta' },
            { id: 'semestre', label: 'Daqui 3 a 6 meses',    hint: 'Tem tempo de planejar bem' },
            { id: 'ano',      label: 'Esse ano ainda',       hint: 'Sem pressa, sem preguiça' },
            { id: 'sonhando', label: 'Só sonhando ainda',    hint: 'Plantando a sementinha' },
        ],
    },
];

interface TravelerDestination {
    name: string;
    region: string;
    tag: string;
    imageKey: string;
}

interface TravelerProfile {
    name: string;
    tagline: string;
    description: string;
    color: 'orange' | 'emerald' | 'blue' | 'sky' | 'yellow';
    icon: string;
    destinations: TravelerDestination[];
}

type ProfileKey = 'aventureiro' | 'contemplativo' | 'cultural' | 'praiano' | 'familia' | 'sibarita';

// imageKey maps to: https://media.anhanga.tur.br/{imageKey}.webp
const TRAVELER_PROFILES: Record<ProfileKey, TravelerProfile> = {
    aventureiro: {
        name: 'Aventureiro',
        tagline: 'Você troca lobby por trilha sem pensar duas vezes.',
        description: 'Seu mapa tem mais picos que praias. Procura o local, a comida que ninguém indicou, a história que só quem foi sabe contar. A Anhangá tem gente que viveu esses lugares — e sabe quando te empurrar pro próximo desafio.',
        color: 'orange',
        icon: '⛰',
        destinations: [
            { name: 'Patagônia',  region: 'Argentina · Chile', tag: 'Trilha + glaciar',    imageKey: 'patagonia' },
            { name: 'Marrocos',   region: 'África do Norte',   tag: 'Deserto + medina',    imageKey: 'marrocos' },
            { name: 'Chapada',    region: 'Bahia · Brasil',    tag: 'Cachoeira + cerrado', imageKey: 'chapada' },
        ],
    },
    contemplativo: {
        name: 'Contemplativo',
        tagline: 'Você viaja pra desacelerar, não pra colecionar carimbo.',
        description: 'Prefere uma manhã longa de café numa varanda do que três cidades em três dias. Busca silêncio, vista e gente sem pressa. A Anhangá curadora pousadas onde o wi-fi é fraquinho de propósito.',
        color: 'emerald',
        icon: '◐',
        destinations: [
            { name: 'Toscana',  region: 'Itália',          tag: 'Vinho + colina', imageKey: 'toscana' },
            { name: 'Bali',     region: 'Indonésia',       tag: 'Arrozal + spa',  imageKey: 'bali' },
            { name: 'Trancoso', region: 'Bahia · Brasil',  tag: 'Quadrado + mar', imageKey: 'trancoso' },
        ],
    },
    cultural: {
        name: 'Curioso Cultural',
        tagline: 'Você lê o cardápio inteiro antes de pedir — e faz o mesmo com a cidade.',
        description: 'Museu de manhã, mercado à tarde, restaurante de bairro à noite. Quer entender o lugar, não só ver. A Anhangá monta dia-a-dia com guia que conversa, não que recita.',
        color: 'blue',
        icon: '✦',
        destinations: [
            { name: 'Lisboa',           region: 'Portugal', tag: 'Bairro + fado', imageKey: 'lisboa' },
            { name: 'Cidade do México', region: 'México',   tag: 'Arte + tacos',  imageKey: 'cdmx' },
            { name: 'Quioto',           region: 'Japão',    tag: 'Templo + chá',  imageKey: 'quioto' },
        ],
    },
    praiano: {
        name: 'Praiano de Alma',
        tagline: 'Pé na areia é onde sua mente desliga.',
        description: 'A viagem ideal tem som de onda no fundo. Quer um lugar bonito, água que valha a pena entrar, e jantar com vista pro pôr-do-sol. A Anhangá conhece a praia certa pro seu ritmo — sem turistada.',
        color: 'sky',
        icon: '~',
        destinations: [
            { name: 'Maragogi', region: 'Alagoas · Brasil',  tag: 'Piscina natural',    imageKey: 'maragogi' },
            { name: 'Aruba',    region: 'Caribe',            tag: 'Vento + areia branca', imageKey: 'aruba' },
            { name: 'Maldivas', region: 'Oceano Índico',     tag: 'Bangalô + recife',   imageKey: 'maldivas' },
        ],
    },
    familia: {
        name: 'Família em Movimento',
        tagline: 'Viajar com os seus é diversão pra todo mundo, inclusive você.',
        description: 'Quer um roteiro que funciona pra criança, pra avó e pra você também. Atividade pra todo mundo, hora de descanso, e nada de "espera aí, mais 30 minutinhos". A Anhangá calibra cada dia pra família inteira voltar feliz.',
        color: 'yellow',
        icon: '♥',
        destinations: [
            { name: 'Orlando',         region: 'EUA',            tag: 'Parque + temático', imageKey: 'orlando' },
            { name: 'Bariloche',       region: 'Argentina',      tag: 'Neve + lago',       imageKey: 'bariloche' },
            { name: 'Costa do Sauípe', region: 'Bahia · Brasil', tag: 'Resort + criança',  imageKey: 'sauipe' },
        ],
    },
    sibarita: {
        name: 'Sibarita',
        tagline: 'A viagem é um spa contínuo — e você merece.',
        description: 'Quer suíte com vista, jantar premiado, hora de spa, transfer privativo. Não é luxo gratuito — é tempo bem cuidado. A Anhangá tem a hotelaria que a gente já dormiu, e sabe o quarto certo pra pedir.',
        color: 'emerald',
        icon: '◆',
        destinations: [
            { name: 'Provence', region: 'França',        tag: 'Château + lavanda', imageKey: 'provence' },
            { name: 'Mendoza',  region: 'Argentina',     tag: 'Vinho + vinhedo',   imageKey: 'mendoza' },
            { name: 'Maldivas', region: 'Oceano Índico', tag: 'Bangalô + spa',     imageKey: 'maldivas' },
        ],
    },
};

type QuizAnswers = Record<string, string[]>;

function matchProfile(answers: QuizAnswers): ProfileKey {
    const perfil = answers.perfil?.[0];
    const ritmo  = answers.ritmo?.[0];
    const comp   = answers.companhia?.[0];

    if (perfil === 'familia' || comp === 'familia') return 'familia';
    if (perfil === 'luxo')    return 'sibarita';
    if (perfil === 'aventura' && ritmo !== 'contemplativo') return 'aventureiro';
    if (perfil === 'praia')   return 'praiano';
    if (perfil === 'cultural') return 'cultural';
    if (ritmo === 'contemplativo') return 'contemplativo';
    if (perfil === 'micro')   return 'cultural';
    return 'aventureiro';
}

function buildAnswersSummary(answers: QuizAnswers): string {
    const labels: Record<string, Record<string, string>> = {
        destino:   { 'europa': 'Europa', 'america-n': 'América do Norte', 'cruzeiros': 'Cruzeiros', 'asia': 'Ásia', 'latam': 'América Latina', 'brasil': 'Brasil', 'caribe': 'Caribe' },
        perfil:    { aventura: 'Aventura', familia: 'Família', luxo: 'Luxo', micro: 'Microescapadas', praia: 'Praia', cultural: 'Cultural' },
        companhia: { sozinho: 'Solo', casal: 'Casal', familia: 'Família', amigos: 'Amigos' },
        ritmo:     { corrido: 'Corrido', equilibrado: 'Equilibrado', contemplativo: 'Contemplativo' },
        quando:    { logo: 'Até 3 meses', semestre: '3-6 meses', ano: 'Esse ano', sonhando: 'Sonhando' },
    };
    return Object.entries(answers)
        .filter(([, sel]) => sel?.length)
        .map(([qId, sel]) => {
            const map = labels[qId];
            if (!map) return null;
            return sel.map((id) => map[id] ?? id).join(', ');
        })
        .filter(Boolean)
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
                        key={idx}
                        className="quiz-ch-layer"
                        aria-hidden="true"
                        style={{
                            transform: `translate(${(layerColors.length - idx) * 6}px, ${(layerColors.length - idx) * 6}px)`,
                            color: c,
                            zIndex: idx,
                        }}
                    >
                        {letters.map((l, i) => <span key={i} className="quiz-ch-letter">{l}</span>)}
                    </div>
                ))}
                <div className="quiz-ch-front" style={{ zIndex: 99 }}>
                    {letters.map((l, i) => <span key={i} className="quiz-ch-letter">{l}</span>)}
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
                    5 perguntinhas rápidas. No final, a gente revela seu{' '}
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
    5: 'Última!',
};

function Progress({ current, total }: { current: number; total: number }) {
    const pct = (current / total) * 100;
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
                <div className="quiz-progress-fill" style={{ width: `${pct}%` }} />
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

                <div className={`quiz-opt-grid quiz-opt-grid--pills quiz-opt-grid--${isTight ? 'tight' : 'roomy'}`}>
                    {q.options.map((opt, i) => (
                        <button
                            key={opt.id}
                            className={[
                                'quiz-opt quiz-opt--pills',
                                isSelected(opt.id) ? 'is-selected' : '',
                                pendingId === opt.id ? 'is-confirming' : '',
                            ].join(' ').trim()}
                            onClick={() => !pendingId && toggle(opt.id)}
                            disabled={!q.multi && pendingId !== null && pendingId !== opt.id}
                            style={{ ['--opt-i' as string]: i }}
                        >
                            <span className="quiz-opt-label">{opt.label}</span>
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
    onSubmit: (form: LeadForm) => void;
    onBack: () => void;
    isSubmitting: boolean;
}

function PreLeadScreen({ onSubmit, onBack, isSubmitting }: PreLeadScreenProps) {
    const [form, setForm] = useState<LeadForm>({ nome: '', email: '', aceite: false });
    const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>({});

    function update<K extends keyof LeadForm>(k: K, v: LeadForm[K]) {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: undefined }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const errs: typeof errors = {};
        if (!form.nome.trim()) errs.nome = 'Conta pra gente seu nome';
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
                <span className="quiz-stamp-lead">QUASE LÁ</span>
                <h2 className="quiz-lead-title">A quem entregamos seu perfil?</h2>
                <p className="quiz-lead-sub">
                    Só falta um detalhe. Coloca seu nome e e-mail e a gente mostra tudo.
                    Sem spam, palavra de viajante.
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
                            disabled={isSubmitting}
                            autoComplete="given-name"
                        />
                        {errors.nome && <span className="quiz-err">{errors.nome}</span>}
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
                            disabled={isSubmitting}
                            autoComplete="email"
                        />
                        {errors.email && <span className="quiz-err">{errors.email}</span>}
                    </div>

                    <label className="quiz-check">
                        <input
                            type="checkbox"
                            checked={form.aceite}
                            onChange={(e) => update('aceite', e.target.checked)}
                            disabled={isSubmitting}
                        />
                        <span className="quiz-check-box" aria-hidden="true" />
                        <span className="quiz-check-label">
                            Topo receber novidades e ofertas da Anhangá. Posso cancelar quando quiser.
                            Veja nossa <a href="/politica-privacidade">política de privacidade</a>.
                        </span>
                    </label>
                    {errors.aceite && <span className="quiz-err quiz-err-block">É só marcar a caixinha acima para continuar.</span>}

                    <button type="submit" className="quiz-btn quiz-btn-primary quiz-btn-lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Calculando seu perfil…' : 'Ver meu perfil'}
                        {!isSubmitting && <span className="quiz-arrow">→</span>}
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

const QUIZ_IMG_BASE = 'https://media.anhanga.tur.br';

function getPolaroidImage(imageKey: string): string {
    return `${QUIZ_IMG_BASE}/${imageKey}.webp`;
}

function Polaroid({ dest, index }: { dest: TravelerDestination; index: number }) {
    const tilts = [-2.4, 1.6, -1.2, 2, -1.8];
    const tilt = tilts[index % tilts.length];
    const imgSrc = getPolaroidImage(dest.imageKey);

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
   Componente: WhatsAppUpgrade — passo 2: WhatsApp opcional no resultado
   ========================================================================== */

interface WhatsAppUpgradeProps {
    profileName: string;
    firstName: string;
    baseWaUrl: string;
}

function WhatsAppUpgrade({ profileName, firstName, baseWaUrl }: WhatsAppUpgradeProps) {
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
            `Oi! Sou ${firstName} e meu perfil é ${profileName}. Bora montar minha viagem?`,
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
                    className="quiz-btn quiz-btn-primary quiz-btn-lg"
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
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
                className="quiz-wa-skip"
                href={baseWaUrl}
                target="_blank"
                rel="noopener noreferrer"
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
    lead: LeadForm;
    onRestart: () => void;
    baseWaUrl: string;
    submitFailed: boolean;
}

function ResultScreen({ profile, lead, onRestart, baseWaUrl, submitFailed }: ResultScreenProps) {
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

                {/* Bloco 3 — destinos */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '680ms' }}>
                    <div className="quiz-result-eyebrow quiz-result-eyebrow--mid">
                        <span className="quiz-pill-soft">DESTINOS QUE COMBINAM</span>
                    </div>
                    <div className="quiz-dest-grid">
                        {profile.destinations.map((d, i) => (
                            <Polaroid key={d.name} dest={d} index={i} />
                        ))}
                    </div>
                </div>

                {/* Bloco 4 — upgrade WhatsApp + CTA */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '900ms' }}>
                    <WhatsAppUpgrade
                        profileName={profile.name}
                        firstName={firstName}
                        baseWaUrl={baseWaUrl}
                    />
                    <button className="quiz-btn quiz-btn-ghost quiz-result-restart" onClick={onRestart}>
                        Refazer o quiz
                    </button>
                </div>

                {/* Bloco 5 — fineprint + erro de API */}
                <div className="quiz-reveal-block" style={{ ['--reveal-delay' as string]: '1000ms' }}>
                    {submitFailed ? (
                        <p className="quiz-result-fineprint quiz-result-fineprint--warn">
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
   Componente principal
   ========================================================================== */

export default function QuizAnhangaLanding() {
    const [stage, setStage] = useState<Stage>({ kind: 'hero' });
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const [answers, setAnswers] = useState<QuizAnswers>({});
    const [leadForm, setLeadForm] = useState<LeadForm | null>(null);
    const [profileKey, setProfileKey] = useState<ProfileKey | null>(null);
    const [baseWaUrl, setBaseWaUrl] = useState('');
    const [submitFailed, setSubmitFailed] = useState(false);
    const { submitQuiz, isSubmitting } = useQuizCapture();

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
            go({ kind: 'lead' });
        } else {
            go({ kind: 'question', index: currentIndex + 1 });
        }
    }

    function backQ(currentIndex: number) {
        if (currentIndex === 0) go({ kind: 'hero' }, 'back');
        else go({ kind: 'question', index: currentIndex - 1 }, 'back');
    }

    async function handleLeadSubmit(form: LeadForm) {
        const pKey = matchProfile(answers);
        const profile = TRAVELER_PROFILES[pKey];

        const names = form.nome.trim().split(/\s+/);
        const firstName = names[0] || form.nome.trim();
        const bantSummary = `Quiz Anhangá · Perfil: ${profile.name} · ${buildAnswersSummary(answers)}`;

        const waMsg = `Oi! Sou ${form.nome} e descobri no Quiz da Anhangá que sou um(a) ${profile.name}. Bora montar minha viagem?`;
        const waUrl = getWhatsAppLink(waMsg, { appendTrackingRef: true });

        // Avança para o resultado imediatamente — API roda em paralelo
        setLeadForm(form);
        setProfileKey(pKey);
        setBaseWaUrl(waUrl);
        setSubmitFailed(false);
        go({ kind: 'result' });

        const result = await submitQuiz({
            firstName,
            email: form.email,
            profileKey: pKey,
            profileName: profile.name,
            bantSummary,
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

    function renderStage() {
        if (stage.kind === 'hero') return <HeroScreen onStart={start} />;
        if (stage.kind === 'question') {
            const q = QUIZ_QUESTIONS[stage.index];
            return (
                <QuestionScreen
                    q={q}
                    qIndex={stage.index}
                    total={QUIZ_QUESTIONS.length}
                    value={answers[q.id]}
                    onChange={(v) => answerQ(q.id, v)}
                    onNext={() => nextQ(stage.index)}
                    onBack={() => backQ(stage.index)}
                />
            );
        }
        if (stage.kind === 'lead') {
            return (
                <PreLeadScreen
                    onSubmit={handleLeadSubmit}
                    onBack={() => go({ kind: 'question', index: QUIZ_QUESTIONS.length - 1 }, 'back')}
                    isSubmitting={isSubmitting}
                />
            );
        }
        if (stage.kind === 'result' && profileKey && leadForm) {
            return (
                <ResultScreen
                    profile={TRAVELER_PROFILES[profileKey]}
                    lead={leadForm}
                    onRestart={restart}
                    baseWaUrl={baseWaUrl}
                    submitFailed={submitFailed}
                />
            );
        }
        return null;
    }

    return (
        <>
            <SEO
                title="Quiz de Destinos | Descubra seu próximo rolê — Anhangá Viagens"
                description="5 perguntas rápidas para descobrir seu perfil de viajante e os destinos que mais combinam com você. Gratuito e sem compromisso."
                canonical="https://www.anhanga.tur.br/quiz/"
                noHreflang
            />
            <div className="quiz-page">
                <div className="quiz-app">
                    <div className={`quiz-stage quiz-stage--slide quiz-stage--${direction}`}>
                        <div className="quiz-stage-inner" key={stageKey}>
                            {renderStage()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
