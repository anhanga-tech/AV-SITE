import { UsersThree, Sparkle, ClipboardText } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export const WHATSAPP_MESSAGE =
    'Olá! Conheci a Anhangá Viagens na Brazil Promotion Day e gostaria de saber mais sobre roteiros personalizados. ✈️🌎';

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
        title: 'Concierge Humano',
        description: 'Esqueça os robôs. Fale com gente que entende de gente.',
        bg: 'bg-blue-100',
        accent: 'border-blue-200',
        iconColor: 'text-blue-600',
        rotate: '-rotate-1',
    },
    {
        icon: Sparkle,
        title: 'Roteiros à Mão',
        description: 'Cada dia de viagem desenhado do zero, só para você. Sem pacote genérico, sem destino padrão.',
        bg: 'bg-emerald-100',
        accent: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        rotate: 'rotate-2',
    },
    {
        icon: ClipboardText,
        title: 'Zero Burocracia',
        description: 'Vistos, transfers, seguro viagem e chatices? Cuida com a gente.',
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
