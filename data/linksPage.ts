export type LinkType = 'internal' | 'external' | 'whatsapp';

export interface LinkItem {
    /** único; usado como React key e como `label` do evento GA4 */
    id: string;
    label: string;
    sublabel?: string;
    type: LinkType;
    /** obrigatório para 'internal' (path relativo) e 'external' (URL absoluta) */
    href?: string;
    /** obrigatório para 'whatsapp' */
    whatsappMessage?: string;
    /** nome de ícone Phosphor; só renderiza se estiver no ICON_MAP do LinkButton */
    icon?: string;
    /** controla exibição sem remover do arquivo */
    visible: boolean;
    /** CTA destacado (ex.: WhatsApp em amarelo) */
    highlight?: boolean;
}

export interface BannerConfig {
    visible: boolean;
    title: string;
    subtitle?: string;
    ctaLabel: string;
    /** destino interno; UTM passthrough é aplicado na navegação */
    href: string;
}

export interface LinksPageConfig {
    banner: BannerConfig;
    links: LinkItem[];
}

// ⚙️ EDITÁVEL: troque banner e links aqui sem mexer em componente.
export const linksPageConfig: LinksPageConfig = {
    banner: {
        // Desligado: o quiz já aparece como link "Planejar minha viagem" abaixo, então o banner
        // duplicava o destino /quiz e somava um segundo amarelo na 1ª dobra (a "Regra do Âmbar"
        // reserva o amarelo a 1 ação — o WhatsApp). Reative trocando para `true` se necessário.
        visible: false,
        title: 'Descubra sua próxima viagem',
        subtitle: 'Responda 6 perguntas rápidas e receba ideias de roteiro personalizadas.',
        ctaLabel: 'Fazer o quiz',
        href: '/quiz',
    },
    links: [
        { id: 'whatsapp', label: 'Falar no WhatsApp', sublabel: 'Atendimento humano e rápido', type: 'whatsapp', whatsappMessage: 'Olá! Vim pelo Instagram e gostaria de falar com a Anhangá Viagens.', icon: 'WhatsappLogo', visible: true, highlight: true },
        { id: 'quiz', label: 'Planejar minha viagem', sublabel: 'Quiz de perfil de viagem', type: 'internal', href: '/quiz', icon: 'Compass', visible: true },
        { id: 'site', label: 'Site oficial', type: 'internal', href: '/', icon: 'Globe', visible: true },
        { id: 'seguro-viagem', label: 'Seguro viagem', sublabel: 'Cotação com nosso parceiro', type: 'external', href: 'https://go.nuvembr.com/anhanga_seguroviagem', icon: 'ShieldCheck', visible: true },
        { id: 'chip-esim', label: 'Chip / eSIM internacional', sublabel: 'Tire dúvidas no WhatsApp', type: 'whatsapp', whatsappMessage: 'Olá! Vim pelo Instagram e quero informações sobre chip / eSIM internacional para minha viagem.', icon: 'SimCard', visible: true },
        { id: 'orlando', label: 'Orlando', type: 'internal', href: '/orlando', visible: true },
        { id: 'beto-carrero', label: 'Beto Carrero', type: 'internal', href: '/beto-carrero', visible: true },
        { id: 'melhor-idade', label: 'Viagens Melhor Idade', type: 'internal', href: '/melhor-idade', visible: true },
        { id: 'consultoria-de-viagem', label: 'Consultoria de Viagem', type: 'internal', href: '/consultoria-de-viagem', visible: true },
        { id: 'corporativo', label: 'Viagens Corporativas', type: 'internal', href: '/corporativo', visible: true },
        // `id` preservado apesar da URL ter mudado para /cruzeiros: ele vira data-testid e vai
        // ao dataLayer via pushLinksPageClick — renomear quebraria a série histórica de cliques.
        { id: 'curadoria-cruzeiros-brasil', label: 'Cruzeiros pelo Brasil', type: 'internal', href: '/cruzeiros', visible: true },
        { id: 'lollapalooza', label: 'Lollapalooza', type: 'internal', href: '/lollapalooza', visible: true },
    ],
};
