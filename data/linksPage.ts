export type LinkType = 'internal' | 'external' | 'whatsapp' | 'cal-modal';

export interface LinkItem {
    /** único; usado como React key e como `label` do evento GA4 */
    id: string;
    label: string;
    sublabel?: string;
    type: LinkType;
    /** obrigatório para 'internal' (path relativo) e 'external' (URL absoluta); não usado em 'cal-modal' */
    href?: string;
    /** obrigatório para 'whatsapp'; não usado em 'cal-modal' */
    whatsappMessage?: string;
    /** nome de ícone Phosphor; só renderiza se estiver no ICON_MAP do LinkButton */
    icon?: string;
    /** controla exibição sem remover do arquivo */
    visible: boolean;
    /** CTA destacado (ex.: WhatsApp em amarelo) */
    highlight?: boolean;
    /**
     * Ação de maior intenção fora do highlight (ex.: orçamento). Ganha o tier branco com
     * hard-shadow do LinkButton — reservado a poucos itens por design ("peso físico só onde
     * se age"). Não confundir com ter ícone/sublabel: a maioria dos links tem os dois e
     * continua no tier quieto (`shadow-float`, sem offset direcional).
     */
    primary?: boolean;
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
//
// Sobre `{origem}`: o marcador é trocado em runtime por `applyOriginToMessage`
// (utils/linksTracking.ts) pela origem real vinda de `utm_source` — "Vim pelo TikTok.",
// "Vim pelo Google." — com a bio do Instagram como padrão quando não há UTM. Escrever a
// origem fixa aqui fazia a mensagem afirmar algo falso para quem chega de outra bio, e a
// origem real não chegava ao atendimento nem ao CRM. Não remova o marcador: há teste que
// falha se uma mensagem voltar a fixar a origem.
//
// Sobre `whatsappMessage`: as mensagens terminam num rótulo com dois-pontos para que a pessoa
// complete o que falta ainda no campo de digitação — é o que chega ao atendimento já qualificado,
// em vez de um "oi" seco. Não termine com espaço à direita: `buildWhatsAppLink` aplica `.trim()`
// na mensagem, então o espaço não sobrevive até o WhatsApp.
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
        { id: 'whatsapp', label: 'Falar com um especialista no WhatsApp', sublabel: 'Já sei o destino e quero planejar', type: 'whatsapp', whatsappMessage: 'Olá!{origem} Quero planejar uma viagem. Meu destino:', icon: 'WhatsappLogo', visible: true, highlight: true },
        // Par com o quiz logo abaixo: o quiz atende quem ainda está explorando (ToFu — vira só
        // `res.partner`), este atende quem já decidiu. Antes era um pedido de orçamento via
        // WhatsApp (id `orcamento`); agora abre o modal de agendamento pago da consultoria de
        // viagem — mesmo mecanismo da landing /consultoria-de-viagem (lib/cal-embed.ts). Id novo
        // porque a ação mudou de natureza: misturar clique de orçamento grátis com agendamento
        // pago na mesma série de dados quebraria a leitura histórica do funil.
        { id: 'agendar-consultoria', label: 'Agendar consultoria de viagem', sublabel: 'Sessão paga de 50 min · R$ 250', type: 'cal-modal', icon: 'CalendarCheck', visible: true, primary: true },
        { id: 'quiz', label: 'Planejar minha viagem', sublabel: 'Quiz de perfil de viagem', type: 'internal', href: '/quiz', icon: 'Compass', visible: true },
        { id: 'site', label: 'Site oficial', type: 'internal', href: '/', icon: 'Globe', visible: true },
        { id: 'seguro-viagem', label: 'Calcular meu seguro viagem', sublabel: 'Cotação online com nosso parceiro', type: 'external', href: 'https://go.nuvembr.com/anhanga_seguroviagem', icon: 'ShieldCheck', visible: true },
        { id: 'chip-esim', label: 'Comprar chip / eSIM internacional', sublabel: 'Compra e atendimento pelo WhatsApp', type: 'whatsapp', whatsappMessage: 'Olá!{origem} Quero comprar um chip / eSIM internacional para minha viagem.', icon: 'SimCard', visible: true },
        { id: 'orlando', label: 'Orlando', sublabel: 'Parques, magia e roteiro sob medida', type: 'internal', href: '/orlando', icon: 'Sparkle', visible: true },
        { id: 'beto-carrero', label: 'Beto Carrero', sublabel: 'Adrenalina e diversão em família', type: 'internal', href: '/beto-carrero', icon: 'Confetti', visible: true },
        { id: 'melhor-idade', label: 'Viagens Melhor Idade', sublabel: 'Viagens pensadas para o seu ritmo', type: 'internal', href: '/melhor-idade', icon: 'SunHorizon', visible: true },
        { id: 'consultoria-de-viagem', label: 'Consultoria de Viagem', sublabel: 'Um especialista monta o roteiro por você', type: 'internal', href: '/consultoria-de-viagem', icon: 'Handshake', visible: true },
        { id: 'corporativo', label: 'Viagens Corporativas', sublabel: 'Eventos e viagens para a sua empresa', type: 'internal', href: '/corporativo', icon: 'Briefcase', visible: true },
        // `id` preservado apesar da URL ter mudado para /cruzeiros: ele vira data-testid e vai
        // ao dataLayer via pushLinksPageClick — renomear quebraria a série histórica de cliques.
        { id: 'curadoria-cruzeiros-brasil', label: 'Cruzeiros pelo Brasil', sublabel: 'Navegue pelo litoral com curadoria', type: 'internal', href: '/cruzeiros', icon: 'Anchor', visible: true },
        // Sublabel reflete o estado real da campanha (2026 esgotado, ver
        // pages/landings/LollapaloozaLanding.tsx) — não prometer pacote disponível.
        { id: 'lollapalooza', label: 'Lollapalooza', sublabel: 'Lista de espera para a edição 2027', type: 'internal', href: '/lollapalooza', icon: 'MusicNotes', visible: true },
    ],
};
