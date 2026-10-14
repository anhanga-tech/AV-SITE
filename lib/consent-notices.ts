/**
 * Textos vigentes dos avisos de consentimento. O ledger grava a versão e a
 * origem; o texto é reconstituído por esta tabela (Art. 8º — finalidade
 * determinada). Trocar a frase sem subir a versão quebra a prova.
 */
export const ADS_NOTICE_VERSION = '2026-10-13';

export const ADS_NOTICE_TEXT =
    'Usamos cookies de marketing para te mostrar ofertas de viagem mais relevantes. Analytics continua ativo por interesse legítimo.';

export const EMAIL_NOTICE_VERSION = '2026-10-13';

/** Frase mostrada no controle que gerou o opt-in ou a revogação. */
export const EMAIL_NOTICE_BY_ORIGIN: Record<string, string> = {
    lead: 'Aceito receber comunicações e autorizo o tratamento dos meus dados conforme a Política de Privacidade.',
    contact: 'Quero receber novidades por e-mail.',
    quiz: 'Quero receber novidades, ofertas e dicas de viagem da Anhangá Viagens.',
    waitlist: 'Também quero receber novidades, ofertas e dicas de viagem da Anhangá por e-mail.',
    privacy_page: 'Revogação do consentimento de comunicações de e-mail marketing, pedida na Política de Privacidade.',
};

export function emailNoticeText(origin: string): string {
    return EMAIL_NOTICE_BY_ORIGIN[origin] ?? EMAIL_NOTICE_BY_ORIGIN.lead;
}
