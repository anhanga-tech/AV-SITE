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
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/;

function currentPageLocation(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const url = new URL(window.location.href);
    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.test(key)) {
        url.searchParams.set(key, 'redacted');
      }
    }
    return url.toString();
  } catch {
    return window.location.href.replace(EMAIL_PATTERN, 'redacted').replace(PHONE_PATTERN, 'redacted');
  }
}

function isSafeDestination(value: string): boolean {
  return !EMAIL_PATTERN.test(value) && !PHONE_PATTERN.test(value);
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

  if (input.destination && isSafeDestination(input.destination)) {
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
