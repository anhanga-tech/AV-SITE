import { EMAIL_PATTERN, PHONE_PATTERN, isSafeTrackingValue } from './piiRedaction';

export type FormAnalyticsEventName =
  | 'form_view'
  | 'form_start'
  | 'field_complete'
  | 'field_error'
  | 'submit_attempt'
  | 'submit_success'
  | 'submit_failure'
  | 'whatsapp_opened';

export interface FormAnalyticsEvent {
  event: FormAnalyticsEventName;
  formType: string;
  formId: string;
  fieldName?: string;
  errorType?: string;
  destination?: string;
}

const SAFE_FIELD_NAMES = new Set([
  'name',
  'firstName',
  'lastName',
  'email',
  'whatsapp',
  'phone',
  'lgpd',
  'marketingOptIn',
  'emailOptIn',
  'destination',
  'date',
  'score',
  'reason',
  'highlight',
  'company',
  'empresa',
  'role',
  'cargo',
]);

const SENSITIVE_QUERY_KEYS = /(?:email|mail|phone|telefone|whatsapp|name|nome|sobrenome|firstname|lastname)/i;

/** Página atual com chaves de query sensíveis (e-mail/telefone/nome) redigidas antes de ir pro dataLayer. */
export function currentPageLocation(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const url = new URL(window.location.href);
    for (const key of Array.from(url.searchParams.keys())) {
      const value = url.searchParams.get(key);
      // SENSITIVE_QUERY_KEYS só cobre nomes de parâmetro que parecem sensíveis — um
      // ?utm_content=alice@example.com passa incólume porque "utm_content" não bate
      // nesse regex, mesmo com um e-mail de verdade no valor (achado de review,
      // chatgpt-codex-connector[bot]). Checar o valor com isSafeTrackingValue cobre
      // esse caso independente do nome do parâmetro.
      if (SENSITIVE_QUERY_KEYS.test(key) || (value !== null && !isSafeTrackingValue(value))) {
        url.searchParams.set(key, 'redacted');
      }
    }
    return url.toString();
  } catch {
    // Non-global shared regexes only redact the first match; instantiate global
    // copies on the fly so every email/phone in the URL is scrubbed, without
    // making the shared patterns stateful (a global `lastIndex` breaks `.test()`).
    return window.location.href
      .replace(new RegExp(EMAIL_PATTERN, 'g'), 'redacted')
      .replace(new RegExp(PHONE_PATTERN, 'g'), 'redacted');
  }
}

function safePayload(input: FormAnalyticsEvent): Record<string, string> {
  const payload: Record<string, string> = {
    event: input.event,
    form_type: input.formType,
    form_id: input.formId,
  };

  if (input.fieldName && SAFE_FIELD_NAMES.has(input.fieldName)) {
    payload.field_name = input.fieldName;
  }

  if (input.errorType) {
    payload.error_type = input.errorType;
  }

  if (input.destination && isSafeTrackingValue(input.destination)) {
    payload.destination = input.destination;
  }

  const pageLocation = currentPageLocation();
  if (pageLocation) {
    payload.page_location = pageLocation;
  }

  return payload;
}

export function pushFormAnalyticsEvent(input: FormAnalyticsEvent): void {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push(safePayload(input));
}
