import { expect, test, type Request } from '@playwright/test';

// The invite link is `/nps?token=…`. The token is a bearer credential and
// reversible PII, so the edge (lib/nps-invite-redirect.ts, mirrored by the
// Vite dev plugin) must swap it for cookies and land on a clean /nps/?i=<ref>
// before any analytics tag sees the URL — issue #1666.
const FAKE_TOKEN = 'fake-signed-token';

function leaksInvite(request: Request): boolean {
  const url = request.url();
  const referer = request.headers().referer ?? '';
  const body = request.postData() ?? '';
  return [url, referer, body].some((value) => value.includes(FAKE_TOKEN) || value.includes('firstname=Ana'));
}

test.describe('NPS form', () => {
  test('shows an invalid-link state and never renders the form without an invite', async ({ page }) => {
    let submitCalls = 0;
    await page.route('**/api/submit-nps', route => {
      submitCalls += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/nps?firstname=Ana');

    await expect(page).toHaveURL(/\/nps\/$/);
    await expect(page.getByText('Link inválido')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Enviar avaliação$/i })).toHaveCount(0);
    expect(submitCalls).toBe(0);
  });

  test('takes the token off the URL, then submits it only as a cookie', async ({ page }) => {
    const leaking: string[] = [];
    let mainDocumentRequests = 0;
    page.on('request', request => {
      if (request.isNavigationRequest() && mainDocumentRequests++ === 0) return; // the invite link itself
      if (leaksInvite(request)) leaking.push(request.url());
    });

    let submittedBody: Record<string, unknown> | undefined;
    let submittedCookie = '';
    await page.route('**/api/submit-nps', async route => {
      submittedBody = JSON.parse(route.request().postData() ?? '{}');
      submittedCookie = (await route.request().allHeaders()).cookie ?? '';
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'test-request-id', message: 'Avaliação registrada com sucesso.' }),
      });
    });

    await page.goto(`/nps?firstname=Ana&token=${FAKE_TOKEN}`);

    // The clean URL carries only the random tab ref that names this invite's cookies.
    await expect(page).toHaveURL(/\/nps\/\?i=[a-f0-9]{32}$/);
    expect(page.url()).not.toContain(FAKE_TOKEN);
    const tabRef = new URL(page.url()).searchParams.get('i');
    await expect(page.locator('#nps-firstname')).toHaveCount(0);
    await expect(page.locator('#nps-email')).toHaveCount(0);
    // The dev server has no NPS_INVITE_SECRET to verify the fake token, so there
    // is no verified name — and the `firstname` param is never trusted for it.
    await expect(page.getByRole('heading', { name: 'Olá!' })).toBeVisible();

    await page.getByRole('button', { name: /^Nota 10/ }).click();
    await page.getByRole('button', { name: /^Enviar avaliação$/i }).click();

    await expect(page.getByText(/Enviar avaliação/i)).toHaveCount(0);
    expect(submittedCookie).toContain(`nps_invite_${tabRef}=${FAKE_TOKEN}`);
    expect(submittedBody?.inviteRef).toBe(tabRef);
    expect(submittedBody?.score).toBe(10);
    expect(submittedBody).not.toHaveProperty('token');
    expect(submittedBody).not.toHaveProperty('firstname');
    expect(submittedBody).not.toHaveProperty('email');

    const pageCookies = await page.evaluate(() => document.cookie);
    expect(pageCookies).not.toContain(FAKE_TOKEN);
    expect(leaking).toEqual([]);
  });
});
