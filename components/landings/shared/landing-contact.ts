import { getWhatsAppLink } from '@/utils/whatsapp';

// Dados de contato dos rodapés de landing (#1969). Fora do .tsx do componente para o
// Fast Refresh poder preservar estado (react-doctor/only-export-components).
export const LANDING_PHONE_HREF = 'tel:+551152833309';
export const LANDING_PHONE_LABEL = '(11) 5283-3309';
export const CADASTUR_URL = 'https://cadastur.turismo.gov.br/hotsite/';
export const LANDING_WHATSAPP_MESSAGE = 'Olá! Vim pelo site da Anhangá e quero falar com um consultor.';

export const landingWhatsAppHref = (): string => getWhatsAppLink(LANDING_WHATSAPP_MESSAGE);
