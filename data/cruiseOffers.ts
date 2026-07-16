// Ofertas de cruzeiro exibidas na landing /cruzeiros.
//
// Curadoria sobre catálogo (PRODUCT.md): poucas ofertas escolhidas a dedo, com
// uma nota autoral por que ELA foi selecionada — não uma grade de tudo que os
// fornecedores oferecem. Mantenha entre ~4 e 8; acima disso a página comunica
// commodity, não curadoria.
//
// Expiração: `expiraEm` (YYYY-MM-DD, fuso de São Paulo) é o último dia em que a
// oferta aparece. O rebuild diário do Cloudflare Pages remove as vencidas sem
// PR — ver lib/cruise-offers-schedule.js. Não precisa ser a data de saída:
// normalmente pare de anunciar alguns dias antes de o navio zarpar.
//
// Imagens: `imagem` é um path relativo servido pelo R2 (media.anhanga.tur.br),
// otimizado em runtime pelo LazyImage. As imagens abaixo são PLACEHOLDERS de
// destino (reaproveitadas do blog) para o layout já renderizar — troque pelas
// fotos reais do navio/roteiro que o fornecedor licenciar, subindo-as em
// images/cruzeiros/ no R2 e atualizando o path aqui.

export interface CruiseOffer {
  /** Slug estável — vira React key, data-tracking e não muda ao editar o mix. */
  id: string;
  companhia: string;
  navio: string;
  /** Porto de embarque. Brasil (Santos, Rio) ou internacional (Barcelona…). */
  portoEmbarque: string;
  /** Escalas na ordem do roteiro, embarque incluso. */
  roteiro: string[];
  /** Rótulo de saída legível ("Fevereiro 2027", "Temporada 2026/27"). */
  saida: string;
  noites: number;
  /** Path relativo no R2 (sem host); otimizado pelo LazyImage. */
  imagem: string;
  imagemAlt: string;
  /** 1–2 linhas autorais: por que ESTA oferta foi escolhida. O diferencial. */
  notaCuratorial: string;
  /** Perfis a que a oferta atende — vira badge no card. */
  perfis: string[];
  /** Região, usada para um selo discreto ("Brasil" vs destino internacional). */
  regiao: string;
  /** No máximo uma oferta em destaque por vez (ver layout da landing). */
  featured?: boolean;
  /** Último dia visível (YYYY-MM-DD, São Paulo). */
  expiraEm: string;
}

export const CRUISE_OFFERS: readonly CruiseOffer[] = [
  {
    id: 'msc-seaside-costa-brasileira-fev-2027',
    companhia: 'MSC Cruzeiros',
    navio: 'MSC Seaside',
    portoEmbarque: 'Santos',
    roteiro: ['Santos', 'Búzios', 'Ilhéus', 'Santos'],
    saida: 'Fevereiro 2027',
    noites: 7,
    imagem: 'images/blog/blog-viagem-solo-feminina.png',
    imagemAlt: 'Navio de cruzeiro navegando ao pôr do sol na costa brasileira',
    notaCuratorial:
      'Escolhemos este porque o Seaside tem a melhor estrutura de bordo da temporada em Santos — e Ilhéus em fevereiro é a parada mais bonita da costa.',
    perfis: ['Primeira vez', 'Casal', 'Família'],
    regiao: 'Brasil',
    featured: true,
    expiraEm: '2027-01-25',
  },
  {
    id: 'costa-diadema-ilha-grande-jan-2027',
    companhia: 'Costa Cruzeiros',
    navio: 'Costa Diadema',
    portoEmbarque: 'Santos',
    roteiro: ['Santos', 'Ilha Grande', 'Porto Belo', 'Santos'],
    saida: 'Janeiro 2027',
    noites: 5,
    imagem: 'images/blog/cancun-punta-cana-aruba-lua-de-mel.jpg',
    imagemAlt: 'Praia de águas claras vista de um cruzeiro',
    notaCuratorial:
      'Roteiro curto e sem voo: ideal para quem quer experimentar um cruzeiro pela primeira vez sem tirar a semana inteira de folga.',
    perfis: ['Primeira vez', 'Casal'],
    regiao: 'Brasil',
    expiraEm: '2026-12-28',
  },
  {
    id: 'msc-grandiosa-mediterraneo-mai-2027',
    companhia: 'MSC Cruzeiros',
    navio: 'MSC Grandiosa',
    portoEmbarque: 'Barcelona',
    roteiro: ['Barcelona', 'Marselha', 'Gênova', 'Nápoles', 'Barcelona'],
    saida: 'Maio 2027',
    noites: 7,
    imagem: 'images/destinations/lisboa.jpg',
    imagemAlt: 'Cidade mediterrânea à beira-mar ao entardecer',
    notaCuratorial:
      'O Mediterrâneo em maio pega o clima antes da alta temporada europeia — menos multidão nas escalas e preço melhor que julho.',
    perfis: ['Casal', 'Quem já foi'],
    regiao: 'Mediterrâneo',
    expiraEm: '2027-04-10',
  },
  {
    id: 'royal-caribbean-caribe-abr-2027',
    companhia: 'Royal Caribbean',
    navio: 'Wonder of the Seas',
    portoEmbarque: 'Miami',
    roteiro: ['Miami', 'Nassau', 'Ilha CocoCay', 'Miami'],
    saida: 'Abril 2027',
    noites: 7,
    imagem: 'images/destinations/cartagena.jpg',
    imagemAlt: 'Litoral caribenho de águas turquesa',
    notaCuratorial:
      'Um dos maiores navios do mundo, com estrutura de parque temático a bordo — a aposta certa para família com adolescente que se entedia fácil.',
    perfis: ['Família', 'Quem já foi'],
    regiao: 'Caribe',
    expiraEm: '2027-03-15',
  },
  {
    id: 'norwegian-nordeste-mar-2027',
    companhia: 'Norwegian Cruise Line',
    navio: 'Norwegian Getaway',
    portoEmbarque: 'Santos',
    roteiro: ['Santos', 'Salvador', 'Maceió', 'Santos'],
    saida: 'Março 2027',
    noites: 8,
    imagem: 'images/blog/caribe-destinos-para-brasileiros.jpg',
    imagemAlt: 'Vista do mar a partir do deck de um navio de cruzeiro',
    notaCuratorial:
      'A Norwegian é a mais flexível em horários de jantar — combina com quem viaja em grupo e não quer se prender a mesa marcada.',
    perfis: ['Grupos', 'Casal'],
    regiao: 'Brasil',
    expiraEm: '2027-02-20',
  },
];
