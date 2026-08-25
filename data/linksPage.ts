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
        // `res.partner`), este atende quem já decidiu. Por isso a mensagem é estruturada aqui e
        // conversacional no botão amarelo: quem clica aqui se declarou pronto a passar os dados.
        { id: 'orcamento', label: 'Quero um orçamento', sublabel: 'Já tenho destino e datas', type: 'whatsapp', whatsappMessage: 'Olá!{origem} Quero um orçamento.\n\nDestino:\nDatas:\nPessoas:', icon: 'CalendarCheck', visible: true },
        { id: 'quiz', label: 'Planejar minha viagem', sublabel: 'Quiz de perfil de viagem', type: 'internal', href: '/quiz', icon: 'Compass', visible: true },
        { id: 'site', label: 'Site oficial', type: 'internal', href: '/', icon: 'Globe', visible: true },
        { id: 'seguro-viagem', label: 'Calcular meu seguro viagem', sublabel: 'Cotação online com nosso parceiro', type: 'external', href: 'https://go.nuvembr.com/anhanga_seguroviagem', icon: 'ShieldCheck', visible: true },
        { id: 'chip-esim', label: 'Comprar chip / eSIM internacional', sublabel: 'Compra e atendimento pelo WhatsApp', type: 'whatsapp', whatsappMessage: 'Olá!{origem} Quero comprar um chip / eSIM internacional para minha viagem.', icon: 'SimCard', visible: true },
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
