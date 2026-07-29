/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CSSProperties, SyntheticEvent } from 'react';
import { getMediaUrl, optimizeRemoteImageUrl } from "../../../data/mediaConfig";
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

/*
  Vetor não passa por transform raster — redimensionar um SVG não economiza
  byte nenhum e o `/cdn-cgi/image` pode rasterizá-lo. 3 dos 12 logos são SVG.
*/
const isVector = (path: string): boolean => path.toLowerCase().endsWith('.svg');

/*
  Nem todo original aceita transform. O `magic-kingdom.png` (11502×1942, 22,3
  megapixels) devolve HTTP 422 / "ERROR 9516: error during decoding" no
  `/cdn-cgi/image` — o arquivo cru serve normalmente, mas o resizer não o
  decodifica. Sem este fallback o logo simplesmente não apareceria.

  A causa raiz é o arquivo, não o código: precisa ser reencodado no R2 (issue
  separada, mesmo bloqueio de acesso ao bucket da #1333). Até lá o fallback
  vale para qualquer transform que falhe, não só este.
*/
const handleLogoTransformError =
  (logo: string) =>
  (event: SyntheticEvent<HTMLImageElement>): void => {
    const img = event.currentTarget;
    const raw = getMediaUrl(logo);
    // Guarda contra loop: se o próprio original falhar, não tenta de novo.
    if (img.src !== raw) img.src = raw;
  };

interface ParkCardData {
  image: string;
  alt: string;
  logo: string;
  logoAlt: string;
  logoStyle?: CSSProperties;
  logoWidth: number;
  logoHeight: number;
  description: string;
}

interface ParkGroupData {
  label: string;
  className: string;
  parks: ParkCardData[];
}

function ParkCard({ image, alt, logo, logoAlt, logoStyle, logoWidth, logoHeight, description }: ParkCardData) {
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
      <img
        className="park-logo-title"
        style={logoStyle}
        // Os PNG passavam crus pelo getMediaUrl, sem transform nenhuma — é onde
        // vivia o magic-kingdom.png de 11502×1942 e 243 KB para um slot de
        // 200×55. SVG segue cru: transform raster não economiza em vetor.
        src={isVector(logo) ? getMediaUrl(logo) : optimizeRemoteImageUrl(logo, 200)}
        onError={isVector(logo) ? undefined : handleLogoTransformError(logo)}
        alt={logoAlt}
        width={logoWidth}
        height={logoHeight}
        loading="lazy"
      />
      <p>{description}</p>
    </div>
  );
}

const PARK_GROUPS: ParkGroupData[] = [
  {
    label: "Walt Disney World",
    className: "disney-group",
    parks: [
      {
        image: "images/orlando/parks/magic-kingdom.jpg",
        alt: "Magic Kingdom",
        logo: "images/orlando/logos/magic-kingdom.png",
        logoAlt: "Magic Kingdom Logo",
        logoWidth: 120,
        logoHeight: 40,
        description: "Onde a fantasia é lei. O castelo icônico, fogos inesquecíveis e a magia que define Orlando.",
      },
      {
        image: "images/orlando/parks/epcot.jpg",
        alt: "Epcot",
        logo: "images/orlando/logos/epcot.png",
        logoAlt: "Epcot Logo",
        logoStyle: { maxWidth: "120px", maxHeight: "33px" },
        logoWidth: 120,
        logoHeight: 33,
        description: "Volta ao mundo em um dia. Coma em Paris, beba no Japão e voe para o futuro.",
      },
      {
        image: "images/orlando/parks/hollywood-studios.jpg",
        alt: "Hollywood Studios",
        logo: "images/orlando/logos/hollywood-studios.svg",
        logoAlt: "Hollywood Studios Logo",
        logoWidth: 120,
        logoHeight: 40,
        description: "Luz, câmera, ação! Da saga Star Wars ao quintal de Toy Story: você é o protagonista.",
      },
      {
        image: "images/orlando/parks/animal-kingdom.jpg",
        alt: "Animal Kingdom",
        logo: "images/orlando/logos/animal-kingdom.svg",
        logoAlt: "Animal Kingdom Logo",
        logoWidth: 120,
        logoHeight: 40,
        description: "A natureza ruge. Safáris reais, montanhas flutuantes em Pandora e expedições selvagens.",
      },
      {
        image: "images/orlando/parks/typhoon-lagoon.jpg",
        alt: "Typhoon Lagoon",
        logo: "images/orlando/logos/typhoon-lagoon.png",
        logoAlt: "Typhoon Lagoon Logo",
        logoWidth: 120,
        logoHeight: 40,
        description: "Tsunamis de diversão. Encare ondas gigantes ou relaxe no rio lento deste paraíso tropical.",
      },
    ],
  },
  {
    label: "Universal Orlando",
    className: "universal-group",
    parks: [
      {
        image: "images/orlando/universal-studios-orlando.jpg",
        alt: "Universal Studios Orlando",
        logo: "images/orlando/logos/universal-studios.png",
        logoAlt: "Universal Studios Logo",
        logoStyle: { maxHeight: "77px", maxWidth: "280px" },
        logoWidth: 280,
        logoHeight: 77,
        description: "Entre no filme. Fuja do banco de Gringotts, brinque com os Minions e viva o cinema.",
      },
      {
        image: "images/orlando/parks/islands-of-adventure.jpg",
        alt: "Islands of Adventure",
        logo: "images/orlando/logos/islands-of-adventure.png",
        logoAlt: "Islands of Adventure Logo",
        logoStyle: { maxHeight: "77px", maxWidth: "280px" },
        logoWidth: 280,
        logoHeight: 77,
        description: "Aventura nível hard. Voe de moto com Hagrid, escape de dinossauros e sinta a fúria do Hulk.",
      },
      {
        image: "images/orlando/parks/epic-universe.jpg",
        alt: "Epic Universe",
        logo: "images/orlando/logos/epic-universe.png",
        logoAlt: "Epic Universe Logo",
        logoStyle: { maxHeight: "77px", maxWidth: "280px" },
        logoWidth: 280,
        logoHeight: 77,
        description: "5 mundos, 1 destino. De Super Nintendo World a Monstros Clássicos: o portal se abriu.",
      },
      {
        image: "images/orlando/parks/volcano-bay.jpg",
        alt: "Volcano Bay",
        logo: "images/orlando/logos/volcano-bay.png",
        logoAlt: "Volcano Bay Logo",
        logoStyle: { maxHeight: "77px", maxWidth: "280px" },
        logoWidth: 280,
        logoHeight: 77,
        description: "Praia e adrenalina. Despenque do vulcão Krakatau ou apenas relaxe na areia. O TapuTapu cuida da fila.",
      },
    ],
  },
  {
    label: "Outras Aventuras",
    className: "other-group",
    parks: [
      {
        image: "images/orlando/parks/seaworld.jpg",
        alt: "SeaWorld",
        logo: "images/orlando/logos/seaworld.png",
        logoAlt: "SeaWorld Logo",
        logoWidth: 120,
        logoHeight: 40,
        description: "Coasters insanas. Acelere na Pipeline e na Mako, depois recupere o fôlego admirando a vida marinha.",
      },
      {
        image: "images/orlando/parks/discovery-cove.jpg",
        alt: "Discovery Cove",
        logo: "images/orlando/logos/discovery-cove.png",
        logoAlt: "Discovery Cove Logo",
        logoWidth: 120,
        logoHeight: 40,
        description: "Seu dia de VIP. All-inclusive de luxo: nade com golfinhos e esqueça do mundo lá fora.",
      },
      {
        image: "images/orlando/parks/kennedy-space-center.jpg",
        alt: "Kennedy Space Center",
        logo: "images/orlando/logos/kennedy-space-center.svg",
        logoAlt: "Kennedy Space Center Logo",
        logoWidth: 120,
        logoHeight: 40,
        description: "3... 2... 1... Decolar! Foguetes reais da NASA, pedras lunares e a história do universo.",
      },
    ],
  },
];

export function OrlandoParksGallery() {
  return (
    <section className="parks-gallery" id="parks">
      <h2 className="section-title">
        <span className="highlight-pink">Parques</span>{" "}
        <span className="highlight-blue">Imperdíveis</span>
      </h2>

      {PARK_GROUPS.map((group) => (
        <div key={group.label} className={`complex-group ${group.className}`}>
          <div className="complex-label">
            <span>{group.label}</span>
          </div>
          <div className="parks-grid">
            {group.parks.map((park) => (
              <ParkCard key={park.alt} {...park} />
            ))}
          </div>
        </div>
      ))}

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
