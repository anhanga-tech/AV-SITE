/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getMediaUrl, optimizeRemoteImageUrl } from "../../../data/mediaConfig";
import { useFooterRuntimeMetadata } from "../../../lib/footer-runtime";
import { BRAND_LOGO_BLUE_URL } from "../../../lib/media-assets";
import { openContactModal } from "../../../utils/contactForm";

// --- Constants ---
const SITE_URL = "https://www.anhanga.tur.br";
const LOGO_URL = BRAND_LOGO_BLUE_URL;

// --- Components ---

interface WashiTapeProps {
  className?: string;
  style?: React.CSSProperties;
}

const WashiTape = ({ className, style }: WashiTapeProps) => (
  <div className={`washi-tape ${className || ""}`} style={style}></div>
);

interface CardProps {
  className: string;
  imgSrc: string;
  imgAlt: string;
  label: string;
  tape?: {
    style: React.CSSProperties;
  };
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, imgSrc, imgAlt, label, tape }, ref) => (
    <div className={`card ${className}`} ref={ref}>
      <img src={imgSrc} alt={imgAlt} width="300" height="300" />
      <div className="card-label">{label}</div>
      {tape && <WashiTape style={tape.style} />}
    </div>
  ),
);

interface BadgeProps {
  className: string;
  text: string;
  rotation: string;
}

const Badge = ({ className, text, rotation }: BadgeProps) => (
  <div
    className={`badge ${className}`}
    style={{ "--r": rotation } as React.CSSProperties}
  >
    {text}
  </div>
);

// --- Main Application ---

function OrlandoApp() {
  const runtimeMetadata = useFooterRuntimeMetadata();

  // SEO Hint: <title> name="description" og:
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Disable parallax on mobile/tablet (matches CSS breakpoint)
      if (window.innerWidth <= 1100) return;

      const { innerWidth, innerHeight } = window;
      const x = (innerWidth / 2 - e.pageX) / 50;
      const y = (innerHeight / 2 - e.pageY) / 50;

      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        // Apply effect only if not hovering directly over the card
        if (!card.matches(":hover")) {
          const speed = (index + 1) * 0.5;
          const rotation = index % 2 === 0 ? -5 : 3;
          card.style.transform = `translate(${x * speed}px, ${y * speed}px) rotate(${rotation}deg)`;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="landing-orlando">
      <svg className="grain-overlay" aria-hidden="true">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      <header>
        <Link to="/" className="logo">
          <img
            src={LOGO_URL}
            alt="Anhangá Viagens Logo"
            width="150"
            height="78"
            fetchPriority="high"
          />
        </Link>
        <nav className="nav-links" aria-label="Navegação Interna">
          <a href="#features">Destaques</a>
          <a href="#parks">Parques</a>
          <a href="#itinerary">Roteiro</a>
          <a href="#contact">Contato</a>
        </nav>
      </header>

      <main className="hero">
        <div className="hero-content">
          {/* h1 is unified to include both descriptive keywords and visual branding */}
          <h1>
            <span className="hero-label">
              Pacote para Orlando 2026: Roteiro Personalizado Disney e Universal
            </span>
            <span className="title-collage">
              <span className="highlight-blue">Orlando</span>
              <span className="highlight-pink">É SURREAL.</span>
            </span>
          </h1>

          <p className="hero-description">
            Esqueça o óbvio. Viva a adrenalina pura e a magia real no destino mais vibrante do planeta.
          </p>

          <div className="cta-container">
            <button
              onClick={(e) => {
                e.preventDefault();
                openContactModal({ source: 'orlando', destination: 'Orlando' });
              }}
              className="btn-whatsapp btn-specialist main-btn"
              data-tracking="hero-orlando"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382C17.112 14.382 16.2 13.932 15.984 13.824C15.768 13.716 15.66 13.572 15.552 13.752C15.444 13.932 15.12 14.328 15.012 14.436C14.904 14.544 14.796 14.544 14.58 14.436C14.364 14.328 13.608 14.076 12.744 13.308C12.06 12.708 11.628 11.952 11.484 11.736C11.376 11.52 11.52 11.412 11.628 11.304C11.7 11.232 11.772 11.124 11.88 11.016C11.952 10.908 12.024 10.8 12.096 10.656C12.168 10.512 12.132 10.368 12.096 10.296C12.06 10.224 11.7 9.324 11.556 8.964C11.412 8.604 11.268 8.64 11.16 8.64H10.8C10.692 8.64 10.512 8.676 10.332 8.892C10.152 9.108 9.648 9.576 9.648 10.548C9.648 11.52 10.368 12.456 10.476 12.6C10.584 12.744 13.176 16.632 17.064 18.252C19.836 19.404 19.836 19.404 20.34 19.332C20.844 19.26 21.96 18.648 22.212 17.928C22.464 17.208 22.464 16.596 22.392 16.488C22.32 16.38 22.14 16.308 21.924 16.2C21.708 16.092 20.628 15.552 20.412 15.444C20.196 15.336 20.016 15.264 19.872 15.48C19.728 15.696 19.296 16.2 19.152 16.344C19.008 16.488 18.864 16.524 18.648 16.416C18.432 16.308 17.724 16.056 16.896 15.336L17.472 14.382ZM12.036 0C5.4 0 0 5.4 0 12.036C0 14.16 0.54 16.128 1.512 17.856L0 23.4L5.652 21.924C7.272 22.824 9.144 23.328 11.16 23.328H11.232C17.856 23.328 23.256 17.928 23.256 11.268C23.256 4.608 18.216 0 12.036 0Z" />
              </svg>
              Solicitar Orçamento
            </button>
          </div>
        </div>

        <div className="sticker-gallery">
          <Card
            ref={(el) => {
              if (el) cardsRef.current[0] = el;
            }}
            className="c1"
            imgSrc={optimizeRemoteImageUrl(
              "images/orlando/cards/seaworld-pipeline.jpg",
              300,
              300,
            )}
            imgAlt="Rollercoaster"
            label="ADRENALINA 100%"
            tape={{
              style: {
                top: "-15px",
                left: "50px",
                width: "80px",
                background: "rgba(76, 201, 240, 0.6)",
                transform: "rotate(-5deg)",
              },
            }}
          />

          <Card
            ref={(el) => {
              if (el) cardsRef.current[1] = el;
            }}
            className="c2"
            imgSrc={optimizeRemoteImageUrl(
              "images/orlando/cards/magic-castle.jpg",
              300,
              300,
            )}
            imgAlt="Magic Kingdom style"
            label="O CASTELO É NOSSO"
            tape={{
              style: {
                top: "-10px",
                right: "40px",
                width: "100px",
                background: "rgba(255, 107, 157, 0.6)",
                transform: "rotate(10deg)",
              },
            }}
          />

          <Card
            ref={(el) => {
              if (el) cardsRef.current[2] = el;
            }}
            className="c3"
            imgSrc={optimizeRemoteImageUrl(
              "images/orlando/cards/summer-vibes.jpg",
              300,
              300,
            )}
            imgAlt="Palm Trees"
            label="SUMMER VIBES ONLY"
          />

          <Badge
            className="badge-1"
            text="Melhor Preço Garantido"
            rotation="15deg"
          />
          <Badge
            className="badge-2"
            text="Guia em Português"
            rotation="-10deg"
          />
        </div>
      </main>

      <section className="features-section" id="features">
        <div className="features-card">
          <WashiTape
            style={{
              top: "-15px",
              left: "50%",
              transform: "translateX(-50%) rotate(2deg)",
              width: "200px",
              background: "rgba(255, 209, 102, 0.8)",
            }}
          />
          <div className="features-header">
            <h2>#Por Que Orlando?</h2>
            <span className="handwritten-note">O HYPE É REAL!</span>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <div className="icon-box blue">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <div className="text-content">
                <h3>TEMPO BOM</h3>
                <p>
                  Sol quase o ano todo para você aproveitar as piscinas e
                  parques aquáticos.
                </p>
              </div>
            </div>
            <div className="feature-item">
              <div className="icon-box pink">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div className="text-content">
                <h3>COMPRAS</h3>
                <p>
                  Os melhores outlets do mundo com descontos que você não vai
                  acreditar.
                </p>
              </div>
            </div>
            <div className="feature-item">
              <div className="icon-box green">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="14" y="15" width="6" height="6" rx="1" />
                  <path d="M14 15V8l2-5h2l2 5v7" />
                  <path d="M2 13h10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
                  <path d="M2 13a5 5 0 0 1 10 0" />
                </svg>
              </div>
              <div className="text-content">
                <h3>GASTRONOMIA</h3>
                <p>De donuts gigantes a jantares com personagens épicos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="itinerary-section" id="itinerary">
        <div className="itinerary-wrapper">
          <WashiTape
            style={{
              top: "-25px",
              left: "50%",
              transform: "translateX(-50%) rotate(1.5deg)",
              width: "200px",
              background: "rgba(255, 107, 157, 0.6)",
            }}
          />
          <div className="itinerary-header">
            <h2>Roteiro Sugerido</h2>
            <span className="subtitle">7 Dias de Pura Magia</span>
          </div>

          <ul className="itinerary-list">
            <li>
              <div className="day-marker">Dia 1</div>
              <div className="day-content">
                Chegada + Compras no Premium Outlets
              </div>
            </li>
            <li>
              <div className="day-marker">Dia 2</div>
              <div className="day-content">
                Magic Kingdom (abertura até fogos)
              </div>
            </li>
            <li>
              <div className="day-marker">Dia 3</div>
              <div className="day-content">Universal Studios + CityWalk</div>
            </li>
            <li>
              <div className="day-marker">Dia 4</div>
              <div className="day-content">Islands of Adventure</div>
            </li>
            <li>
              <div className="day-marker">Dia 5</div>
              <div className="day-content">
                Hollywood Studios (Star Wars + Toy Story)
              </div>
            </li>
            <li>
              <div className="day-marker">Dia 6</div>
              <div className="day-content">Animal Kingdom + Disney Springs</div>
            </li>
            <li>
              <div className="day-marker">Dia 7</div>
              <div className="day-content">Última compra e volta pra casa</div>
            </li>
          </ul>

          <div className="itinerary-footer">
            <p>* Personalizamos este roteiro 100% para você!</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                openContactModal({ source: 'orlando', destination: 'Orlando' });
              }}
              className="btn-whatsapp btn-specialist main-btn"
              data-tracking="itinerary-orlando"
            >
              Quero esse roteiro!
            </button>
          </div>
        </div>
      </section>

      <footer className="main-footer" id="contact">
        <div className="footer-content">
          <div className="footer-brand">
            <img
              src={LOGO_URL}
              alt="Anhangá Viagens"
              width="247"
              height="128"
              className="footer-logo"
            />
            <p className="footer-motto">
              Transformando sonhos em destinos inesquecíveis.
            </p>
          </div>

          <div className="footer-social">
            <h3>Siga-nos</h3>
            <div className="social-links">
              <a
                href="https://instagram.com/anhangaviagens"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  openContactModal({ source: 'orlando', destination: 'Orlando' });
                }}
                className="btn-whatsapp btn-specialist"
                data-tracking="footer-whatsapp-orlando"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {runtimeMetadata ? `${runtimeMetadata.currentYear} ` : ""}
            ANHANGÁ TURISMO - TODOS OS DIREITOS RESERVADOS.
          </p>
          <p>Feito com ❤️ pela anhangá.tech • 2026</p>
        </div>
      </footer>
    </div>
  );
}

export default OrlandoApp;
