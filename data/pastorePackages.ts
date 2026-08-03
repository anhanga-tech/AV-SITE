// Pacotes em grupo da Pastore Turismo exibidos em /melhor-idade/pacotes-pastore.
//
// A Anhangá é parceira revendedora da Pastore (ver docs/seo/melhor-idade-content-cluster.md).
// Curadoria sobre catálogo (PRODUCT.md), mesmo critério de data/cruiseOffers.ts:
// poucas saídas escolhidas a dedo, com uma nota autoral, não a grade completa
// que a Pastore vende. Mantenha entre ~4 e 8.
//
// Fonte dos dados: catálogo 2026/2027 em
// https://viagens.pastoreturismo.com.br/programacao-pastore-operadora
// (checado em 03/08/2026). Só entram pacotes com vagas abertas no momento da
// checagem ("Vagas disponíveis" ou "Lançamento") — nunca "Grupo completo".
// O status em si NÃO é renderizado na página: ele muda de um rebuild para o
// outro e a Anhangá não tem como garantir disponibilidade em tempo real, só
// confirmar na conversa. Por isso o CTA dos cards nunca promete vaga.
//
// Expiração: `expiraEm` (YYYY-MM-DD, fuso de São Paulo) é o último dia em que o
// pacote aparece — normalmente ~2 semanas antes da saída, para dar tempo de
// reserva. O rebuild diário do Cloudflare Pages remove os vencidos sem PR — ver
// lib/cruise-offers-schedule.js (reaproveitado aqui: a lógica de expiração é
// genérica, não específica de cruzeiro).
//
// Revisão periódica necessária: o catálogo da Pastore roda por temporada — os
// pacotes abaixo vencem com o tempo (o mais próximo em 2026-09-20). Reconferir
// a URL acima e repor a lista com a mesma cadência de data/cruiseOffers.ts,
// antes que a página fique vazia.
//
// Imagens: `imagem` é um path relativo servido pelo R2 (media.anhanga.tur.br).
// São PLACEHOLDERS reaproveitados do blog (mesmo padrão de data/cruiseOffers.ts)
// até a Pastore licenciar fotos reais de cada roteiro — troque o path e o alt
// quando isso acontecer. Escolhidos com cuidado para NÃO contradizer a legenda
// (nada de foto do México ilustrando Chile/Argentina, ou Carnaval ilustrando
// Réveillon): se não houver placeholder honesto para um pacote, deixe-o fora
// da lista em vez de forçar uma imagem enganosa.

export interface PastorePackage {
  /** Slug estável — vira React key, data-tracking e não muda ao editar o mix. */
  id: string;
  /** Nome do pacote como aparece no catálogo da Pastore. */
  destino: string;
  categoria: 'Nacional' | 'Internacional';
  /** Rótulo de período legível ("Outubro 2026", "Dezembro 2026 – Janeiro 2027"). */
  periodo: string;
  noites: number;
  /** Path relativo no R2 (sem host); otimizado pelo LazyImage. */
  imagem: string;
  imagemAlt: string;
  /** 1–2 linhas autorais: por que ESTE pacote foi destacado. */
  notaCuratorial: string;
  /** Tags curtas — vira badge no card. */
  perfis: string[];
  /** No máximo um pacote em destaque por vez (ver layout da página). */
  featured?: boolean;
  /** Último dia visível (YYYY-MM-DD, São Paulo). */
  expiraEm: string;
}

export const PASTORE_PACKAGES: readonly PastorePackage[] = [
  {
    id: 'grand-tour-italia-out-2026',
    destino: 'Grand Tour Itália',
    categoria: 'Internacional',
    periodo: 'Outubro 2026',
    noites: 13,
    imagem: 'images/blog/europa-gastronomica-italia.jpg',
    imagemAlt: 'Rua histórica de cidade italiana ao entardecer',
    notaCuratorial:
      'Um dos roteiros mais aguardados do catálogo da Pastore — clássico europeu com hospedagem, deslocamento e guia em português resolvidos do início ao fim.',
    perfis: ['Clássico europeu', 'Casal ou sozinho'],
    featured: true,
    expiraEm: '2026-09-20',
  },
  {
    id: 'croacia-eslovenia-montenegro-out-2026',
    destino: 'Croácia, Eslovênia e Montenegro',
    categoria: 'Internacional',
    periodo: 'Outubro/Novembro 2026',
    noites: 15,
    imagem: 'images/destinations/lisboa.jpg',
    imagemAlt: 'Cidade europeia à beira-mar com telhados históricos',
    notaCuratorial:
      'Três países bálcãs em um único roteiro fechado — a Pastore resolve a logística de cruzar fronteiras, que costuma ser o maior obstáculo de quem tenta montar essa viagem sozinho.',
    perfis: ['Múltiplos países', 'Quem já viajou em grupo'],
    expiraEm: '2026-10-04',
  },
  {
    id: 'natal-joao-pessoa-fev-2027',
    destino: 'Natal e João Pessoa',
    categoria: 'Nacional',
    periodo: 'Fevereiro 2027',
    noites: 6,
    imagem: 'images/blog/caribe-destinos-para-brasileiros.jpg',
    imagemAlt: 'Praia de águas claras com coqueiros',
    notaCuratorial:
      'Praia no Nordeste brasileiro, sem voo internacional nem troca de conexão — roteiro mais curto, bom para testar viagem em grupo pela primeira vez.',
    perfis: ['Primeira vez em grupo', 'Sem voo internacional'],
    expiraEm: '2027-02-07',
  },
  {
    id: 'cartagena-san-andres-jan-2027',
    destino: 'Cartagena e San Andrés',
    categoria: 'Internacional',
    periodo: 'Janeiro 2027',
    noites: 7,
    imagem: 'images/destinations/cartagena.jpg',
    imagemAlt: 'Cidade histórica colonial à beira-mar no Caribe',
    notaCuratorial:
      'Caribe colombiano em roteiro fechado, sem a dor de cabeça de organizar cada trecho sozinho — sol, mar e a companhia do grupo do início ao fim.',
    perfis: ['Praia', 'Roteiro curto'],
    expiraEm: '2027-01-04',
  },
];
