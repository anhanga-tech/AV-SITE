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
function looksLikePhoneNumber(value: string): boolean {
  if (ISO_DATE_PATTERN.test(value.trim())) return false;

  const match = value.match(PHONE_PATTERN);
  if (!match) return false;

  return match[0].startsWith('+') || /[\s().-]/.test(match[0]);
}

/** true se o valor não parece conter um e-mail ou telefone. */
export function isSafeTrackingValue(value: string): boolean {
  return !EMAIL_PATTERN.test(value) && !looksLikePhoneNumber(value);
}
