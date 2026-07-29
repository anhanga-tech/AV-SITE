/*
  Fonte única dos parques do hub /parques-brasil.

  `tier` existe para não borrar duas coisas diferentes na copy:
  - `credenciado`: a Anhangá é agente credenciado do parque e emite ingresso
    oficial (declarado no OrganizationSchema, no /sobre e no FAQ da home).
  - `pacote`: a agência monta a viagem (aéreo, hospedagem, transfer, ingresso),
    sem relação de credenciamento com o parque. Prometer o contrário seria
    vender autoridade que não existe.
  - `emBreve`: parque anunciado e ainda em obras — sem venda possível hoje.

  `href` só existe para parques com página própria. Quando outro parque ganhar
  landing, basta preencher o campo: as seções já tratam a ausência.
*/

export type ParkTier = 'credenciado' | 'pacote' | 'emBreve';

export interface Park {
  slug: string;
  name: string;
  city: string;
  state: string;
  tier: ParkTier;
  kind: 'Parque temático' | 'Parque aquático';
  /** O que o parque é, em uma frase que sobrevive a mudança de temporada. */
  claim: string;
  /** Para quem a viagem funciona — o critério real de escolha. */
  bestFor: string;
  /** Duração de roteiro que a agência recomenda. */
  days: string;
  /** Melhor época, em termos de fila e clima. */
  when: string;
  href?: string;
}

export const PARKS: Park[] = [
  {
    slug: 'beto-carrero',
    name: 'Beto Carrero World',
    city: 'Penha',
    state: 'SC',
    tier: 'credenciado',
    kind: 'Parque temático',
    claim:
      'É o maior parque temático da América Latina e o único do país que junta montanha-russa, zoológico e show de dublê no mesmo ingresso.',
    bestFor:
      'Família com filhos de idades diferentes. Enquanto um encara a FireWhip, o outro fica na área da Madagascar — e ninguém passa o dia esperando.',
    days: '2 dias inteiros de parque, 3 a 4 de roteiro',
    when: 'Evite janeiro e julho se puder. Mesmo parque, metade da fila.',
    href: '/beto-carrero',
  },
  {
    slug: 'hopi-hari',
    name: 'Hopi Hari',
    city: 'Vinhedo',
    state: 'SP',
    tier: 'credenciado',
    kind: 'Parque temático',
    claim:
      'É o parque de montanha-russa de São Paulo. Fica na Bandeirantes, a cerca de 70 km da capital — o único desta lista que cabe num bate-volta.',
    bestFor:
      'Adolescente, adulto e criança grande que já encara brinquedo radical. Para quem tem filho pequeno, rende menos que os outros daqui.',
    days: '1 dia resolve',
    when: 'Dia de semana fora de férias escolares. A diferença de fila é grande.',
  },
  {
    slug: 'thermas-dos-laranjais',
    name: 'Thermas dos Laranjais',
    city: 'Olímpia',
    state: 'SP',
    tier: 'pacote',
    kind: 'Parque aquático',
    claim:
      'É o parque aquático mais visitado da América Latina no levantamento anual da TEA/AECOM. A água é termal: sai quente do subsolo, sem aquecimento artificial.',
    bestFor:
      'Família que quer piscina o dia inteiro sem depender do sol aparecer.',
    days: '2 a 3 dias',
    when: 'O ano todo. É o único parque aquático daqui que não perde a graça em julho.',
  },
  {
    slug: 'beach-park',
    name: 'Beach Park',
    city: 'Aquiraz',
    state: 'CE',
    tier: 'pacote',
    kind: 'Parque aquático',
    claim:
      'Complexo aquático colado no litoral cearense, a meia hora de Fortaleza, com resorts dentro da própria estrutura.',
    bestFor:
      'Quem quer parque e praia na mesma viagem sem trocar de cidade nem pegar estrada.',
    days: '4 a 5 dias',
    when: 'Julho a janeiro pega o período de menos chuva no litoral do Ceará.',
  },
  {
    slug: 'hot-park',
    name: 'Hot Park',
    city: 'Rio Quente',
    state: 'GO',
    tier: 'pacote',
    kind: 'Parque aquático',
    claim:
      'Águas termais no meio do cerrado goiano, com uma praia de rio de água naturalmente quente.',
    bestFor:
      'Casal ou família que topa combinar parque com descanso — a região vive de resort e águas termais.',
    days: '3 a 4 dias',
    when: 'Maio a setembro, a seca goiana. Chove pouco e a água quente compensa a noite fria.',
  },
  {
    slug: 'cacau-park',
    name: 'Cacau Park',
    city: 'Itu',
    state: 'SP',
    tier: 'emBreve',
    kind: 'Parque temático',
    claim:
      'O parque da Cacau Show, em obras no km 84 da Castelo Branco. A abertura anunciada é dezembro de 2027.',
    bestFor: 'Ainda não é possível viajar para lá — nem comprar ingresso.',
    days: '—',
    when: 'A partir de dezembro de 2027, conforme o cronograma anunciado pelo parque.',
  },
];

export const CREDENTIALED_PARKS = PARKS.filter((park) => park.tier === 'credenciado');
export const PACKAGE_PARKS = PARKS.filter((park) => park.tier === 'pacote');
export const UPCOMING_PARKS = PARKS.filter((park) => park.tier === 'emBreve');

/** Parques vendáveis hoje — o Cacau Park fica de fora da comparação. */
export const BOOKABLE_PARKS = PARKS.filter((park) => park.tier !== 'emBreve');

export const PARQUES_FAQ_ITEMS = [
  {
    question: 'Qual o melhor parque do Brasil para ir com criança pequena?',
    answer:
      'O Beto Carrero World, em Penha (SC). Ele tem áreas temáticas pensadas para quem ainda não alcança a altura mínima dos brinquedos radicais, além de zoológico e shows — o que dá programa para a criança durante o dia inteiro, não só meia hora. O Hopi Hari, por comparação, rende bem mais para adolescente e adulto.',
  },
  {
    question: 'Dá para fazer o Beto Carrero em um dia só?',
    answer:
      'Dá, mas você vai deixar coisa para trás. O parque é grande e concentra shows em horários fixos, o que obriga a escolher entre atração e apresentação. A recomendação é reservar 2 dias inteiros dentro do parque, num roteiro de 3 a 4 dias contando ida e volta. O Hopi Hari, esse sim, resolve em um dia.',
  },
  {
    question: 'A Anhangá é credenciada nos parques?',
    answer:
      'Somos agente credenciado do Beto Carrero World e do Hopi Hari — o credenciamento é o que permite emitir ingresso oficial desses dois parques, com suporte direto. Nos parques aquáticos (Thermas dos Laranjais, Beach Park e Hot Park) não temos credenciamento: montamos a viagem completa com aéreo, hospedagem, transfer e ingresso, como fazemos para qualquer destino.',
  },
  {
    question: 'Qual a melhor época para visitar parques no Brasil?',
    answer:
      'Fora de janeiro, julho e feriados prolongados, que são as férias escolares e concentram o pico de público. Fevereiro a junho e agosto a novembro entregam o mesmo parque com fila muito menor e diária de hotel mais barata. A exceção é o Beach Park: no litoral do Ceará vale mais olhar o período de chuva, de fevereiro a maio, do que o calendário escolar.',
  },
  {
    question: 'Vale mais a pena comprar ingresso e hotel separado ou pacote?',
    answer:
      'Depende de quanto tempo você tem para pesquisar. Separado costuma sair parecido no valor final; a diferença aparece quando algo dá errado — voo remarcado, parque fechado por chuva, hotel com overbooking. Num pacote montado por agência, quem resolve isso é o consultor. Nos dois parques em que somos credenciados, o ingresso ainda sai emitido oficialmente, sem intermediário.',
  },
  {
    question: 'O Cacau Park já está funcionando?',
    answer:
      'Ainda não. O parque da Cacau Show está em obras em Itu (SP), no km 84 da rodovia Castelo Branco, com abertura anunciada para dezembro de 2027. Não existe venda de ingresso nem de pacote até lá. Quando abrir, entra nesta página.',
  },
];
