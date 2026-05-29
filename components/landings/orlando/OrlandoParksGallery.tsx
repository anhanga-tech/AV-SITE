/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMediaUrl, optimizeRemoteImageUrl } from "../../../data/mediaConfig";
import { openContactModal } from "../../../utils/contactForm";

export function OrlandoParksGallery() {
  return (
    <section className="parks-gallery" id="parks">
      <h2 className="section-title">
        <span className="highlight-pink">Parques</span>{" "}
        <span className="highlight-blue">Imperdíveis</span>
      </h2>

      {/* --- WALT DISNEY WORLD --- */}
      <div className="complex-group disney-group">
        <div className="complex-label">
          <span>Walt Disney World</span>
        </div>
        <div className="parks-grid">
          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/magic-kingdom.jpg",
                  600,
                  400,
                )}
                alt="Magic Kingdom"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              src={getMediaUrl("images/orlando/logos/magic-kingdom.png")}
              alt="Magic Kingdom Logo"
              width="120"
              height="40"
              loading="lazy"
            />
            <p>
              Onde a fantasia é lei. O castelo icônico, fogos inesquecíveis e
              a magia que define Orlando.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/epcot.jpg",
                  600,
                  400,
                )}
                alt="Epcot"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              style={{ maxWidth: "120px", maxHeight: "33px" }}
              src={getMediaUrl("images/orlando/logos/epcot.png")}
              alt="Epcot Logo"
              width="120"
              height="33"
              loading="lazy"
            />
            <p>
              Volta ao mundo em um dia. Coma em Paris, beba no Japão e voe
              para o futuro.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/hollywood-studios.jpg",
                  600,
                  400,
                )}
                alt="Hollywood Studios"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              src={getMediaUrl("images/orlando/logos/hollywood-studios.svg")}
              alt="Hollywood Studios Logo"
              width="120"
              height="40"
              loading="lazy"
            />
            <p>
              Luz, câmera, ação! Da saga Star Wars ao quintal de Toy Story:
              você é o protagonista.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/animal-kingdom.jpg",
                  600,
                  400,
                )}
                alt="Animal Kingdom"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              src={getMediaUrl("images/orlando/logos/animal-kingdom.svg")}
              alt="Animal Kingdom Logo"
              width="120"
              height="40"
              loading="lazy"
            />
            <p>
              A natureza ruge. Safáris reais, montanhas flutuantes em Pandora
              e expedições selvagens.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/typhoon-lagoon.jpg",
                  600,
                  400,
                )}
                alt="Typhoon Lagoon"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              src={getMediaUrl("images/orlando/logos/typhoon-lagoon.png")}
              alt="Typhoon Lagoon Logo"
              width="120"
              height="40"
              loading="lazy"
            />
            <p>
              Tsunamis de diversão. Encare ondas gigantes ou relaxe no rio
              lento deste paraíso tropical.
            </p>
          </div>
        </div>
      </div>

      {/* --- UNIVERSAL ORLANDO --- */}
      <div className="complex-group universal-group">
        <div className="complex-label">
          <span>Universal Orlando</span>
        </div>
        <div className="parks-grid">
          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/universal-studios-orlando.jpg",
                  600,
                  400,
                )}
                alt="Universal Studios Orlando"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              style={{ maxHeight: "77px", maxWidth: "280px" }}
              src={getMediaUrl("images/orlando/logos/universal-studios.png")}
              alt="Universal Studios Logo"
              width="280"
              height="77"
              loading="lazy"
            />
            <p>
              Entre no filme. Fuja do banco de Gringotts, brinque com os
              Minions e viva o cinema.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/islands-of-adventure.jpg",
                  600,
                  400,
                )}
                alt="Islands of Adventure"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              style={{ maxHeight: "77px", maxWidth: "280px" }}
              src={getMediaUrl(
                "images/orlando/logos/islands-of-adventure.png",
              )}
              alt="Islands of Adventure Logo"
              width="280"
              height="77"
              loading="lazy"
            />
            <p>
              Aventura nível hard. Voe de moto com Hagrid, escape de
              dinossauros e sinta a fúria do Hulk.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/epic-universe.jpg",
                  600,
                  400,
                )}
                alt="Epic Universe"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              style={{ maxHeight: "77px", maxWidth: "280px" }}
              src={getMediaUrl("images/orlando/logos/epic-universe.png")}
              alt="Epic Universe Logo"
              width="280"
              height="77"
              loading="lazy"
            />
            <p>
              5 mundos, 1 destino. De Super Nintendo World a Monstros
              Clássicos: o portal se abriu.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/volcano-bay.jpg",
                  600,
                  400,
                )}
                alt="Volcano Bay"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              style={{ maxHeight: "77px", maxWidth: "280px" }}
              src={getMediaUrl("images/orlando/logos/volcano-bay.png")}
              alt="Volcano Bay Logo"
              width="280"
              height="77"
              loading="lazy"
            />
            <p>
              Praia e adrenalina. Despenque do vulcão Krakatau ou apenas
              relaxe na areia. O TapuTapu cuida da fila.
            </p>
          </div>
        </div>
      </div>

      {/* --- OUTRAS AVENTURAS --- */}
      <div className="complex-group other-group">
        <div className="complex-label">
          <span>Outras Aventuras</span>
        </div>
        <div className="parks-grid">
          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/seaworld.jpg",
                  600,
                  400,
                )}
                alt="SeaWorld"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              src={getMediaUrl("images/orlando/logos/seaworld.png")}
              alt="SeaWorld Logo"
              width="120"
              height="40"
              loading="lazy"
            />
            <p>
              Coasters insanas. Acelere na Pipeline e na Mako, depois recupere
              o fôlego admirando a vida marinha.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/discovery-cove.jpg",
                  600,
                  400,
                )}
                alt="Discovery Cove"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              src={getMediaUrl("images/orlando/logos/discovery-cove.png")}
              alt="Discovery Cove Logo"
              width="120"
              height="40"
              loading="lazy"
            />
            <p>
              Seu dia de VIP. All-inclusive de luxo: nade com golfinhos e
              esqueça do mundo lá fora.
            </p>
          </div>

          <div className="park-card">
            <div className="park-image-frame">
              <img
                src={optimizeRemoteImageUrl(
                  "images/orlando/parks/kennedy-space-center.jpg",
                  600,
                  400,
                )}
                alt="Kennedy Space Center"
                width="600"
                height="400"
                loading="lazy"
              />
            </div>
            <img
              className="park-logo-title"
              src={getMediaUrl(
                "images/orlando/logos/kennedy-space-center.svg",
              )}
              alt="Kennedy Space Center Logo"
              width="120"
              height="40"
              loading="lazy"
            />
            <p>
              3... 2... 1... Decolar! Foguetes reais da NASA, pedras lunares e
              a história do universo.
            </p>
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
