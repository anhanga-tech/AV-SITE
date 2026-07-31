/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, type Ref } from "react";
import { Link } from "react-router-dom";
import { optimizeRemoteImageUrl } from "../../../data/mediaConfig";
import { BRAND_LOGO_BLUE_URL } from "../../../lib/media-assets";
import { openContactModal } from "../../../utils/contactForm";

const LOGO_URL = BRAND_LOGO_BLUE_URL;

// --- Helper Components ---

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
  ref?: Ref<HTMLDivElement>;
}

const Card = ({ className, imgSrc, imgAlt, label, tape, ref }: CardProps) => (
  <div className={`card ${className}`} ref={ref}>
    <img src={imgSrc} alt={imgAlt} width="300" height="300" />
    <div className="card-label">{label}</div>
    {tape && <WashiTape style={tape.style} />}
  </div>
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

export function OrlandoHero() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Devolve os cartões à posição de repouso quando a preferência muda no meio
    // da sessão — sem isto eles congelariam no último deslocamento aplicado.
    const resetCards = () => {
      cardsRef.current.forEach((card) => {
        if (card) card.style.transform = "";
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      // O reset global de motion (src/index.css) zera animation-duration e
      // transition-duration com !important, mas não alcança um transform
      // inline aplicado por JS: o movimento acontecia mesmo com a preferência
      // ligada. O PRODUCT.md é explícito — "reduced motion não é opcional".
      if (reduceMotion.matches) return;

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
    reduceMotion.addEventListener("change", resetCards);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      reduceMotion.removeEventListener("change", resetCards);
    };
  }, []);

  return (
    <>
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
              type="button"
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
            text="Roteiro Dia a Dia"
            rotation="15deg"
          />
          <Badge
            className="badge-2"
            text="Guia em Português"
            rotation="-10deg"
          />
        </div>
      </main>
    </>
  );
}
