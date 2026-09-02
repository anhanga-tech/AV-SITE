/** Padrões de e-mail/telefone compartilhados por qualquer código que aceite valores de
 * origem não confiável (query string, URL) antes de repassá-los a analytics/dataLayer. */
export const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
export const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// PHONE_PATTERN sozinho casa qualquer sequência longa de dígitos, incluindo IDs de
// campanha e datas puramente numéricos (ex.: utm_campaign=1234567890, hsa_acc com
// 2026-09-01) — que isSafeTrackingValue então descartava como se fossem telefone
// (achado de review, chatgpt-codex-connector[bot]). Um telefone colado por uma pessoa
// quase sempre tem "+" de país ou algum separador de formatação; um ID gerado por
// máquina raramente tem, e datas ISO têm forma previsível o suficiente pra excluir
// explicitamente.
// Requerer "+"/separador (acima) deixava passar um celular brasileiro digitado sem
// formatação (ex.: 11987654321) — exatamente o vetor que este módulo existe pra fechar
// (achado de review, chatgpt-codex-connector[bot] P1 + claude[bot]). Não dá pra
// distinguir com certeza um ID numérico de 11 dígitos de um celular real, mas o formato
// BR (DDD 11-99 + prefixo "9" de celular) é um sinal forte o bastante pra valer o
// trade-off: ID de campanha numérico de 11 dígitos que por acaso bate nesse formato
// específico é bem mais raro do que ID de 11 dígitos qualquer (ex.: o próprio
// GOOGLE_ADS_CONVERSION_ID do projeto, AW-17331979537, não bate — terceiro dígito '3').
function looksLikeBareBrazilianMobileNumber(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;

  const ddd = Number(value.slice(0, 2));
  return ddd >= 11 && ddd <= 99 && value[2] === '9';
}

function looksLikePhoneNumber(value: string): boolean {
  if (ISO_DATE_PATTERN.test(value.trim())) return false;
  if (looksLikeBareBrazilianMobileNumber(value)) return true;

  const match = value.match(PHONE_PATTERN);
  if (!match) return false;

  return match[0].startsWith('+') || /[\s().-]/.test(match[0]);
}

/** true se o valor não parece conter um e-mail ou telefone. */
export function isSafeTrackingValue(value: string): boolean {
  return !EMAIL_PATTERN.test(value) && !looksLikePhoneNumber(value);
}
