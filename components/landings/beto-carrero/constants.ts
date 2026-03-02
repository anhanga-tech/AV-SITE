export const WHATSAPP_NUMBER = "551152833309";
export const WHATSAPP_MESSAGE = "Olá! Quero montar meu pacote para o Beto Carrero!";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

// Images are served from the production Vercel deployment (root path).
// Direct absolute URLs are required so optimizeRemoteImageUrl can proxy
// them through wsrv.nl for WebP conversion. VITE_BASE_PATH (GitHub Pages)
// is not supported in this optimization flow.
export const PROD_ASSET_BASE = 'https://www.anhanga.tur.br/landing/beto-carrero';
