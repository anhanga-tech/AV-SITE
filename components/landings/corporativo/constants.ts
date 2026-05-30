import { UsersThree, Sparkle, ClipboardText } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export const WHATSAPP_MESSAGE =
    'Oi! Vi que vocês fazem viagens corporativas. Quero entender como funciona pra minha empresa.';

export const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/anhangaviagens',
    facebook: 'https://facebook.com/profile.php?id=61585422494271',
};

export interface Pillar {
    icon: Icon;
    title: string;
    description: string;
    bg: string;
    accent: string;
    iconColor: string;
    rotate: string;
}

export const PILLARS: Pillar[] = [
    {
        icon: UsersThree,
        title: 'Consultor só seu',
        description: 'Uma pessoa que conhece sua empresa e resolve tudo: passagem, hotel, transfer, seguro. Você liga, ela resolve.',
        bg: 'bg-blue-100',
        accent: 'border-blue-200',
        iconColor: 'text-blue-600',
        rotate: '-rotate-1',
    },
    {
        icon: Sparkle,
        title: 'Roteiro feito pra sua equipe',
        description: 'Premiação dos top vendedores, retiro de fim de ano ou reunião fora do escritório. Cada viagem tem um motivo. A gente monta em cima dele.',
        bg: 'bg-emerald-100',
        accent: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        rotate: 'rotate-2',
    },
    {
        icon: ClipboardText,
        title: 'Sem burocracia',
        description: 'Faturamento direto no CNPJ e condições pra grupo. Você cuida da empresa, a gente cuida da viagem.',
        bg: 'bg-orange-100',
        accent: 'border-orange-200',
        iconColor: 'text-orange-600',
        rotate: '-rotate-2',
    },
];

export const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' as const },
    }),
};
