import { expect, test, type Page } from '@playwright/test';

/**
 * Regression for #975: rapid double clicks on "Revelar meu perfil" must not
 * fire two lead submissions to /api/submit-quiz (which would create duplicate
 * leads in the CRM). Protected by the disabled submit button plus a synchronous
 * re-entrancy guard in the quiz orchestrator.
 */

async function answerSingle(page: Page, name: RegExp) {
    const option = page.getByRole('button', { name });
    await expect(option).toBeVisible();
    await option.click();
}

test.describe('Quiz — proteção contra duplo envio do lead', () => {
    test('dois cliques rápidos em "Revelar meu perfil" disparam apenas um envio inicial', async ({ page }) => {
        const initialSubmits: Array<Record<string, unknown>> = [];

        await page.route('**/api/submit-quiz', async route => {
            const body = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;
            // The reveal submit carries no whatsapp; the later enrichment submit does.
            if (typeof body.whatsapp !== 'string' || body.whatsapp.length === 0) {
                initialSubmits.push(body);
            }
            // Hold the request open to widen the in-flight window the guard covers.
            await new Promise(resolve => setTimeout(resolve, 400));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, requestId: 'req-quiz-dup-e2e', message: 'ok' }),
            });
        });

        // Salesforce mirror is fire-and-forget; stub it so it never errors in CI.
        await page.route('**/api/submit-lead-sf', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true }),
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

        // Dispara dois cliques no mesmo tick, antes de qualquer re-render do React.
        await page.evaluate(() => {
            const btn = document.querySelector<HTMLButtonElement>(
                'form.quiz-lead-form button[type="submit"]',
            );
            btn?.click();
            btn?.click();
        });

        // Avança para o resultado (passo de WhatsApp), confirmando que o fluxo seguiu.
        await expect(page.getByLabel(/número de whatsapp/i)).toBeVisible();

        // Mesmo com o duplo clique, só um envio inicial (sem whatsapp) pode ocorrer.
        await expect.poll(() => initialSubmits.length).toBe(1);
    });
});
