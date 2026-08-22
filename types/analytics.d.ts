declare global {
    interface Window {
        dataLayer?: Array<Record<string, unknown>>;
        /** Queue stub definido no index.html; o script t.js do Traks substitui depois. */
        traks?: (...args: unknown[]) => void;
    }
}

export {};
