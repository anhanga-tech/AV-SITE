/**
 * WhatsApp Tracking Utility - React Version
 * Captures UTMs, Click IDs (gclid, fbclid, ttclid, wbraid, gbraid), 
 * Microsoft Ads (hsa_*) params, GA4 Client ID and Session ID
 * 
 * IMPORTANT: This module captures UTM params immediately on load and stores them
 * in memory + cookie to ensure they are available even after URL changes.
 */

import { useState, useEffect } from 'react';

const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid', 'msclkid'
];
// Microsoft Ads (hsa_) parameters are captured dynamically - no need to list all
const HSA_PREFIX = 'hsa_';
const COOKIE_NAME = 'tracking_data';
const STORAGE_KEY = 'anhanga_tracking_data';
const WHATSAPP_NUMBER = '551152833309';
// Cookie name for GA4 session (dynamic based on measurement ID suffix)
const GA4_SESSION_COOKIE = '_ga_QDBT5PM4KP';

// In-memory cache for captured tracking data (persists across renders)
let cachedTrackingData: string | null = null;
let hasInitialized = false;

// Helper to set cookie
const setCookie = (name: string, value: string, days: number) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
};

// Helper to get cookie
const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
};

/**
 * Gets the GA4 Client ID from the _ga cookie
 */
const getGA4ClientId = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/_ga=GA1\.\d+\.(\d+\.\d+)/);
    return match ? match[1] : null;
};

/**
 * Gets the GA4 Session ID from the _ga_QDBT5PM4KP cookie
 * Cookie format: "GS1.1.SESSION_ID.COUNT.ENGAGEMENT.TIMESTAMP.0.0.0"
 * The session_id is the third segment (index 2) after splitting by "."
 */
const getGA4SessionId = (): string | null => {
    if (typeof document === 'undefined') return null;

    const cookieValue = getCookie(GA4_SESSION_COOKIE);
    if (!cookieValue) return null;

    // Split the cookie value by "."
    // Format: GS1.1.1700000000.1.1.1700000000.0.0.0
    const parts = cookieValue.split('.');

    // The session ID is typically at index 2 (third segment)
    // Validate that it looks like a timestamp (10+ digits)
    if (parts.length >= 3) {
        const sessionId = parts[2];
        // Verify it's a valid timestamp-like number (10 digits for Unix timestamp)
        if (/^\d{10,}$/.test(sessionId)) {
            return sessionId;
        }
    }

    return null;
};

/**
 * Captures tracking data from URL and stores in memory/cookie.
 * This function runs immediately and stores the result for later use.
 */
const captureTrackingData = (): string | null => {
    if (typeof window === 'undefined') return null;

    const trackingData: Record<string, string> = {};
    let foundInUrl = false;

    // Get the full URL including hash for HashRouter support
    let searchString = window.location.search;

    // If using HashRouter, params might be after the hash
    // Example: /#/?utm_source=... or /?utm_source=...#/
    if (!searchString && window.location.hash.includes('?')) {
        const hashParts = window.location.hash.split('?');
        if (hashParts[1]) {
            searchString = '?' + hashParts[1];
        }
    }

    // Also check if params are before the hash (normal case)
    if (!searchString && window.location.href.includes('?')) {
        const url = new URL(window.location.href);
        searchString = url.search;
    }

    const urlParams = new URLSearchParams(searchString);

    // 0. Try to load from SessionStorage first for internal consistency
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            Object.assign(trackingData, parsed);
        }
    } catch (e) {
        // Fallback silently if sessionStorage is blocked
    }

    // 1. Try URL parameters first
    const msclkid = urlParams.get("msclkid"); if (msclkid) { trackingData["msclkid"] = msclkid; foundInUrl = true; }
    TRACKING_PARAMS.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            // Decode URI component to handle %20 and other encoded chars
            try {
                trackingData[param] = decodeURIComponent(value);
            } catch {
                trackingData[param] = value;
            }
            foundInUrl = true;
        }
    });

    // 2. Capture all Microsoft Ads (hsa_) parameters dynamically
    urlParams.forEach((value, key) => {
        if (key.startsWith(HSA_PREFIX)) {
            try {
                trackingData[key] = decodeURIComponent(value);
            } catch {
                trackingData[key] = value;
            }
            foundInUrl = true;
        }
    });

    // 3. Add GA4 Client ID
    const cid = getGA4ClientId();
    if (cid) {
        trackingData['cid'] = cid;
    }

    // 4. Add GA4 Session ID
    const sid = getGA4SessionId();
    if (sid) {
        trackingData['sid'] = sid;
    }

    if (trackingData.fbclid && !trackingData.fbc) {
        trackingData.fbc = `fb.1.${Date.now()}.${trackingData.fbclid}`;
    }

    if (foundInUrl || cid || sid) {
        // Save to SessionStorage if found in URL or new IDs captured
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trackingData));
        } catch (e) {}

        // Construct string with comma separator for readability
        const dataString = Object.keys(trackingData)
            .map(key => `${key}=${trackingData[key]}`)
            .join(', ');

        // Save to cookie for future persistence (30 days)
        setCookie(COOKIE_NAME, dataString, 30);

        // Cache in memory
        cachedTrackingData = dataString;

        console.log('[WhatsApp Tracking] Captured data:', dataString);

        // Push tracking data to dataLayer for GTM to capture
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: 'tracking_data_captured',
                ...trackingData // Spread the trackingData object into the dataLayer event
            });
            console.log('[WhatsApp Tracking] Pushed to dataLayer:', trackingData);
        }

        return dataString;
    }

    // 5. Fallback to Cookie
    const cookieData = getCookie(COOKIE_NAME);
    if (cookieData) {
        cachedTrackingData = cookieData;
    }

    return cookieData;
};

/**
 * Initialize tracking capture immediately when module loads
 */
const initializeTracking = () => {
    if (hasInitialized) return;
    hasInitialized = true;

    if (typeof window !== 'undefined') {
        // Capture immediately
        captureTrackingData();

        // Also capture on DOMContentLoaded to catch any late URL processing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                captureTrackingData();
            });
        }

        // And on window load as a final fallback
        window.addEventListener('load', () => {
            captureTrackingData();
        });
    }
};

// Run initialization immediately
initializeTracking();

/**
 * Retrieves tracking reference string with all parameters
 * Uses cached data if available, otherwise captures fresh
 * Format: "utm_source=google, gclid=123, cid=456.789, sid=1700000000"
 */
export const getTrackingRef = (): string | null => {
    // Always try to capture fresh data to pick up URL changes in SPA
    return captureTrackingData();
};

/**
 * Generates a WhatsApp URL with the tracking reference appended to the message.
 * Uses " || Dados: " separator for better readability.
 * @param message The message to be sent.
 * @returns The full WhatsApp URL.
 */
export const getWhatsAppLink = (message: string): string => {
    const ref = getTrackingRef();
    let finalMessage = message;

    // Remove any old tracking suffixes to avoid duplication
    finalMessage = finalMessage.split(' || Dados:')[0].split(' [ref:')[0].trim();

    if (ref) {
        finalMessage += ` || Dados: ${ref}`;
    }

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
};

/**
 * React Hook for WhatsApp link that updates after component mounts.
 * This ensures the tracking data is captured even if the initial render
 * happens before window.location is fully processed.
 * 
 * @param message The message to be sent via WhatsApp
 * @returns The WhatsApp URL, which updates after mount if needed
 */
export const useWhatsAppLink = (message: string): string => {
    const [whatsappUrl, setWhatsappUrl] = useState(() => getWhatsAppLink(message));

    useEffect(() => {
        // Re-capture tracking data after mount
        const newUrl = getWhatsAppLink(message);
        if (newUrl !== whatsappUrl) {
            setWhatsappUrl(newUrl);
        }

        // Also update after a short delay to catch any late-loading GA data
        const timer = setTimeout(() => {
            captureTrackingData();
            const updatedUrl = getWhatsAppLink(message);
            setWhatsappUrl(updatedUrl);
        }, 1000);

        return () => clearTimeout(timer);
    }, [message]);

    return whatsappUrl;
};

/**
 * Force re-capture of tracking data.
 * Call this if you need to refresh the tracking info.
 */
export const refreshTrackingData = (): string | null => {
    cachedTrackingData = null;
    return captureTrackingData();
};

