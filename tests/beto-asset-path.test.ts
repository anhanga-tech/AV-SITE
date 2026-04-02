import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BETO_CARRERO_FIREWHIP_IMAGE_URL,
  BETO_CARRERO_LANDING_IMAGE_URL,
  BRAND_LOGO_BLUE_URL,
  BRAND_LOGO_WHITE_URL,
} from '../lib/media-assets';
import {
  type BetoAssetFilename,
  getBetoAssetUrl,
} from '../components/landings/beto-carrero/assetPath';

test('getBetoAssetUrl should resolve the managed Beto Carrero asset keys', () => {
  const heroKey: BetoAssetFilename = 'hero.jpg';
  const firewhipKey: BetoAssetFilename = 'firewhip.jpg';
  const blueLogoKey: BetoAssetFilename = 'LOGO ANHANGA VIAGENS - AZUL.svg';
  const whiteLogoKey: BetoAssetFilename = 'LOGO ANHANGA VIAGENS - BRANCO.svg';

  assert.equal(getBetoAssetUrl(heroKey), BETO_CARRERO_LANDING_IMAGE_URL);
  assert.equal(getBetoAssetUrl(firewhipKey), BETO_CARRERO_FIREWHIP_IMAGE_URL);
  assert.equal(getBetoAssetUrl(blueLogoKey), BRAND_LOGO_BLUE_URL);
  assert.equal(getBetoAssetUrl(whiteLogoKey), BRAND_LOGO_WHITE_URL);
});
