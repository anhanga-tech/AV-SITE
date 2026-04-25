export const pushWhatsAppCta = (page: string) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'whatsapp_cta_click', page });
};
