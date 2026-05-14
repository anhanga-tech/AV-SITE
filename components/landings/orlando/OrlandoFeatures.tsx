/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface WashiTapeProps {
  className?: string;
  style?: React.CSSProperties;
}

const WashiTape = ({ className, style }: WashiTapeProps) => (
  <div className={`washi-tape ${className || ""}`} style={style}></div>
);

export function OrlandoFeatures() {
  return (
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
  );
}
