/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { optimizeRemoteImageUrl } from "../../../data/mediaConfig";
import { openContactModal } from "../../../utils/contactForm";

/*
  Por que não há `srcSet` aqui: `selectImagePreset` (lib/media-url.ts) normaliza
  qualquer largura para um conjunto fixo de presets — tudo abaixo de 800 vira
  `inline-sm` 800. Um srcSet de várias entradas geraria a MESMA URL repetida,
  markup morto. O que decide os bytes neste repo é qual preset a chamada cai,
  não quantos candidatos ela oferece.

  Um único candidato de 800 cobre a página inteira: a foto ocupa 328px no
  desktop e 237px no celular, então mesmo em DPR 3 o alvo fica abaixo de 800.
*/

interface ParkCardData {
  name: string;
  image: string;
  alt: string;
  description: string;
  recommendedFor?: string;
}

interface ParkGroupData {
  label: string;
  className: string;
  parks: ParkCardData[];
}

function ParkCard({ name, image, alt, description, recommendedFor }: ParkCardData) {
  return (
    <div className="park-card">
      <div className="park-image-frame">
        {/*
          Sem `height` na chamada de propósito: com (600, 400) o ratio 1,5 não
          casa com nenhum preset dentro da tolerância de 0,08 e caía no fallback
          `content` 1200×675 — para um frame de 220px de altura. Sem height cai
          em `inline-sm` 800 `scale-down`.

          Trocar `cover` por `scale-down` não muda o enquadramento visível: o
          `.park-image-frame img` já aplica `object-fit: cover` com altura fixa,
          então o recorte é do CSS, não do transform.
        */}
        <img
          src={optimizeRemoteImageUrl(image, 660)}
          alt={alt}
          width="600"
          height="400"
          loading="lazy"
        />
      </div>
      <h3>{name}</h3>
      {recommendedFor && <p className="park-recommended">Ideal para: {recommendedFor}</p>}
      <p>{description}</p>
    </div>
  );
}

// Curadoria da issue #1330: 4 parques em destaque, um de cada frente que a
// Anhangá recomenda primeiro, em vez dos 12 lado a lado sem hierarquia.
const FEATURED_PARKS: ParkCardData[] = [
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
const OTHER_PARK_GROUPS: ParkGroupData[] = [
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

const TOTAL_PARKS_COUNT =
  FEATURED_PARKS.length +
  OTHER_PARK_GROUPS.reduce((total, group) => total + group.parks.length, 0);

export function OrlandoParksGallery() {
  const [showAll, setShowAll] = useState(false);
  const instanceId = useId();
  const panelId = `${instanceId}-all-parks`;

  return (
    <section className="parks-gallery" id="parks">
      <h2 className="section-title">
        <span className="highlight-pink">Parques</span>{" "}
        <span className="highlight-blue">Imperdíveis</span>
      </h2>

      <div className="parks-grid featured-parks-grid">
        {FEATURED_PARKS.map((park) => (
          <ParkCard key={park.name} {...park} />
        ))}
      </div>

      <div className="parks-toggle-wrapper">
        <button
          type="button"
          className="parks-toggle-btn"
          aria-expanded={showAll}
          aria-controls={panelId}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Ver menos parques" : `Ver todos os ${TOTAL_PARKS_COUNT} parques`}
          <ChevronDown
            className={`parks-toggle-chevron ${showAll ? "is-open" : ""}`}
            aria-hidden="true"
            size={20}
          />
        </button>

        <div
          id={panelId}
          className={`parks-toggle-panel ${showAll ? "is-open" : ""}`}
          aria-hidden={!showAll}
        >
          <div className="parks-toggle-panel-inner">
            {OTHER_PARK_GROUPS.map((group) => (
              <div key={group.label} className={`complex-group ${group.className}`}>
                <div className="complex-label">
                  <span>{group.label}</span>
                </div>
                <div className="parks-grid">
                  {group.parks.map((park) => (
                    <ParkCard key={park.name} {...park} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gallery-cta">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            openContactModal({ source: 'orlando', destination: 'Orlando' });
          }}
          className="btn-whatsapp btn-specialist main-btn secondary"
          data-tracking="mid-orlando"
        >
          Ver Pacotes
        </button>
      </div>
    </section>
  );
}
