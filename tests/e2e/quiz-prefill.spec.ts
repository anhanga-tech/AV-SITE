import { expect, test, type Page, type Request } from '@playwright/test';

// E-mail links pre-fill the quiz with `/quiz?email=&nome=&sobrenome=&skip=true`.
// Zaraz's automatic Pageview ships the page URL to GA4 before any page code
// runs, so the edge (lib/quiz-prefill-redirect.ts, mirrored by the Vite dev
// plugin) must move that PII into a cookie and land on a clean /quiz/ first.
const EMAIL = 'zuleica.quintanilha@example.com';
const NOME = 'Zuleica';
const SOBRENOME = 'Quintanilha';
const PII = [EMAIL, encodeURIComponent(EMAIL), NOME, SOBRENOME];

function prefillLink(extra: Record<string, string> = {}): string {
    const params = new URLSearchParams({ utm_source: 'mautic', email: EMAIL, nome: NOME, sobrenome: SOBRENOME, ...extra });
    return `/quiz?${params.toString()}`;
}

function isQuizSubmit(request: Request): boolean {
    return new URL(request.url()).pathname === '/api/submit-quiz';
}

/** URL, Referer and body of every request after the landing — except the first-party submit body, which must carry the e-mail. */
function leaksPrefill(request: Request): boolean {
    const values = [request.url(), request.headers().referer ?? ''];
    if (!isQuizSubmit(request)) values.push(request.postData() ?? '');
    return values.some((value) => PII.some((pii) => value.includes(pii)));
}

function watchForLeaks(page: Page): string[] {
    const leaking: string[] = [];
    let mainDocumentRequests = 0;
    page.on('request', (request) => {
        if (request.isNavigationRequest() && mainDocumentRequests++ === 0) return; // the e-mail link itself
        if (leaksPrefill(request)) leaking.push(request.url());
    });
    return leaking;
}

async function answerAllQuestions(page: Page) {
    await page.getByRole('button', { name: /bora começar/i }).click();
    await page.getByRole('button', { name: /Europa/ }).click();
    await page.getByRole('button', { name: /Próxima/ }).click();
    for (const option of [/Aventura & autenticidade/, /Só eu/, /Multidão/, /Dinheiro\./, /Semi-planejado/]) {
        await page.getByRole('button', { name: option }).click();
    }
}

test.describe('Quiz — pré-preenchimento por link de e-mail', () => {
    test('tira e-mail e nome da URL e ainda pré-preenche o formulário', async ({ page }) => {
        const leaking = watchForLeaks(page);

        await page.goto(prefillLink());

        await expect(page).toHaveURL(/\/quiz\/\?utm_source=mautic$/);
        // The page read the cookie and deleted it.
        await expect.poll(() => page.evaluate(() => document.cookie)).not.toContain('quiz_prefill');

        await answerAllQuestions(page);

        await expect(page.locator('#quiz-nome')).toHaveValue(NOME);
        await expect(page.locator('#quiz-email')).toHaveValue(EMAIL);
        expect(leaking).toEqual([]);
    });

    test('com skip=true, pula o formulário e envia o lead sem a PII passar por outra requisição', async ({ page }) => {
        const leaking = watchForLeaks(page);

        let submitted: Record<string, unknown> | undefined;
        await page.route('**/api/submit-quiz', async (route) => {
            submitted ??= JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true, requestId: 'req-quiz-prefill-e2e', message: 'ok' }),
            });
        });

        await page.goto(prefillLink({ skip: 'true' }));
        await expect(page).toHaveURL(/\/quiz\/\?utm_source=mautic$/);

        await answerAllQuestions(page);

        await expect(page.locator('#quiz-nome')).toHaveCount(0);
        await expect(page.getByLabel(/número de whatsapp/i)).toBeVisible();
        await expect.poll(() => submitted).toBeDefined();
        expect(submitted).toMatchObject({ email: EMAIL, firstName: NOME, lastName: SOBRENOME, skipped: true });
        expect(leaking).toEqual([]);
    });
});
