const CHOICE_KEY = 'anhanga_cookie_consent';
const META_KEY = 'anhanga_cookie_consent_meta';
const SCHEMA_VERSION = '1';

export type ConsentChoice = 'marketing' | 'essential';

export function getConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CHOICE_KEY);
    return v === 'marketing' || v === 'essential' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    const previous = localStorage.getItem(CHOICE_KEY);
    localStorage.setItem(CHOICE_KEY, choice);
    localStorage.setItem(
      META_KEY,
      JSON.stringify({ choice, timestamp: new Date().toISOString(), version: SCHEMA_VERSION })
    );
    if (choice === 'marketing') {
      dispatch(new CustomEvent('anhanga:marketing-consent'));
    } else if (previous === 'marketing') {
      dispatch(new Event('anhanga:revoke-consent'));
    }
  } catch {
    // localStorage indisponível (modo privado, storage cheio)
  }
}

export function triggerResetBanner(): void {
  // NÃO toca o localStorage — preserva valor anterior para detecção de transição em setConsent()
  // O CookieConsentBanner é lazy() (App.tsx): se o listener de reset ainda não montou (chunk
  // baixando), o clique do footer se perderia. Bufferiza e drena na montagem via
  // registerConsentBannerListener().
  if (!consentBannerListenerRegistered) {
    bufferedResetBanner = true;
    return;
  }
  dispatch(new Event('anhanga:reset-consent'));
}

let consentBannerListenerRegistered = false;
let bufferedResetBanner = false;

export function registerConsentBannerListener(): void {
  consentBannerListenerRegistered = true;
  if (bufferedResetBanner) {
    bufferedResetBanner = false;
    dispatch(new Event('anhanga:reset-consent'));
  }
}

// Apenas para testes (tests/consent.test.ts): reseta o estado de módulo entre testes.
export function _resetConsentListenerStateForTests(): void {
  consentBannerListenerRegistered = false;
  bufferedResetBanner = false;
}

function dispatch(event: Event): void {
  if (typeof window !== 'undefined') window.dispatchEvent(event);
  else if (typeof globalThis.dispatchEvent === 'function') globalThis.dispatchEvent(event);
}
