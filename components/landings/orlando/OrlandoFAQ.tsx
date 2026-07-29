/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { ORLANDO_FAQ_ITEMS } from "./orlandoFaqItems";

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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = useCallback((idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
    import("../../../utils/haptics")
      .then((m) => m.triggerHaptic("light"))
      .catch(() => {});
  }, []);

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
            const isOpen = openIndex === idx;
            const panelId = `faq-panel-${idx}`;
            const tabId = `faq-tab-${idx}`;
            return (
              <li className="faq-item" key={item.question}>
                <button
                  type="button"
                  id={tabId}
                  className={`faq-tab ${TAB_ACCENTS[idx % TAB_ACCENTS.length]}`}
                  style={{ "--r": TAB_ROTATIONS[idx % TAB_ROTATIONS.length] } as React.CSSProperties}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => handleToggle(idx)}
                >
                  <span className="faq-tab-text">{item.question}</span>
                  <ChevronDown
                    className={`faq-chevron ${isOpen ? "is-open" : ""}`}
                    aria-hidden="true"
                    size={20}
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={tabId}
                  aria-hidden={!isOpen}
                  className={`faq-panel ${isOpen ? "is-open" : ""}`}
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
