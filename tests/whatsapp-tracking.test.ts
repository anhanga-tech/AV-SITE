import test from 'node:test';
import assert from 'node:assert/strict';
import { getWhatsAppLink, getTrackingDataObject } from '../utils/whatsapp.ts';

const WHATSAPP_BASE = 'https://wa.me/5511955021519';

function decodeMessageFrom(url: string): string {
    const part = url.split('?text=')[1];
    return decodeURIComponent(part ?? '');
}

test('getWhatsAppLink returns URL with correct WhatsApp number', () => {
    const url = getWhatsAppLink('Olá');
    assert.ok(url.startsWith(WHATSAPP_BASE + '?text='));
});

test('getWhatsAppLink URL-encodes the message', () => {
    const url = getWhatsAppLink('Olá, quero saber mais!');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Olá, quero saber mais!');
});

test('getWhatsAppLink strips || Dados: suffix from message', () => {
    const url = getWhatsAppLink('Olá || Dados: utm_source=google, utm_medium=cpc');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Olá');
});

test('getWhatsAppLink strips [ref: suffix from message', () => {
    const url = getWhatsAppLink('Mensagem [ref: abc123]');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem');
});

test('getWhatsAppLink strips both suffixes when both are present (priority to || Dados:)', () => {
    const url = getWhatsAppLink('Texto || Dados: x=1 [ref: abc]');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Texto');
});

test('getWhatsAppLink trims trailing whitespace after stripping suffix', () => {
    const url = getWhatsAppLink('Mensagem   ');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem');
});

test('getWhatsAppLink never appends tracking data to the message', () => {
    const url = getWhatsAppLink('Mensagem simples');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem simples');
    assert.ok(!decoded.includes('|| Dados:'));
});

test('getWhatsAppLink with empty message returns URL with empty text', () => {
    const url = getWhatsAppLink('');
    assert.ok(url.startsWith(WHATSAPP_BASE + '?text='));
});

test('getWhatsAppLink handles message with special characters', () => {
    const msg = 'Viagem: São Paulo → Orlando (2 adultos)';
    const url = getWhatsAppLink(msg);
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, msg);
});

test('getTrackingDataObject returns null in Node.js environment (no window)', () => {
    const result = getTrackingDataObject();
    assert.equal(result, null);
});

// Regression: identifiers (cid/sid/gclid/fbclid) used to be appended to the message body, which
// meant the user sent them as WhatsApp content — outside the retention declared in the RIPD.
// They reach Odoo through /api/submit-* instead. This asserts the message stays clean even when
// tracking data is available to capture.
test('getWhatsAppLink omits identifiers even when tracking data is available', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            dataLayer: [],
            location: {
                search: '?utm_source=instagram&gclid=Cj0KTEST',
                hash: '',
                href: 'https://example.com/?utm_source=instagram&gclid=Cj0KTEST',
            },
        },
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { cookie: '_ga=GA1.1.1234567890.1699887766' },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {} },
    });

    try {
        // Proves the fixture is real: this data is captured and does reach the Odoo payloads.
        const tracking = getTrackingDataObject();
        assert.equal(tracking?.gclid, 'Cj0KTEST');

        const decoded = decodeMessageFrom(getWhatsAppLink('Quero planejar uma viagem'));
        assert.equal(decoded, 'Quero planejar uma viagem');
        for (const identifier of ['gclid', 'Cj0KTEST', 'cid', '1234567890', '|| Dados:', '[ref:']) {
            assert.ok(!decoded.includes(identifier), `mensagem não deve conter "${identifier}"`);
        }
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else Reflect.deleteProperty(globalThis, 'window');
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
        else Reflect.deleteProperty(globalThis, 'document');
        if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
        else Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
});

// Regressão (achado de review, chatgpt-codex-connector[bot]): nada carrega o gtag.js real do
// Google desde a migração pro Zaraz (Stape/GTM removidos), então um visitante sem o cookie
// _ga legado nunca teria ga_client_id — quebrando a correlação de conversão no GA4. Confirma
// que getGA4ClientId gera e persiste seu próprio ID quando não existe nenhum _ga.
test('getTrackingDataObject gera um cid próprio quando não existe cookie _ga (visitante novo)', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

    // Jar real (chave -> valor), não uma única string: captureTrackingDataObject grava
    // dois cookies distintos (anhanga_ga_cid e tracking_data) na mesma chamada, e um
    // mock de slot único faz o segundo write sobrescrever o primeiro antes da asserção.
    const cookieJar: Record<string, string> = {};
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            dataLayer: [],
            location: { search: '', hash: '', href: 'https://example.com/' },
        },
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            get cookie() {
                return Object.entries(cookieJar).map(([name, value]) => `${name}=${value}`).join('; ');
            },
            set cookie(value: string) {
                const [pair] = value.split(';');
                const separatorIndex = pair.indexOf('=');
                if (separatorIndex <= 0) return;
                cookieJar[pair.slice(0, separatorIndex)] = pair.slice(separatorIndex + 1);
            },
        },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {} },
    });

    try {
        const tracking = getTrackingDataObject();
        assert.ok(tracking?.cid, 'cid deve ser gerado mesmo sem cookie _ga');
        assert.match(tracking!.cid, /^\d+\.\d+$/, 'cid gerado deve seguir o formato número.timestamp');
        assert.ok('anhanga_ga_cid' in cookieJar, 'o cid gerado deve ser persistido em cookie próprio');
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else Reflect.deleteProperty(globalThis, 'window');
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
        else Reflect.deleteProperty(globalThis, 'document');
        if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
        else Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
});

function withTrackingEnv(
    opts: { search?: string; storedTrackingData?: Record<string, unknown>; cookieData?: string },
    run: (getTracking: () => ReturnType<typeof getTrackingDataObject>) => void,
): void {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

    const search = opts.search ?? '';
    const storedTrackingData = opts.storedTrackingData ?? null;

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            dataLayer: [],
            location: { search, hash: '', href: `https://example.com/${search}` },
        },
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { cookie: opts.cookieData ? `tracking_data=${encodeURIComponent(opts.cookieData)}` : '' },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: {
            getItem: (key: string) =>
                key === 'anhanga_tracking_data' && storedTrackingData ? JSON.stringify(storedTrackingData) : null,
            setItem: () => {},
        },
    });

    try {
        run(getTrackingDataObject);
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else Reflect.deleteProperty(globalThis, 'window');
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
        else Reflect.deleteProperty(globalThis, 'document');
        if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
        else Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
}

// Regressão (achado de review, claude[bot] + chatgpt-codex-connector[bot]): mergeUrlTrackingData
// rejeita utm_*/hsa_* com formato de e-mail/telefone antes deste PR não tinha cobertura própria
// — só a rejeição de identificadores no corpo do WhatsApp era testada, não a rejeição em si.
test('getTrackingDataObject descarta utm_content/hsa_* com formato de e-mail ou telefone', () => {
    withTrackingEnv(
        { search: '?utm_source=google&utm_content=alice%40example.com&hsa_acc=%2B5511999999999' },
        (getTracking) => {
            const tracking = getTracking();
            assert.equal(tracking?.utm_source, 'google', 'parâmetro seguro deve ser mantido');
            assert.equal(tracking?.utm_content, undefined, 'e-mail em utm_content não deve ser capturado');
            assert.equal(tracking?.hsa_acc, undefined, 'telefone em hsa_* não deve ser capturado');
        },
    );
});

// Regressão (achado de review, claude[bot], P1): isSafeTrackingValue rodava sobre o valor
// já decodificado uma vez por URLSearchParams, mas appendDecodedTrackingValue (removida)
// decodificava de novo antes de gravar — um e-mail com duplo encoding passava incólume
// pelo check e só virava e-mail de verdade no segundo decode, depois de já aprovado.
// URLSearchParams já decodifica uma vez; ?utm_content=%2565mail%2540example.com chega em
// urlParams.get() como '%65mail%40example.com' (sem "@" literal, passa no EMAIL_PATTERN).
// O bug era decodificar de novo depois do check; a correção é não decodificar mais — o
// valor gravado fica como o texto ainda parcialmente encodado, nunca vira e-mail de verdade.
test('getTrackingDataObject não decodifica utm_content de novo após o filtro de PII (fecha o bypass de duplo encoding)', () => {
    withTrackingEnv({ search: '?utm_content=%2565mail%2540example.com' }, (getTracking) => {
        const tracking = getTracking();
        assert.equal(tracking?.utm_content, '%65mail%40example.com');
        assert.notEqual(tracking?.utm_content, 'email@example.com', 'não deve virar e-mail de verdade');
    });
});

// Regressão (achado de review, chatgpt-codex-connector[bot], P2): PHONE_PATTERN sozinho casa
// qualquer sequência longa de dígitos, então IDs de campanha e datas puramente numéricos eram
// descartados como se fossem telefone.
test('getTrackingDataObject preserva utm_campaign numérico e datas ISO (não são telefone)', () => {
    withTrackingEnv(
        { search: '?utm_campaign=1234567890&utm_content=2026-09-01' },
        (getTracking) => {
            const tracking = getTracking();
            assert.equal(tracking?.utm_campaign, '1234567890', 'ID numérico de campanha não deve ser descartado');
            assert.equal(tracking?.utm_content, '2026-09-01', 'data ISO não deve ser descartada como telefone');
        },
    );
});

// Regressão (achado de review, chatgpt-codex-connector[bot], P1): public/utm-tracking.js grava
// na mesma sessionStorage key (anhanga_tracking_data) sem aplicar isSafeTrackingValue — um
// segundo coletor que bypassa o filtro adicionado a mergeUrlTrackingData. mergeStoredTrackingData
// precisa revalidar no momento da leitura, já que não dá pra garantir que todo escritor filtre.
test('getTrackingDataObject revalida PII vinda de sessionStorage (segundo coletor sem filtro)', () => {
    withTrackingEnv(
        { storedTrackingData: { utm_source: 'google', utm_content: 'alice@example.com' } },
        (getTracking) => {
            const tracking = getTracking();
            assert.equal(tracking?.utm_source, 'google', 'valor seguro vindo do storage deve ser mantido');
            assert.equal(
                tracking?.utm_content,
                undefined,
                'e-mail gravado no storage por outro coletor deve ser descartado na leitura',
            );
        },
    );
});

test('getTrackingDataObject ignora valores não textuais vindos de sessionStorage', () => {
    withTrackingEnv(
        { storedTrackingData: { utm_source: 123, cid: null, utm_campaign: 'promo' } },
        (getTracking) => {
            const tracking = getTracking();
            assert.equal(tracking?.utm_source, undefined);
            assert.match(tracking?.cid ?? '', /^\d+\.\d+$/, 'cid inválido no storage deve ser substituído por um cid próprio');
            assert.equal(tracking?.utm_campaign, 'promo');
        },
    );
});

// Regressão (achado de review, ambos os bots, P1/P2 — bug introduzido pelo fix acima): o fbc
// (fb.1.<timestamp>.<fbclid>) restaurado do storage batia em PHONE_PATTERN (dígito+ponto+dígitos)
// e era descartado a cada captura, sendo regenerado com Date.now() novo — perdendo o timestamp
// do clique original e prejudicando dedup no Meta CAPI. cid/sid/fbc/fbp não vêm de URL e não
// devem passar pelo filtro de PII (só utm_*/hsa_* vêm de input não confiável).
test('getTrackingDataObject preserva fbc vindo do storage (não é PII, não deve ser revalidado como telefone)', () => {
    const storedFbc = 'fb.1.1735689600000.IwAR_test_fbclid_value';
    withTrackingEnv(
        { storedTrackingData: { fbclid: 'IwAR_test_fbclid_value', fbc: storedFbc } },
        (getTracking) => {
            const tracking = getTracking();
            assert.equal(tracking?.fbc, storedFbc, 'fbc restaurado do storage não deve ser descartado nem regenerado');
        },
    );
});

// Regressão (achado de review, chatgpt-codex-connector[bot] P1 + claude[bot] P2): exigir "+"/
// separador fechou o falso positivo de IDs numéricos, mas abriu um falso negativo — um celular
// brasileiro digitado sem formatação (11 dígitos, DDD válido, prefixo "9") passava incólume.
test('getTrackingDataObject descarta celular brasileiro sem formatação (11 dígitos, DDD + prefixo 9)', () => {
    withTrackingEnv({ search: '?utm_content=11987654321' }, (getTracking) => {
        const tracking = getTracking();
        assert.equal(tracking?.utm_content, undefined, 'celular sem formatação deve ser descartado como telefone');
    });
});

// Guarda de regressão: a heurística de celular brasileiro (DDD 11-99 + terceiro dígito "9") não
// pode voltar a derrubar o ID de 11 dígitos real do próprio projeto (AW-17331979537 sem o
// prefixo "AW-" tem terceiro dígito "3", não "9").
test('getTrackingDataObject preserva ID de conversão de 11 dígitos que não tem formato de celular', () => {
    withTrackingEnv({ search: '?utm_content=17331979537' }, (getTracking) => {
        const tracking = getTracking();
        assert.equal(tracking?.utm_content, '17331979537', 'ID de 11 dígitos sem terceiro dígito 9 não é celular');
    });
});

// Regressão (achado de review, chatgpt-codex-connector[bot], P2 — bug introduzido pelo fix de
// ga_client_id): como cid agora é sempre truthy, captureTrackingDataObject nunca mais caía no
// fallback getCookieTrackingData() — um visitante que voltasse numa aba nova (sessionStorage
// vazio, sem UTM na URL) tinha o cookie de 30 dias sobrescrito só com {cid}, perdendo toda a
// atribuição anterior. mergeCookieTrackingData precisa restaurar o cookie antes desse ponto.
test('getTrackingDataObject preserva atribuição do cookie de 30 dias numa aba nova (sessionStorage vazio)', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

    let cookieJar = 'tracking_data=utm_source%3Dgoogle%2C%20utm_campaign%3Dpromo';
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { dataLayer: [], location: { search: '', hash: '', href: 'https://example.com/' } },
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
            get cookie() { return cookieJar; },
            set cookie(value: string) {
                const [pair] = value.split(';');
                const separatorIndex = pair.indexOf('=');
                if (separatorIndex <= 0) return;
                const name = pair.slice(0, separatorIndex);
                const rest = cookieJar.split('; ').filter((c) => c && !c.startsWith(`${name}=`));
                rest.push(pair);
                cookieJar = rest.join('; ');
            },
        },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {} },
    });

    try {
        const tracking = getTrackingDataObject();
        assert.equal(tracking?.utm_source, 'google', 'atribuição do cookie de 30 dias deve sobreviver numa aba nova');
        assert.equal(tracking?.utm_campaign, 'promo', 'atribuição do cookie de 30 dias deve sobreviver numa aba nova');
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else Reflect.deleteProperty(globalThis, 'window');
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
        else Reflect.deleteProperty(globalThis, 'document');
        if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
        else Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
});

// Regressão (achado de review, chatgpt-codex-connector[bot], P2): o formato legado
// separado por vírgulas truncava valores válidos como "summer,retargeting" e podia
// interpretar trechos do valor como novos campos. O formato JSON precisa preservar
// esses valores sem perder compatibilidade com o cookie legado testado acima.
test('getTrackingDataObject preserva vírgulas em valores do cookie de atribuição', () => {
    withTrackingEnv(
        { cookieData: JSON.stringify({ utm_source: 'google', utm_campaign: 'summer,retargeting' }) },
        (getTracking) => {
            const tracking = getTracking();
            assert.equal(tracking?.utm_source, 'google');
            assert.equal(tracking?.utm_campaign, 'summer,retargeting');
        },
    );
});
