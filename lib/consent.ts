import { ADS_NOTICE_VERSION } from './consent-notices';

const CHOICE_KEY = 'anhanga_cookie_consent';
const META_KEY = 'anhanga_cookie_consent_meta';
const SUBJECT_KEY = 'anhanga_consent_subject';
const SCHEMA_VERSION = '1';

export type ConsentChoice = 'marketing' | 'essential';

export interface ConsentMeta {
  choice: ConsentChoice;
  timestamp: string;
  version: string;
  registered?: boolean;
  eventId?: string | null;
  subjectKey?: string | null;
  noticeVersion?: string;
  purpose?: string;
  origin?: string;
}

export interface AdsConsentReceipt {
  eventId: string;
  subjectKey: string;
}

export function getConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CHOICE_KEY);
    return v === 'marketing' || v === 'essential' ? v : null;
  } catch {
    return null;
  }
}

export function readConsentMeta(): ConsentMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentMeta;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Medição publicitária só vale com recibo do ledger, não com a escolha local sozinha. */
export function hasRegisteredAdsConsent(): boolean {
  const meta = readConsentMeta();
  return getConsent() === 'marketing' && meta?.registered === true && Boolean(meta.eventId) && Boolean(meta.subjectKey);
}

export function readAdsConsentReceipt(): AdsConsentReceipt | null {
  if (!hasRegisteredAdsConsent()) return null;
  const meta = readConsentMeta();
  if (!meta?.eventId || !meta.subjectKey) return null;
  return { eventId: meta.eventId, subjectKey: meta.subjectKey };
}

export function getOrCreateConsentSubject(): string {
  try {
    const existing = localStorage.getItem(SUBJECT_KEY);
    if (existing && /^anon:[0-9a-f-]{36}$/i.test(existing)) return existing;
    const created = `anon:${crypto.randomUUID()}`;
    localStorage.setItem(SUBJECT_KEY, created);
    return created;
  } catch {
    return `anon:${crypto.randomUUID()}`;
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    const previous = localStorage.getItem(CHOICE_KEY);
    const previousMeta = readConsentMeta();
    // Reaceitar marketing (Gerenciar cookies → Aceitar) não pode apagar um
    // recibo que o ledger já confirmou. O POST novo ainda corre; se falhar,
    // a medição continua com a prova anterior.
    if (
      choice === 'marketing'
      && previous === 'marketing'
      && previousMeta?.registered === true
      && previousMeta.eventId
      && previousMeta.subjectKey
    ) {
      return;
    }
    localStorage.setItem(CHOICE_KEY, choice);
    const meta: ConsentMeta = {
      choice,
      timestamp: new Date().toISOString(),
      version: SCHEMA_VERSION,
      registered: false,
      purpose: choice === 'marketing' ? 'ads_measurement' : 'essential',
      origin: 'cookie_banner',
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    // O evento que libera Zaraz e a captura de click IDs só sai depois do
    // recibo do servidor (markConsentRegistered). Sem isso o aceite local
    // disparava marketing antes de existir prova.
    if (choice === 'essential' && previous === 'marketing') {
      dispatch(new Event('anhanga:revoke-consent'));
    }
  } catch {
    // localStorage indisponível (modo privado, storage cheio)
  }
}

export function markConsentRegistered(receipt: AdsConsentReceipt): void {
  try {
    const meta: ConsentMeta = {
      choice: 'marketing',
      timestamp: new Date().toISOString(),
      version: SCHEMA_VERSION,
      registered: true,
      eventId: receipt.eventId,
      subjectKey: receipt.subjectKey,
      noticeVersion: ADS_NOTICE_VERSION,
      purpose: 'ads_measurement',
      origin: 'cookie_banner',
    };
    localStorage.setItem(CHOICE_KEY, 'marketing');
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    dispatch(new CustomEvent('anhanga:marketing-consent'));
  } catch {
    // sem storage não há recibo local — o servidor pode ter gravado, mas este
    // navegador não consegue provar a escolha na próxima visita.
  }
}

export function clearUnregisteredMarketing(): void {
  try {
    if (hasRegisteredAdsConsent()) return;
    localStorage.removeItem(CHOICE_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    // storage indisponível
  }
}

export function triggerResetBanner(): void {
  // NÃO toca o localStorage — preserva valor anterior para detecção de transição em setConsent()
  // O rodapé é pré-renderizado e clicável antes da hidratação: se o listener de reset do
  // CookieConsentBanner ainda não montou, o clique se perderia. Bufferiza e drena na montagem
  // via registerConsentBannerListener().
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
