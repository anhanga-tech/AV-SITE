import { UsersThree, Sparkle, ClipboardText } from '@phosphor-icons/react';
import type { PillarItem } from '../shared/LandingPillars';

export { SOCIAL_LINKS, fadeUp } from '../shared/constants';

export const WHATSAPP_MESSAGE =
    'Oi! Vi que vocês fazem viagens corporativas. Quero entender como funciona pra minha empresa.';

export const PILLARS: PillarItem[] = [
    {
        icon: UsersThree,
        title: 'Consultor só seu',
        description: 'Uma pessoa que conhece sua empresa e resolve tudo: passagem, hotel, transfer, seguro. Você liga, ela resolve.',
        bg: 'bg-blue-100',
        accent: 'border-blue-200',
        iconColor: 'text-blue-600',
        rotateDeg: -1,
    },
    {
        icon: Sparkle,
        title: 'Roteiro feito pra sua equipe',
        description: 'Premiação dos top vendedores, retiro de fim de ano ou reunião fora do escritório. Cada viagem tem um motivo. A gente monta em cima dele.',
        bg: 'bg-emerald-100',
        accent: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        rotateDeg: 2,
    },
    {
        icon: ClipboardText,
        title: 'Sem burocracia',
        description: 'Faturamento direto no CNPJ e condições pra grupo. Você cuida da empresa, a gente cuida da viagem.',
        bg: 'bg-orange-100',
        accent: 'border-orange-200',
        iconColor: 'text-orange-600',
        rotateDeg: -2,
    },
];
