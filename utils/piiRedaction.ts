/** Padrões de e-mail/telefone compartilhados por qualquer código que aceite valores de
 * origem não confiável (query string, URL) antes de repassá-los a analytics/dataLayer. */
export const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
export const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/;

/** true se o valor não parece conter um e-mail ou telefone. */
export function isSafeTrackingValue(value: string): boolean {
  return !EMAIL_PATTERN.test(value) && !PHONE_PATTERN.test(value);
}
