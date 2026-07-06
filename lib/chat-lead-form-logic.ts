import { isValidEmail, normalizeWhatsappNumber } from './lead-logic';

export interface LeadFinalizePayload {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  bantSummary: string;
  destination: string;
}

export interface LeadFinalizeResult {
  ok: boolean;
  notice?: string;
  error?: string;
  requestId?: string;
}

export type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  lgpd?: string;
};

export type LeadFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  countryCode: string;
  acceptedLGPD: boolean;
  destination?: string;
  defaultBantSummary?: string;
};

export type ValidationResult =
  | {
      ok: true;
      payload: LeadFinalizePayload;
      /** LGPD checkbox is mandatory, so a valid submit always carries consent. */
      marketingOptIn: boolean;
    }
  | {
      ok: false;
      fieldErrors?: FieldErrors;
      localError: string;
    };

export function validateLeadForm(values: LeadFormValues): ValidationResult {
  const normalizedFirstName = values.firstName.trim();
  const normalizedLastName = values.lastName.trim();
  const normalizedEmail = values.email.trim().toLowerCase();
  const normalizedWhatsapp = normalizeWhatsappNumber(values.whatsapp, values.countryCode);
  const normalizedDestination = values.destination?.trim() || '';

  const errors: FieldErrors = {};
  if (!normalizedFirstName) errors.firstName = 'Campo obrigatório';
  if (!normalizedLastName) errors.lastName = 'Campo obrigatório';
  if (!normalizedEmail) {
    errors.email = 'Campo obrigatório';
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = 'E-mail inválido';
  }

  if (!values.whatsapp.trim()) {
    errors.whatsapp = 'Campo obrigatório';
  } else if (!normalizedWhatsapp) {
    errors.whatsapp = 'WhatsApp inválido';
  }

  if (!values.acceptedLGPD) {
    errors.lgpd = 'Você deve aceitar os termos';
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      fieldErrors: errors,
      localError: 'Por favor, corrija os erros no formulário.',
    };
  }

  if (!normalizedDestination) {
    return {
      ok: false,
      localError: 'Não conseguimos identificar o destino da sua viagem. Gere o link novamente pelo chat.',
    };
  }

  return {
    ok: true,
    payload: {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      whatsapp: normalizedWhatsapp!,
      bantSummary: values.defaultBantSummary || 'Não informado',
      destination: normalizedDestination,
    },
    marketingOptIn: values.acceptedLGPD,
  };
}
