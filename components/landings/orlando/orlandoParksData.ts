/*
  Dados dos parques da galeria /orlando, separados do componente
  (OrlandoParksGallery.tsx) para não violar a regra `only-export-components`
  do Fast Refresh — um arquivo de componente só pode exportar componentes.
*/

export interface ParkCardData {
  name: string;
  image: string;
  alt: string;
  description: string;
  recommendedFor?: string;
}

export interface ParkGroupData {
  label: string;
  className: string;
  parks: ParkCardData[];
}

// Curadoria da issue #1330: 4 parques em destaque, um de cada frente que a
// Anhangá recomenda primeiro, em vez dos 12 lado a lado sem hierarquia.
export const FEATURED_PARKS: ParkCardData[] = [
  {
    name: "Magic Kingdom",
    image: "images/orlando/parks/magic-kingdom.jpg",
    alt: "Magic Kingdom",
    recommendedFor: "primeira viagem em família",
    description: "Onde a fantasia é lei. O castelo icônico, fogos inesquecíveis e a magia que define Orlando.",
  },
  {
    name: "Hollywood Studios",
    image: "images/orlando/parks/hollywood-studios.jpg",
    alt: "Hollywood Studios",
    recommendedFor: "fãs de Star Wars e cinema",
    description: "Luz, câmera, ação! Da saga Star Wars ao quintal de Toy Story: você é o protagonista.",
  },
  {
    name: "Islands of Adventure",
    image: "images/orlando/parks/islands-of-adventure.jpg",
    alt: "Islands of Adventure",
    recommendedFor: "quem busca adrenalina",
    description: "Aventura nível hard. Voe de moto com Hagrid, escape de dinossauros e sinta a fúria do Hulk.",
  },
  {
    name: "Epic Universe",
    image: "images/orlando/parks/epic-universe.jpg",
    alt: "Epic Universe",
    recommendedFor: "quem quer o parque mais novo de Orlando",
    description: "5 mundos, 1 destino. De Super Nintendo World a Monstros Clássicos: o portal se abriu.",
  },
];

// Os outros 8 parques ficam recolhidos atrás de "Ver todos os parques" —
// continuam indexáveis (o painel só é escondido via CSS, não desmontado),
// só saem da hierarquia visual principal.
export const OTHER_PARK_GROUPS: ParkGroupData[] = [
  {
    label: "Walt Disney World",
    className: "disney-group",
    parks: [
      {
        name: "Epcot",
        image: "images/orlando/parks/epcot.jpg",
        alt: "Epcot",
        description: "Volta ao mundo em um dia. Coma em Paris, beba no Japão e voe para o futuro.",
      },
      {
        name: "Animal Kingdom",
        image: "images/orlando/parks/animal-kingdom.jpg",
        alt: "Animal Kingdom",
        description: "A natureza ruge. Safáris reais, montanhas flutuantes em Pandora e expedições selvagens.",
      },
      {
        name: "Typhoon Lagoon",
        image: "images/orlando/parks/typhoon-lagoon.jpg",
        alt: "Typhoon Lagoon",
        description: "Tsunamis de diversão. Encare ondas gigantes ou relaxe no rio lento deste paraíso tropical.",
      },
    ],
  },
  {
    label: "Universal Orlando",
    className: "universal-group",
    parks: [
      {
        name: "Universal Studios",
        image: "images/orlando/universal-studios-orlando.jpg",
        alt: "Universal Studios Orlando",
        description: "Entre no filme. Fuja do banco de Gringotts, brinque com os Minions e viva o cinema.",
      },
      {
        name: "Volcano Bay",
        image: "images/orlando/parks/volcano-bay.jpg",
        alt: "Volcano Bay",
        description: "Praia e adrenalina. Despenque do vulcão Krakatau ou apenas relaxe na areia. O TapuTapu cuida da fila.",
      },
    ],
  },
  {
    label: "Outras Aventuras",
    className: "other-group",
    parks: [
      {
        name: "SeaWorld",
        image: "images/orlando/parks/seaworld.jpg",
        alt: "SeaWorld",
        description: "Coasters insanas. Acelere na Pipeline e na Mako, depois recupere o fôlego admirando a vida marinha.",
      },
      {
        name: "Discovery Cove",
        image: "images/orlando/parks/discovery-cove.jpg",
        alt: "Discovery Cove",
        description: "Seu dia de VIP. All-inclusive de luxo: nade com golfinhos e esqueça do mundo lá fora.",
      },
      {
        name: "Kennedy Space Center",
        image: "images/orlando/parks/kennedy-space-center.jpg",
        alt: "Kennedy Space Center",
        description: "3... 2... 1... Decolar! Foguetes reais da NASA, pedras lunares e a história do universo.",
      },
    ],
  },
];

export const TOTAL_PARKS_COUNT =
  FEATURED_PARKS.length +
  OTHER_PARK_GROUPS.reduce((total, group) => total + group.parks.length, 0);

// Exportado só para teste (tests/orlando-imagens.test.ts): fonte única dos
// nomes esperados, pra não duplicar a lista de parques no teste e deixá-la
// dessincronizar quando um parque for adicionado/removido/renomeado acima.
export const ALL_PARK_NAMES: string[] = [
  ...FEATURED_PARKS.map((park) => park.name),
  ...OTHER_PARK_GROUPS.flatMap((group) => group.parks.map((park) => park.name)),
];
