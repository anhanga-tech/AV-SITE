import { expect, test, type Page } from '@playwright/test';

/**
 * Drives the quiz from the hero through the result screen, then verifies the
 * WhatsApp upgrade step actually submits the captured phone number (regression
 * for the discarded-phone bug) and meets the success-state a11y contract.
 */

async function answerSingle(page: Page, name: RegExp) {
    const option = page.getByRole('button', { name });
    await expect(option).toBeVisible();
    await option.click();
}

test.describe('Quiz — captura de WhatsApp no resultado', () => {
    test('envia o telefone digitado e move o foco para o CTA principal', async ({ page }) => {
        const quizBodies: Array<Record<string, unknown>> = [];

        await page.route('**/api/submit-quiz', async route => {
            quizBodies.push(JSON.parse(route.request().postData() || '{}') as Record<string, unknown>);
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, requestId: 'req-quiz-e2e', message: 'ok' }),
            });
        });

        await page.goto('/quiz');

        await page.getByRole('button', { name: /bora começar/i }).click();

        // Q1 (destino) — múltipla escolha, exige "Próxima".
        await page.getByRole('button', { name: /Europa/ }).click();
        await page.getByRole('button', { name: /Próxima/ }).click();

        // Q2–Q6 — escolha única, avançam sozinhas.
        await answerSingle(page, /Aventura & autenticidade/);
        await answerSingle(page, /Só eu/);
        await answerSingle(page, /Multidão/);
        await answerSingle(page, /Dinheiro\./);
        await answerSingle(page, /Semi-planejado/);

        // Tela de lead.
        await expect(page.locator('#quiz-nome')).toBeVisible();
        await page.locator('#quiz-nome').fill('Maria');
        await page.locator('#quiz-sobrenome').fill('Silva');
        await page.locator('#quiz-email').fill('maria@example.com');
        await page.getByRole('button', { name: /revelar meu perfil/i }).click();

        // Tela de resultado — passo de WhatsApp.
        const phoneInput = page.getByLabel(/número de whatsapp/i);
        await expect(phoneInput).toBeVisible();
        await phoneInput.fill('11999999999');
        await page.getByRole('button', { name: /^Enviar$/ }).click();

        // O lead já foi enviado no reveal; o segundo envio carrega o whatsapp.
        await expect
            .poll(() => quizBodies.find((b) => typeof b.whatsapp === 'string' && b.whatsapp.length > 0) ?? null)
            .toMatchObject({ whatsapp: expect.stringContaining('99999') });

        // A11y: anúncio role="status" e foco no CTA seguinte.
        const doneCta = page.getByRole('link', { name: /montar minha viagem/i });
        await expect(page.getByRole('status')).toBeVisible();
        await expect(doneCta).toBeFocused();
    });
});
