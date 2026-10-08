import test from 'node:test';
import assert from 'node:assert/strict';
import { handleQuizPrefillRequest, isQuizPrefillRequest } from '../lib/quiz-prefill-redirect.ts';
import { parseQuizPrefill, QUIZ_PREFILL_COOKIE } from '../lib/quiz-prefill-cookie.ts';
import { readCookie } from '../lib/nps-invite-cookie.ts';
import { onRequest } from '../functions/[[path]].ts';

// `/quiz?email=&nome=&sobrenome=&skip=true` pre-fills the quiz from e-mail
// links. Zaraz's automatic Pageview ships the page URL — query included — to
// GA4 before any page code runs, so that PII must never be in the URL of the
// HTML that loads (docs/compliance/transferencias-internacionais.md, 2.2).

const ORIGIN = 'https://www.anhanga.tur.br';
const EMAIL = 'maria.silva@example.com';

function prefillLink(params: Record<string, string>, path = '/quiz'): Request {
    return new Request(`${ORIGIN}${path}?${new URLSearchParams(params).toString()}`);
}

function setCookie(response: Response): string {
    const [cookie] = response.headers.getSetCookie();
    return cookie ?? '';
}

function prefillFrom(response: Response) {
    return parseQuizPrefill(readCookie(setCookie(response).split(';')[0], QUIZ_PREFILL_COOKIE));
}

test('a pre-fill link redirects to a clean /quiz/ with no e-mail or name in the Location', () => {
    const response = handleQuizPrefillRequest(
        prefillLink({ email: EMAIL, nome: 'Maria', sobrenome: 'Silva', skip: 'true' }),
    );

    assert.ok(response);
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('Location'), '/quiz/');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
});

test('the redirect body is empty, so no analytics tag can run on it', async () => {
    const response = handleQuizPrefillRequest(prefillLink({ email: EMAIL }));
    assert.ok(response);
    assert.equal(await response.text(), '');
});

test('the pre-fill moves to a short-lived, SameSite=Strict cookie scoped to /quiz', () => {
    const response = handleQuizPrefillRequest(
        prefillLink({ email: EMAIL, nome: 'Maria', sobrenome: 'Silva', skip: 'true' }),
    );
    assert.ok(response);

    assert.deepEqual(prefillFrom(response), { email: EMAIL, nome: 'Maria', sobrenome: 'Silva', skip: true });
    const attributes = setCookie(response);
    assert.match(attributes, /; Path=\/quiz(;|$)/);
    assert.match(attributes, /; Max-Age=1800(;|$)/);
    assert.match(attributes, /; SameSite=Strict(;|$)/);
    assert.match(attributes, /; Secure(;|$)/);
});

test('the cookie is not Secure on plain-HTTP local dev, where browsers would drop it', () => {
    const response = handleQuizPrefillRequest(new Request(`http://localhost:3000/quiz?email=${EMAIL}`));
    assert.ok(response);
    assert.doesNotMatch(setCookie(response), /Secure/);
});

test('campaign params survive the redirect; only the pre-fill params are removed', () => {
    const response = handleQuizPrefillRequest(
        prefillLink({ utm_source: 'mautic', email: EMAIL, nome: 'Maria', utm_campaign: 'reengajamento' }),
    );
    assert.ok(response);
    assert.equal(response.headers.get('Location'), '/quiz/?utm_source=mautic&utm_campaign=reengajamento');
});

test('skip only holds next to an e-mail, as it did in the URL version', () => {
    const response = handleQuizPrefillRequest(prefillLink({ nome: 'Maria', skip: 'true' }));
    assert.ok(response);
    assert.equal(prefillFrom(response)?.skip, false);
});

test('over-long values are dropped rather than truncated into a wrong address', () => {
    const response = handleQuizPrefillRequest(
        prefillLink({ email: `${'a'.repeat(250)}@example.com`, nome: 'Maria', skip: 'true' }),
    );
    assert.ok(response);
    assert.deepEqual(prefillFrom(response), { email: '', nome: 'Maria', sobrenome: '', skip: false });
});

test('control characters are stripped from the pre-fill values', () => {
    const response = handleQuizPrefillRequest(prefillLink({ nome: 'Ma\u0000ria\r\n', email: EMAIL }));
    assert.ok(response);
    assert.equal(prefillFrom(response)?.nome, 'Maria');
});

test('a link with only empty pre-fill params still lands clean and clears any stale pre-fill', () => {
    const response = handleQuizPrefillRequest(prefillLink({ email: '', skip: 'true' }));
    assert.ok(response);
    assert.equal(response.headers.get('Location'), '/quiz/');
    assert.match(setCookie(response), /^quiz_prefill=; .*Max-Age=0/);
});

test('only GET/HEAD requests to /quiz carrying pre-fill params are intercepted', () => {
    assert.equal(isQuizPrefillRequest(prefillLink({ email: EMAIL })), true);
    assert.equal(isQuizPrefillRequest(prefillLink({ email: EMAIL }, '/quiz/')), true);
    assert.equal(isQuizPrefillRequest(prefillLink({ email: EMAIL }, '/QUIZ')), true);
    assert.equal(isQuizPrefillRequest(prefillLink({ email: EMAIL }, '/quiz/index.html')), true);
    assert.equal(isQuizPrefillRequest(prefillLink({ skip: 'true' })), true);
    assert.equal(isQuizPrefillRequest(new Request(`${ORIGIN}/quiz/`)), false);
    assert.equal(isQuizPrefillRequest(prefillLink({ utm_source: 'email' })), false);
    assert.equal(isQuizPrefillRequest(prefillLink({ email: EMAIL }, '/quizz')), false);
    assert.equal(isQuizPrefillRequest(prefillLink({ email: EMAIL }, '/blog/')), false);
    assert.equal(isQuizPrefillRequest(new Request(`${ORIGIN}/quiz?email=${EMAIL}`, { method: 'POST' })), false);
    assert.equal(isQuizPrefillRequest(new Request(`${ORIGIN}/quiz?email=${EMAIL}`, { method: 'HEAD' })), true);
});

test('the Pages catch-all answers the pre-fill redirect before serving the static /quiz/ HTML', async () => {
    let servedStatic = false;
    const response = await onRequest({
        request: prefillLink({ email: EMAIL, nome: 'Maria' }),
        next: async () => {
            servedStatic = true;
            return new Response('<html></html>');
        },
        env: {},
    });

    assert.equal(servedStatic, false, 'the static HTML (and the Zaraz Pageview it boots) must not be served');
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('Location'), '/quiz/');
});

test('the Pages catch-all still serves /quiz/ untouched when there is nothing to move', async () => {
    let servedStatic = false;
    await onRequest({
        request: new Request(`${ORIGIN}/quiz/?utm_source=instagram`),
        next: async () => {
            servedStatic = true;
            return new Response('<html></html>');
        },
        env: {},
    });
    assert.equal(servedStatic, true);
});
