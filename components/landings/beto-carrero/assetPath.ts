import {
  BETO_CARRERO_FIREWHIP_IMAGE_URL,
  BETO_CARRERO_LANDING_IMAGE_URL,
  BRAND_LOGO_BLUE_URL,
  BRAND_LOGO_WHITE_URL,
} from '../../../lib/media-assets';

const BETO_ASSET_URLS: Record<string, string> = {
  'LOGO ANHANGA VIAGENS - AZUL.svg': BRAND_LOGO_BLUE_URL,
  'LOGO ANHANGA VIAGENS - BRANCO.svg': BRAND_LOGO_WHITE_URL,
  'hero.jpg': BETO_CARRERO_LANDING_IMAGE_URL,
  'firewhip.jpg': BETO_CARRERO_FIREWHIP_IMAGE_URL,
};

export const getBetoAssetUrl = (filename: string): string =>
  BETO_ASSET_URLS[filename] ?? BETO_CARRERO_LANDING_IMAGE_URL;
