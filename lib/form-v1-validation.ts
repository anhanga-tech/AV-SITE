import { isValidEmail, normalizeWhatsappNumber } from './lead-logic';

export { isValidEmail } from './lead-logic';

export type ContactFormValidationInput = {
  firstName: string;
  whatsapp: string;
  email?: string;
};

export type ContactFormFieldErrors = Partial<Record<'firstName' | 'whatsapp' | 'email', string>>;

export type WaitlistFormFieldErrors = Partial<Record<'name' | 'email', string>>;

export type NpsFormFieldErrors = Partial<Record<'firstname' | 'email' | 'score', string>>;

function cleanEmail(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function validateContactFormFields(input: ContactFormValidationInput):
  | { valid: true; normalized: { firstName: string; whatsapp: string; email?: string }; errors: ContactFormFieldErrors }
  | { valid: false; normalized: { firstName: string; whatsapp?: string; email?: string }; errors: ContactFormFieldErrors } {
  const firstName = input.firstName.trim();
  const email = cleanEmail(input.email);
  const whatsapp = normalizeWhatsappNumber(input.whatsapp);
  const errors: ContactFormFieldErrors = {};

  if (!firstName) errors.firstName = 'Informe seu nome.';
  if (!whatsapp) errors.whatsapp = 'Informe um WhatsApp válido.';
  if (email && !isValidEmail(email)) errors.email = 'Informe um e-mail válido ou deixe em branco.';

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      normalized: { firstName, whatsapp: whatsapp ?? undefined, email: email || undefined },
      errors,
    };
  }

  return {
    valid: true,
    normalized: { firstName, whatsapp: whatsapp!, email: email || undefined },
    errors,
  };
}

export function validateWaitlistFormFields(input: { name: string; email: string }):
  | { valid: true; normalized: { name: string; email: string }; errors: WaitlistFormFieldErrors }
  | { valid: false; normalized: { name: string; email: string }; errors: WaitlistFormFieldErrors } {
  const name = input.name.trim();
  const email = cleanEmail(input.email);
  const errors: WaitlistFormFieldErrors = {};

  if (!name) errors.name = 'Informe seu nome completo.';
  if (!email) errors.email = 'Informe seu e-mail.';
  else if (!isValidEmail(email)) errors.email = 'Informe um e-mail válido.';

  if (Object.keys(errors).length > 0) {
    return { valid: false, normalized: { name, email }, errors };
  }

  return { valid: true, normalized: { name, email }, errors };
}

export function validateNpsFormFields(input: { firstname: string; email: string; score: number | null }):
  | { valid: true; normalized: { firstname: string; email: string; score: number }; errors: NpsFormFieldErrors }
  | { valid: false; normalized: { firstname: string; email: string; score: number | null }; errors: NpsFormFieldErrors } {
  const firstname = input.firstname.trim();
  const email = cleanEmail(input.email);
  const errors: NpsFormFieldErrors = {};

  if (!firstname) errors.firstname = 'Informe seu nome.';
  if (!email) errors.email = 'Informe seu e-mail.';
  else if (!isValidEmail(email)) errors.email = 'Informe um e-mail válido.';
  if (input.score === null) errors.score = 'Escolha uma nota.';

  if (Object.keys(errors).length > 0) {
    return { valid: false, normalized: { firstname, email, score: input.score }, errors };
  }

  return { valid: true, normalized: { firstname, email, score: input.score! }, errors };
}

export function isFieldCompleteForAnalytics(fieldName: string, value: string | boolean | number | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value);
  if (value === null || value === undefined) return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  if (fieldName === 'email') return isValidEmail(trimmed);
  if (fieldName === 'whatsapp' || fieldName === 'phone') return normalizeWhatsappNumber(trimmed) !== null;

  return true;
}
