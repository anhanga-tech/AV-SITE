import type { Page } from '@playwright/test';

const REGISTERED_META = {
    choice: 'marketing',
    timestamp: '2026-10-13T12:00:00.000Z',
    version: '1',
    registered: true,
    eventId: 'ads_e2e_registered_01',
    subjectKey: 'anon:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    noticeVersion: '2026-10-13',
    purpose: 'ads_measurement',
    origin: 'cookie_banner',
};

/**
 * Recibo de medição antes do primeiro script da página. Sem ele, o inline de
 * index.html tira UTM/click ID da URL e o formulário envia esses campos nulos.
 */
export async function seedRegisteredAdsConsent(page: Page): Promise<void> {
    await page.addInitScript((meta) => {
        localStorage.setItem('anhanga_cookie_consent', 'marketing');
        localStorage.setItem('anhanga_cookie_consent_meta', JSON.stringify(meta));
    }, REGISTERED_META);
}
