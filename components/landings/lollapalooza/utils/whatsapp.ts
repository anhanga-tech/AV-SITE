import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from '../constants';
import { getGAClientId } from '../hooks/useGAClientId';

const COOKIE_NAME = 'anhanga_tracking_data';
const COOKIE_EXPIRY_DAYS = 30;

interface TrackingData {
    // UTM Parameters
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    // Google Ads
    gclid?: string;
    // Google iOS Privacy Parameters
    wbraid?: string; // Web to App conversions (iOS)
    gbraid?: string; // Google Ads conversions (iOS)
    // Facebook/Meta
    fbclid?: string;
    fbc?: string;
    // TikTok
    ttclid?: string;
    // Google Analytics Client ID
    cid?: string;
    timestamp: number;
}

/**
 * Gets a cookie by name
 */
function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * Sets a cookie
 */
function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

/**
 * Captures UTM parameters and GCLID from the URL and persists them in a cookie.
 */
export function captureTrackingData() {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const newData: Partial<TrackingData> = {};

    const trackableParams: (keyof Omit<TrackingData, 'timestamp'>)[] = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'gclid', 'wbraid', 'gbraid', 'fbclid', 'ttclid'
    ];

    let hasNewData = false;
    trackableParams.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            newData[param] = value;
            hasNewData = true;
        }
    });

    if (hasNewData) {
        const existingDataRaw = getCookie(COOKIE_NAME);
        let finalData: TrackingData;
        let existingData: TrackingData | null = null;

        if (existingDataRaw) {
            try {
                existingData = JSON.parse(existingDataRaw) as TrackingData;
            } catch (e) { }
        }

        // Handle transformation of fbclid to fbc
        if (newData.fbclid) {
            // Only create if fbc doesn't exist to preserve creationTime
            if (!existingData || !existingData.fbc) {
                newData.fbc = `fb.1.${Date.now()}.${newData.fbclid}`;
            }
        }

        if (existingData) {
            finalData = { ...existingData, ...newData, timestamp: Date.now() };
        } else {
            finalData = { ...newData, timestamp: Date.now() } as TrackingData;
        }

        setCookie(COOKIE_NAME, JSON.stringify(finalData), COOKIE_EXPIRY_DAYS);
    }
}

/**
 * Gets the stored tracking data from the cookie.
 */
export function getStoredTrackingData(): TrackingData | null {
    if (typeof window === 'undefined') return null;

    const dataRaw = getCookie(COOKIE_NAME);
    if (!dataRaw) return null;

    try {
        return JSON.parse(dataRaw) as TrackingData;
    } catch (e) {
        return null;
    }
}

/**
 * Generates a WhatsApp link with tracking reference suffix.
 * Automatically includes GA4 Client ID if available.
 * @param customMessage Optional message to override default
 */
export function getWhatsAppLink(customMessage?: string): string {
    const message = customMessage || WHATSAPP_MESSAGE;
    const trackingData = getStoredTrackingData();

    // Captura o Client ID do GA4 em tempo real
    const gaClientId = getGAClientId();

    // Cria um objeto combinado com os dados de tracking e o Client ID
    const allTrackingData: Record<string, string> = {};

    // Adiciona os dados do cookie
    if (trackingData) {
        Object.entries(trackingData).forEach(([key, value]) => {
            if (key !== 'timestamp' && key !== 'fbclid' && value) {
                allTrackingData[key] = String(value);
            }
        });
    }

    // Adiciona o Client ID do GA4 (sobrescreve se já existir no cookie)
    if (gaClientId) {
        allTrackingData.cid = gaClientId;
    }

    let refSuffix = '';
    if (Object.keys(allTrackingData).length > 0) {
        const params = Object.entries(allTrackingData)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        if (params) {
            refSuffix = ` [ref:${params}]`;
        }
    }

    const finalMessage = `${message}${refSuffix}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
}
