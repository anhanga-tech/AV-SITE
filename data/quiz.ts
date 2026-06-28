import type { ProfileKey } from '../lib/quiz-scoring';

/* ==========================================================================
   Perguntas do quiz
   ========================================================================== */

export interface QuizOption {
    id: string;
    label: string;
    hint?: string;
    emoji?: string;
}

export interface QuizQuestion {
    id: string;
    eyebrow: string;
    title: string;
    subtitle?: string;
    multi: boolean;
    layout?: 'cards' | 'pills';
    options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
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

/* ==========================================================================
   Perfis de viajante
   ========================================================================== */

export interface TravelerProfile {
    name: string;
    tagline: string;
    description: string;
    color: 'orange' | 'emerald' | 'blue' | 'sky' | 'yellow';
    icon: string;
}

export const TRAVELER_PROFILES: Record<ProfileKey, TravelerProfile> = {
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

/* ==========================================================================
   Respostas e resumo
   ========================================================================== */

export type QuizAnswers = Record<string, string[]>;

export interface LeadForm {
    nome: string;
    sobrenome: string;
    email: string;
    aceite: boolean;
}

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

export function buildAnswersSummary(answers: QuizAnswers): string {
    return Object.entries(answers)
        .flatMap(([qId, sel]) => {
            if (!sel?.length) return [];
            const map = SUMMARY_LABELS[qId];
            if (!map) return [];
            return [sel.map((id) => map[id] ?? id).join(', ')];
        })
        .join(' · ');
}
