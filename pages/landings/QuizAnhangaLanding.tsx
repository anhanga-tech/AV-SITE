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
        title: 'Você acabou de pousar. Onde chegou?',
        subtitle: 'Pode escolher mais de um.',
        multi: true,
        options: [
            { id: 'europa',         label: 'Europa',           hint: 'Cidades, vinho, história',      emoji: 'EU' },
            { id: 'america-norte',  label: 'América do Norte', hint: 'Parques, road trips, NY',       emoji: 'NA' },
            { id: 'latam',          label: 'América Latina',   hint: 'Cultura viva, vizinho querido', emoji: 'LA' },
            { id: 'caribe',         label: 'Caribe',           hint: 'Águas turquesa, ilha em ilha',  emoji: 'CA' },
            { id: 'asia',           label: 'Ásia',             hint: 'Templos, mercado, sushi',       emoji: 'AS' },
            { id: 'africa-oriente', label: 'África & Oriente', hint: 'Deserto, safari, culturas',     emoji: 'AF' },
            { id: 'surpresa',       label: 'Me surpreenda!',   hint: 'Pode ser qualquer coisa',       emoji: '?' },
        ],
    },
    {
        id: 'cena',
        eyebrow: 'Pergunta 02',
        title: 'Qual cena de viagem mais combina com você?',
        subtitle: 'Escolha a que mais te representa.',
        multi: false,
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

type ProfileKey = 'escapista' | 'bon-vivant' | 'viajante-de-verdade' | 'desbravador' | 'nomade-de-alma';

// imageKey maps to: https://media.anhanga.tur.br/{imageKey}.webp
const TRAVELER_PROFILES: Record<ProfileKey, TravelerProfile> = {
    'escapista': {
        name: 'Escapista',
        tagline: 'Você quer sair da rotina — sem sair da zona de conforto.',
        description: 'Praia, resort, tudo incluído e nem uma preocupação para gerenciar. Sua viagem ideal é aquela em que você desembarca e só precisa decidir se quer sol ou sombra. A Anhangá conhece os destinos certos para quem quer descansar de verdade.',
        color: 'sky',
        icon: '☀',
        destinations: [
            { name: 'Maragogi',        region: 'Alagoas · Brasil',  tag: 'Piscinas naturais',     imageKey: 'maragogi' },
            { name: 'Riviera Maya',    region: 'México',            tag: 'Resort + praia',        imageKey: 'riviera-maya' },
            { name: 'Costa do Sauípe', region: 'Bahia · Brasil',    tag: 'All-inclusive + praia', imageKey: 'sauipe' },
        ],
    },
    'bon-vivant': {
        name: 'Bon Vivant',
        tagline: 'Você viaja pra curtir a boa vida — com estilo.',
        description: 'Hotel com vista, jantar em restaurante premiado, um roteiro que combina o melhor da gastronomia, cultura e conforto. Você não abre mão de qualidade, mas também curte explorar. A Anhangá monta o itinerário perfeito para quem sabe viver bem.',
        color: 'yellow',
        icon: '◆',
        destinations: [
            { name: 'Buenos Aires', region: 'Argentina',   tag: 'Gastronomia + cultura', imageKey: 'buenos-aires' },
            { name: 'Lisboa',       region: 'Portugal',    tag: 'Bairro + fado',         imageKey: 'lisboa' },
            { name: 'Gramado',      region: 'RS · Brasil', tag: 'Charme + gastronomia',  imageKey: 'gramado' },
        ],
    },
    'viajante-de-verdade': {
        name: 'Viajante de Verdade',
        tagline: 'Você equilibra conforto e descoberta com maestria.',
        description: 'Nem tudo planejado, nem totalmente improvisado. Você curte um bom hotel, mas também embica pela rua sem destino e acha o melhor restaurante da cidade assim. A Anhangá adora montar roteiros para quem quer o melhor dos dois mundos.',
        color: 'emerald',
        icon: '✦',
        destinations: [
            { name: 'Cartagena', region: 'Colômbia',        tag: 'Histórico + praias',   imageKey: 'cartagena' },
            { name: 'Chapada',   region: 'Bahia · Brasil',  tag: 'Cachoeiras + trilhas', imageKey: 'chapada' },
            { name: 'Santiago',  region: 'Chile',           tag: 'Cidade + vinhedo',     imageKey: 'santiago' },
        ],
    },
    'desbravador': {
        name: 'Desbravador',
        tagline: 'Você vai além do roteiro e volta com história pra contar.',
        description: 'Trilhas, cidades pouco visitadas, contato com a cultura local de verdade. Você não tem medo de sair do mapa — e é aí que estão as melhores memórias. A Anhangá tem especialistas que conhecem os destinos que você ainda não descobriu.',
        color: 'orange',
        icon: '⛰',
        destinations: [
            { name: 'Patagônia',           region: 'Argentina · Chile', tag: 'Trilha + glaciar',  imageKey: 'patagonia' },
            { name: 'Lençóis Maranhenses', region: 'MA · Brasil',       tag: 'Dunas + lagoas',    imageKey: 'lencois' },
            { name: 'Peru & Machu Picchu', region: 'Peru',              tag: 'Ruínas + aventura', imageKey: 'machu-picchu' },
        ],
    },
    'nomade-de-alma': {
        name: 'Nômade de Alma',
        tagline: 'O mundo é o seu quintal — e você ainda não viu tudo.',
        description: 'Você quer o que poucos ousam: destinos diferentes, experiências únicas, total liberdade. O roteiro é um ponto de partida, não um manual. A Anhangá tem consultores que já viajaram para os lugares mais improváveis — e sabem como te mandar pra lá.',
        color: 'blue',
        icon: '◐',
        destinations: [
            { name: 'Japão',    region: 'Ásia',            tag: 'Templo + trem-bala',  imageKey: 'quioto' },
            { name: 'Marrocos', region: 'África do Norte', tag: 'Deserto + medina',    imageKey: 'marrocos' },
            { name: 'Pantanal', region: 'MT/MS · Brasil',  tag: 'Onças + natureza',    imageKey: 'pantanal' },
        ],
    },
};

type QuizAnswers = Record<string, string[]>;

// Score table: Plog psicocentricity model — P1+P2+P3+P4+P6 (P5/quando is BANT, excluded)
// Keys here must match question IDs in QUIZ_QUESTIONS; missing IDs fall back to NEUTRAL_SCORE.
const SCORES: Record<string, Record<string, number>> = {
    destino: {
        'europa': 3, 'america-norte': 3, 'latam': 4,
        'caribe': 1, 'asia': 5, 'africa-oriente': 5, 'surpresa': 3,
    },
    cena: {
        'aventura': 5, 'familia': 2, 'luxo': 2,
        'microescapada': 3, 'natureza': 4, 'wellness': 1,
    },
    companhia: { 'solo': 5, 'familia': 1, 'parceiro': 3, 'variado': 3 },
    frustracao: {
        'sem-liberdade': 5, 'multidao': 4, 'hotel-ruim': 2,
        'genericas': 3, 'caro-demais': 2,
    },
    ritmo: { 'planejado': 1, 'semi-planejado': 3, 'quase-livre': 4, 'livre': 5 },
};

const NEUTRAL_SCORE = 3;

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

function scoreField(fieldScores: Record<string, number>, selected: string[]): number {
    if (!selected.length) return 0;
    const total = selected.reduce((sum, id) => sum + (fieldScores[id] ?? NEUTRAL_SCORE), 0);
    return Math.round(total / selected.length);
}

function matchProfile(answers: QuizAnswers): ProfileKey {
    const score = Object.keys(SCORES).reduce(
        (sum, field) => sum + scoreField(SCORES[field], answers[field] ?? []),
        0,
    );

    if (score <= 9)  return 'escapista';
    if (score <= 13) return 'bon-vivant';
    if (score <= 17) return 'viajante-de-verdade';
    if (score <= 21) return 'desbravador';
    return 'nomade-de-alma';
}

function buildAnswersSummary(answers: QuizAnswers): string {
    return Object.entries(answers)
        .filter(([, sel]) => sel?.length)
        .map(([qId, sel]) => {
            const map = SUMMARY_LABELS[qId];
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
                description="6 perguntas rápidas para descobrir seu perfil de viajante e os destinos que mais combinam com você. Gratuito e sem compromisso."
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
