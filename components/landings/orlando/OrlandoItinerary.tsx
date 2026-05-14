/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { openContactModal } from "../../../utils/contactForm";

interface WashiTapeProps {
  className?: string;
  style?: React.CSSProperties;
}

const WashiTape = ({ className, style }: WashiTapeProps) => (
  <div className={`washi-tape ${className || ""}`} style={style}></div>
);

export function OrlandoItinerary() {
  return (
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
  );
}
