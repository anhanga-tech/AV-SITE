/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronDown } from "lucide-react";
import { ORLANDO_FAQ_ITEMS } from "./orlandoFaqItems";
import { useFaqAccordion } from "../shared/useFaqAccordion";

interface WashiTapeProps {
  className?: string;
  style?: React.CSSProperties;
}

const WashiTape = ({ className, style }: WashiTapeProps) => (
  <div className={`washi-tape ${className || ""}`} style={style}></div>
);

// Cada aba cicla por uma cor de acento diferente, como post-its de cores
// variadas presos num fichário — nunca a mesma cor duas vezes seguidas.
const TAB_ACCENTS = ["tab-yellow", "tab-pink", "tab-blue", "tab-green"];
const TAB_ROTATIONS = ["-1.5deg", "1deg", "-1deg", "1.5deg"];

export function OrlandoFAQ() {
  const accordionItems = useFaqAccordion(ORLANDO_FAQ_ITEMS);

  return (
    <section className="faq-section" id="faq">
      <div className="faq-wrapper">
        <WashiTape
          style={{
            top: "-25px",
            left: "50%",
            transform: "translateX(-50%) rotate(-1.5deg)",
            width: "200px",
            background: "rgba(76, 201, 240, 0.6)",
          }}
        />
        <div className="faq-header">
          <h2>Dúvidas Frequentes</h2>
          <span className="subtitle">Sem letra miúda</span>
        </div>

        <ul className="faq-list">
          {ORLANDO_FAQ_ITEMS.map((item, idx) => {
            const { isOpen, buttonProps, panelProps } = accordionItems[idx];
            return (
              <li className="faq-item" key={item.question}>
                <button
                  type="button"
                  className={`faq-tab ${TAB_ACCENTS[idx % TAB_ACCENTS.length]}`}
                  style={{ "--r": TAB_ROTATIONS[idx % TAB_ROTATIONS.length] } as React.CSSProperties}
                  {...buttonProps}
                >
                  <span className="faq-tab-text">{item.question}</span>
                  <ChevronDown
                    className={`faq-chevron ${isOpen ? "is-open" : ""}`}
                    aria-hidden="true"
                    size={20}
                  />
                </button>
                <div
                  className={`faq-panel ${isOpen ? "is-open" : ""}`}
                  {...panelProps}
                >
                  <div className="faq-panel-inner">
                    <p className="faq-answer">{item.answer}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
