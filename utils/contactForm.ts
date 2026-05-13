export interface ContactModalOptions {
    source?: string;
    destination?: string;
    message?: string;
}

export function openContactModal(options: ContactModalOptions = {}): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: options }));
}
