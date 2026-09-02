/**
 * WhatsApp Tracking Utility - React Version
 * Captures UTMs, Click IDs (gclid, fbclid, ttclid, wbraid, gbraid),
 * Microsoft Ads (hsa_*) params, GA4 Client ID and Session ID
 *
 * IMPORTANT: This module captures tracking params immediately on load and stores them
 * in memory + sessionStorage + cookie to ensure data is available after URL changes.
 */

import { useEffect, useMemo } from 'react';
import { isSafeTrackingValue } from './piiRedaction';

const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid', 'msclkid',
    'ref',
];
// Microsoft Ads (hsa_*) parameters are captured dynamically
const HSA_PREFIX = 'hsa_';
const COOKIE_NAME = 'tracking_data';
const STORAGE_KEY = 'anhanga_tracking_data';
const WHATSAPP_NUMBER = '5511955021519';
// Cookie name for GA4 session (dynamic based on measurement ID suffix)
const GA4_SESSION_COOKIE = '_ga_QDBT5PM4KP';

export type TrackingData = Record<string, string>;

let cachedTrackingObject: TrackingData | null = null;
let hasInitialized = false;

const setCookie = (name: string, value: string, days: number) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};Path=/;SameSite=Lax${secure}`;
};

const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const nameEQ = `${name}=`;
    const chunks = document.cookie.split(';');

    for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (trimmed.startsWith(nameEQ)) {
            return decodeURIComponent(trimmed.slice(nameEQ.length));
        }
    }

    return null;
};

// Cookie próprio (não o _ga do Google) usado como fallback pro client_id do GA4.
// Nada carrega o gtag.js real do Google desde a migração pro Zaraz (Stape/GTM
// removidos) — sem isso, um visitante novo nunca teria o cookie _ga legado e
// ga_client_id ficaria sempre vazio no generate_lead, quebrando a correlação de
// conversão no GA4 (achado de review). Reutiliza o mesmo nome/formato usado em
// public/utm-tracking.js pra não gerar dois IDs diferentes pro mesmo visitante.
const OWN_CID_COOKIE = 'anhanga_ga_cid';

const getOrCreateOwnClientId = (): string => {
    const existing = getCookie(OWN_CID_COOKIE);
    if (existing) return existing;

    const cid = `${Math.floor(Math.random() * 2147483647)}.${Math.floor(Date.now() / 1000)}`;
    setCookie(OWN_CID_COOKIE, cid, 730);
    return cid;
};

const getGA4ClientId = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/_ga=GA1\.\d+\.(\d+\.\d+)/);
    return match ? match[1] : getOrCreateOwnClientId();
};

const getGA4SessionId = (): string | null => {
    if (typeof document === 'undefined') return null;

    const cookieValue = getCookie(GA4_SESSION_COOKIE);
    if (!cookieValue) return null;

    const parts = cookieValue.split('.');
    if (parts.length >= 3) {
        const sessionId = parts[2];
        if (/^\d{10,}$/.test(sessionId)) {
            return sessionId;
        }
    }

    return null;
};

const getFbp = (): string | null => {
    if (typeof document === 'undefined') return null;
    return getCookie('_fbp');
};

function parseTrackingDataString(dataString: string): TrackingData {
    const parsed: TrackingData = {};

    for (const segment of dataString.split(',')) {
        const entry = segment.trim();
        if (!entry) continue;

        const separatorIndex = entry.indexOf('=');
        if (separatorIndex <= 0) continue;

        const key = entry.slice(0, separatorIndex).trim();
        const value = entry.slice(separatorIndex + 1).trim();
        if (key && value) parsed[key] = value;
    }

    return parsed;
}

function serializeTrackingData(data: TrackingData): string {
    return Object.entries(data)
        .flatMap(([key, value]) => key && value ? [`${key}=${value}`] : [])
        .join(', ');
}

function getSearchStringFromLocation(): string {
    if (typeof window === 'undefined') return '';

    let searchString = window.location.search;

    if (!searchString && window.location.hash.includes('?')) {
        const hashParts = window.location.hash.split('?');
        if (hashParts[1]) {
            searchString = `?${hashParts[1]}`;
        }
    }

    if (!searchString && window.location.href.includes('?')) {
        try {
            searchString = new URL(window.location.href).search;
        } catch {
            searchString = '';
        }
    }

    return searchString;
}

// value já vem decodificado de URLSearchParams.get()/forEach() (que aplica um decode
// percent-encoding completo por spec). Rodar decodeURIComponent de novo aqui abria um
// bypass do isSafeTrackingValue acima: um valor duplamente encodado (ex.:
// ?utm_content=%2565mail%2540example.com) passa no check com o texto ainda parcialmente
// encodado ("%65mail%40example.com", sem "@" literal) e só vira e-mail de verdade num
// segundo decode — que rodava aqui, depois do check (achado de review, claude[bot]).
function appendTrackingValue(trackingData: TrackingData, key: string, value: string): void {
    trackingData[key] = value;
}

function isUntrustedTrackingKey(key: string): boolean {
    return TRACKING_PARAMS.includes(key) || key.startsWith(HSA_PREFIX);
}

// cid/sid/fbc/fbp nunca vêm de um parâmetro de URL — são gerados internamente (cookie
// próprio ou API do navegador) e nunca precisam do filtro de PII. Validar essas chaves
// também quebrava fbc: seu formato (fb.1.<timestamp>.<fbclid>) casa em PHONE_PATTERN
// (dígito+ponto+dígitos), então era descartado a cada captura e regenerado com um
// Date.now() novo, perdendo o timestamp do clique original e prejudicando dedup no Meta
// CAPI (achado de review, claude[bot] + chatgpt-codex-connector[bot]).
function mergeRestoredTrackingData(trackingData: TrackingData, parsed: TrackingData): void {
    for (const [key, value] of Object.entries(parsed)) {
        if (isUntrustedTrackingKey(key) && !isSafeTrackingValue(value)) continue;
        trackingData[key] = value;
    }
}

// O cookie de 30 dias (COOKIE_NAME) é a única persistência que sobrevive entre sessões/
// abas — sessionStorage não. Sem isso, um visitante que voltasse numa aba nova (sem UTM
// na URL, sessionStorage vazio) perdia toda a atribuição anterior: como cid agora é
// sempre truthy (getGA4ClientId sempre gera um), captureTrackingDataObject nunca mais
// caía no fallback getCookieTrackingData() e sobrescrevia o cookie só com {cid: ...}
// (achado de review, chatgpt-codex-connector[bot]).
function mergeCookieTrackingData(trackingData: TrackingData): void {
    const cookieData = getCookie(COOKIE_NAME);
    if (!cookieData) return;

    mergeRestoredTrackingData(trackingData, parseTrackingDataString(cookieData));
}

function mergeStoredTrackingData(trackingData: TrackingData): void {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        // public/utm-tracking.js grava na mesma chave (anhanga_tracking_data) sem passar
        // pelo isSafeTrackingValue de mergeUrlTrackingData — reaplicar o filtro aqui, no
        // único ponto onde qualquer origem armazenada converge antes do dataLayer, cobre
        // esse segundo coletor sem duplicar a regra em dois arquivos (achado de review,
        // chatgpt-codex-connector[bot]: "validate on every storage read/write").
        mergeRestoredTrackingData(trackingData, JSON.parse(stored) as TrackingData);
    } catch {
        // Ignore storage failures
    }
}

function mergeUrlTrackingData(trackingData: TrackingData, urlParams: URLSearchParams): boolean {
    // Parâmetros de tracking vêm de uma URL não confiável (qualquer um pode montar um link
    // com ?utm_content=email@exemplo.com) e este objeto é espalhado inteiro num evento
    // dataLayer (tracking_data_captured) que o Zaraz encaminha pro GA4 sem scrubbing de PII
    // (achado de review — o Stape tinha esse scrubber, o Zaraz não tem equivalente
    // conhecido). isSafeTrackingValue rejeita qualquer valor com formato de e-mail/telefone
    // antes de aceitar, independente do nome do parâmetro.
    let foundInUrl = false;

    TRACKING_PARAMS.forEach((param) => {
        const value = urlParams.get(param);
        if (!value || !isSafeTrackingValue(value)) return;

        appendTrackingValue(trackingData, param, value);
        foundInUrl = true;
    });

    urlParams.forEach((value, key) => {
        if (!key.startsWith(HSA_PREFIX) || !isSafeTrackingValue(value)) return;

        appendTrackingValue(trackingData, key, value);
        foundInUrl = true;
    });

    return foundInUrl;
}

function mergeAnalyticsTrackingData(trackingData: TrackingData): { cid: string | null; sid: string | null } {
    const cid = getGA4ClientId();
    if (cid) trackingData.cid = cid;

    const sid = getGA4SessionId();
    if (sid) trackingData.sid = sid;

    if (trackingData.fbclid && !trackingData.fbc) {
        trackingData.fbc = `fb.1.${Date.now()}.${trackingData.fbclid}`;
    }

    const fbp = getFbp();
    if (fbp) trackingData.fbp = fbp;

    return { cid, sid };
}

function persistTrackingData(trackingData: TrackingData): TrackingData | null {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trackingData));
    } catch {
        // Ignore storage failures
    }

    const dataString = serializeTrackingData(trackingData);
    if (!dataString) {
        return Object.keys(trackingData).length > 0 ? { ...trackingData } : null;
    }

    setCookie(COOKIE_NAME, dataString, 30);
    cachedTrackingObject = { ...trackingData };

    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            event: 'tracking_data_captured',
            ...trackingData,
        });
    }

    return Object.keys(trackingData).length > 0 ? { ...trackingData } : null;
}

function getCookieTrackingData(): TrackingData | null {
    const cookieData = getCookie(COOKIE_NAME);
    if (!cookieData) return null;

    cachedTrackingObject = parseTrackingDataString(cookieData);
    return { ...cachedTrackingObject };
}

const captureTrackingDataObject = (): TrackingData | null => {
    if (typeof window === 'undefined') return null;

    const trackingData: TrackingData = {};
    const urlParams = new URLSearchParams(getSearchStringFromLocation());

    mergeCookieTrackingData(trackingData);
    mergeStoredTrackingData(trackingData);
    const foundInUrl = mergeUrlTrackingData(trackingData, urlParams);
    const { cid, sid } = mergeAnalyticsTrackingData(trackingData);

    if (foundInUrl || cid || sid || Object.keys(trackingData).length > 0) {
        return persistTrackingData(trackingData);
    }

    return getCookieTrackingData();
};

const initializeTracking = () => {
    if (hasInitialized) return;
    hasInitialized = true;

    if (typeof window !== 'undefined') {
        captureTrackingDataObject();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                captureTrackingDataObject();
            });
        }

        window.addEventListener('load', () => {
            captureTrackingDataObject();
        });
    }
};

initializeTracking();

export const getTrackingDataObject = (): TrackingData | null => {
    const latest = captureTrackingDataObject();
    if (latest) return latest;

    if (cachedTrackingObject && Object.keys(cachedTrackingObject).length > 0) {
        return { ...cachedTrackingObject };
    }

    return null;
};

// Identifiers (cid/sid/gclid/fbclid) must never ride in the message body: the user would
// send them as WhatsApp content, putting them under Meta's retention instead of the 30-day
// window declared in docs/compliance/ripd-legitimo-interesse.md. The form handlers already
// deliver the same tracking to Odoo via /api/submit-*. The suffix stripping stays as a guard
// for messages persisted before this change.
const buildWhatsAppLink = (message: string): string => {
    const finalMessage = message.split(' || Dados:')[0].split(' [ref:')[0].trim();

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
};

export const getWhatsAppLink = (message: string): string => buildWhatsAppLink(message);

export const useWhatsAppLink = (message: string): string => {
    // The GA4 session cookie (_ga_QDBT5PM4KP) is set by Zaraz slightly after mount, so
    // re-capture ~1s after. The link no longer depends on tracking, but this keeps the
    // cookie/sessionStorage snapshot fresh for the form submissions that carry it to Odoo.
    useEffect(() => {
        const timer = setTimeout(() => {
            captureTrackingDataObject();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return useMemo(() => buildWhatsAppLink(message), [message]);
};
