/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFooterRuntimeMetadata } from "../../../lib/footer-runtime";
import { BRAND_LOGO_BLUE_URL } from "../../../lib/media-assets";
import { openContactModal } from "../../../utils/contactForm";

const LOGO_URL = BRAND_LOGO_BLUE_URL;

export function OrlandoFooter() {
  const runtimeMetadata = useFooterRuntimeMetadata();

  return (
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
  );
}
