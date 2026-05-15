/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrlandoHero } from "./OrlandoHero";
import { OrlandoFeatures } from "./OrlandoFeatures";
import { OrlandoParksGallery } from "./OrlandoParksGallery";
import { OrlandoItinerary } from "./OrlandoItinerary";
import { OrlandoFooter } from "./OrlandoFooter";

function OrlandoApp() {
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
      <OrlandoHero />
      <OrlandoFeatures />
      <OrlandoParksGallery />
      <OrlandoItinerary />
      <OrlandoFooter />
    </div>
  );
}

export default OrlandoApp;
