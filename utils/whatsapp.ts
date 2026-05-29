/**
 * WhatsApp Tracking Utility - React Version
 * Captures UTMs, Click IDs (gclid, fbclid, ttclid, wbraid, gbraid),
 * Microsoft Ads (hsa_*) params, GA4 Client ID and Session ID
 *
 * IMPORTANT: This module captures tracking params immediately on load and stores them
 * in memory + sessionStorage + cookie to ensure data is available after URL changes.
 */

import { useState, useEffect } from 'react';

const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid', 'msclkid'
];
// Microsoft Ads (hsa_*) parameters are captured dynamically
const HSA_PREFIX = 'hsa_';
const COOKIE_NAME = 'tracking_data';
const STORAGE_KEY = 'anhanga_tracking_data';
const WHATSAPP_NUMBER = '551152833309';
// Cookie name for GA4 session (dynamic based on measurement ID suffix)
const GA4_SESSION_COOKIE = '_ga_QDBT5PM4KP';

export interface WhatsAppLinkOptions {
    appendTrackingRef?: boolean;
}

export type TrackingData = Record<string, string>;

let cachedTrackingData: string | null = null;
let cachedTrackingObject: TrackingData | null = null;
let hasInitialized = false;

const setCookie = (name: string, value: string, days: number) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
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

const getGA4ClientId = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/_ga=GA1\.\d+\.(\d+\.\d+)/);
    return match ? match[1] : null;
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

function appendDecodedTrackingValue(trackingData: TrackingData, key: string, value: string): void {
    try {
        trackingData[key] = decodeURIComponent(value);
    } catch {
        trackingData[key] = value;
    }
}

function mergeStoredTrackingData(trackingData: TrackingData): void {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored) as TrackingData;
        Object.assign(trackingData, parsed);
    } catch {
        // Ignore storage failures
    }
}

function mergeUrlTrackingData(trackingData: TrackingData, urlParams: URLSearchParams): boolean {
    let foundInUrl = false;

    TRACKING_PARAMS.forEach((param) => {
        const value = urlParams.get(param);
        if (!value) return;

        appendDecodedTrackingValue(trackingData, param, value);
        foundInUrl = true;
    });

    urlParams.forEach((value, key) => {
        if (!key.startsWith(HSA_PREFIX)) return;

        appendDecodedTrackingValue(trackingData, key, value);
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
    cachedTrackingData = dataString;
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

    cachedTrackingData = cookieData;
    cachedTrackingObject = parseTrackingDataString(cookieData);
    return { ...cachedTrackingObject };
}

const captureTrackingDataObject = (): TrackingData | null => {
    if (typeof window === 'undefined') return null;

    const trackingData: TrackingData = {};
    const urlParams = new URLSearchParams(getSearchStringFromLocation());

    mergeStoredTrackingData(trackingData);
    const foundInUrl = mergeUrlTrackingData(trackingData, urlParams);
    const { cid, sid } = mergeAnalyticsTrackingData(trackingData);

    if (foundInUrl || cid || sid || Object.keys(trackingData).length > 0) {
        return persistTrackingData(trackingData);
    }

    return getCookieTrackingData();
};

const captureTrackingData = (): string | null => {
    const objectData = captureTrackingDataObject();
    if (!objectData) return null;

    const serialized = serializeTrackingData(objectData);
    cachedTrackingData = serialized || null;
    return cachedTrackingData;
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

const getTrackingRef = (): string | null => {
    const tracking = getTrackingDataObject();
    if (!tracking) return null;

    const serialized = serializeTrackingData(tracking);
    return serialized.length > 0 ? serialized : null;
};

export const getWhatsAppLink = (message: string, options: WhatsAppLinkOptions = {}): string => {
    const { appendTrackingRef = false } = options;
    const ref = appendTrackingRef ? getTrackingRef() : null;

    let finalMessage = message;
    finalMessage = finalMessage.split(' || Dados:')[0].split(' [ref:')[0].trim();

    if (appendTrackingRef && ref) {
        finalMessage += ` || Dados: ${ref}`;
    }

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
};

export const useWhatsAppLink = (message: string, options: WhatsAppLinkOptions = {}): string => {
    const { appendTrackingRef } = options;
    const [whatsappUrl, setWhatsappUrl] = useState(() => getWhatsAppLink(message, { appendTrackingRef }));

    useEffect(() => {
        const newUrl = getWhatsAppLink(message, { appendTrackingRef });
        setWhatsappUrl((prev) => (prev === newUrl ? prev : newUrl));

        const timer = setTimeout(() => {
            captureTrackingDataObject();
            const updatedUrl = getWhatsAppLink(message, { appendTrackingRef });
            setWhatsappUrl((prev) => (prev === updatedUrl ? prev : updatedUrl));
        }, 1000);

        return () => clearTimeout(timer);
    }, [message, appendTrackingRef]);

    return whatsappUrl;
};

