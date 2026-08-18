/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { optimizeRemoteImageUrl } from "../../../data/mediaConfig";
import { openContactModal } from "../../../utils/contactForm";
import { FEATURED_PARKS, OTHER_PARK_GROUPS, TOTAL_PARKS_COUNT, type ParkCardData } from "./orlandoParksData";

/*
  Por que não há `srcSet` aqui: `selectImagePreset` (lib/media-url.ts) normaliza
  qualquer largura para um conjunto fixo de presets — tudo abaixo de 800 vira
  `inline-sm` 800. Um srcSet de várias entradas geraria a MESMA URL repetida,
  markup morto. O que decide os bytes neste repo é qual preset a chamada cai,
  não quantos candidatos ela oferece.

  Um único candidato de 800 cobre a página inteira: a foto ocupa 328px no
  desktop e 237px no celular, então mesmo em DPR 3 o alvo fica abaixo de 800.
*/

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
