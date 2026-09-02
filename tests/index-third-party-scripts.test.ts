import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const utmTrackingPath = path.resolve(process.cwd(), 'public/utm-tracking.js');
const utmTrackingScript = fs.readFileSync(utmTrackingPath, 'utf8');
const designSystemCssPath = path.resolve(process.cwd(), 'docs/design/brand-system', 'colors_and_type.css');
assert.ok(fs.existsSync(designSystemCssPath), 'design system colors_and_type.css should exist at docs/design/brand-system');

const designSystemCss = fs.readFileSync(designSystemCssPath, 'utf8');

function getHeadHtml(html: string): string {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  assert.ok(match, 'index.html should include a head section');
  return match[1];
}

test('index.html keeps GTM out of the render-critical head path', () => {
  const headHtml = getHeadHtml(indexHtml);

  assert.doesNotMatch(headHtml, /googletagmanager\.com\/gtm\.js/i);
  assert.doesNotMatch(headHtml, /GTM-T2KGS86G/i);
});

test('index.html não tem iframe noscript do GTM (furava o Consent Mode)', () => {
  // O <noscript> do GTM carregava tags sem os defaults do Consent Mode (setados
  // via JS) — único caminho que disparava rastreamento sem sinal de consentimento.
  // Removido na auditoria LGPD de jul/2026; a SPA não renderiza sem JS, então o
  // iframe não tinha valor de mensuração.
  assert.doesNotMatch(indexHtml, /ns\.html\?id=GTM/i, 'iframe noscript do GTM não deve existir');
  assert.doesNotMatch(indexHtml, /<noscript>\s*<iframe/i, 'nenhum iframe deve ser injetado via noscript');
});

test('index.html initializes dataLayer before the React entrypoint runs', () => {
  const dataLayerIndex = indexHtml.indexOf('window.dataLayer = window.dataLayer || []');
  const entrypointIndex = indexHtml.indexOf('<script type="module" src="/index.tsx"></script>');

  assert.notEqual(dataLayerIndex, -1, 'dataLayer bootstrap should be present');
  assert.notEqual(entrypointIndex, -1, 'React entrypoint script should be present');
  assert.ok(dataLayerIndex < entrypointIndex, 'dataLayer should exist before app code can push conversion events');
});

test('index.html não carrega mais o Stape/GTM (Stape desativado — corte pro Zaraz, Task 7)', () => {
  // Stape foi desativado pela própria Stape (excedeu o plano gratuito) em 31/08/2026,
  // o que motivou a migração pro Zaraz. GA4/Meta/TikTok agora rodam via Zaraz
  // (docs/superpowers/plans/2026-09-01-zaraz-tag-migration.md); nenhum código deste
  // arquivo deve mais referenciar o loader do Stape/GTM.
  assert.doesNotMatch(indexHtml, /var\s+gtmLoaded/i, 'variável do loader do Stape/GTM não deve existir');
  assert.doesNotMatch(indexHtml, /loadGtm/i, 'loader do Stape/GTM não deve existir');
  assert.doesNotMatch(indexHtml, /sst\.anhanga\.tur\.br/i, 'domínio do Stape não deve ser referenciado');
  assert.doesNotMatch(indexHtml, /'gtm\.start'/i, 'bootstrap do GTM não deve mais ser empurrado pro dataLayer');

  const utmInjectIndex = indexHtml.indexOf("injectScript('/utm-tracking.js'");
  assert.ok(utmInjectIndex > -1, 'UTM tracking loader should still be present');
});

test('index.html não define mais o wrapper gtag (nada mais chama gtag() desde o corte pro Zaraz)', () => {
  // O wrapper existia só pra utm-tracking.js chamar gtag('get', ..., 'client_id', ...);
  // essa chamada foi removida (getGACid agora gera seu próprio cid — ver
  // tests/whatsapp-tracking.test.ts), então o stub virou código morto.
  assert.doesNotMatch(indexHtml, /function\s+gtag\s*\(\)/, 'wrapper gtag morto não deve mais existir');
});

test('UTM tracker respeita o opt-out data-no-specialist-cta antes de disparar specialist_cta_click', () => {
  // O heurístico textual isSpecialistCtaText casa em qualquer clicável com
  // "consultoria"/"especialista"/"orçamento" no texto — o CTA pago de
  // agendamento ("Agendar consultoria") casaria e poluiria a métrica da porta
  // gratuita. O guard early-return por data-no-specialist-cta precisa existir e
  // vir ANTES de getSpecialistSourceElement/isSpecialistCtaText.
  const guardIndex = utmTrackingScript.search(
    /if\s*\(\s*target\.closest\(\s*['"]\[data-no-specialist-cta\]['"]\s*\)\s*\)\s*return;/,
  );
  assert.ok(guardIndex > -1, 'trackSpecialistClick deve ter o early-return de opt-out');

  // Ancorar na desestruturação (só existe no corpo de trackSpecialistClick),
  // não em getSpecialistSourceElement — cujo primeiro match seria a definição.
  const callIndex = utmTrackingScript.indexOf(
    'const { specialistButton, clickable } = getSpecialistSourceElement(target)',
  );
  assert.ok(callIndex > -1, 'trackSpecialistClick deve chamar getSpecialistSourceElement');
  assert.ok(
    guardIndex < callIndex,
    'o opt-out deve vir antes da classificação por texto/atributo',
  );
});

test('index.html loads only the required Poppins font weights', () => {
  const fontUrls = [...indexHtml.matchAll(/href="([^"]*fonts\.googleapis\.com\/css2[^"]*)"/g)]
    .map((match) => match[1])
    .filter((url) => url.includes('family=Poppins'));

  assert.equal(fontUrls.length, 3, 'preload, stylesheet, and noscript font URLs should stay aligned');

  for (const url of fontUrls) {
    assert.match(url, /family=Poppins:wght@400;600;700;900(?:&|$)/);
    assert.doesNotMatch(url, /Poppins:wght@[^"]*800/);
  }
});

test('design system documents the production Poppins font weights', () => {
  const importUrl = designSystemCss.match(/@import url\('([^']*fonts\.googleapis\.com\/css2[^']*)'\);/)?.[1];

  assert.ok(importUrl, 'design system should import its Google Fonts stylesheet');
  assert.match(importUrl, /family=Poppins:wght@400;600;700;900(?:&|$)/);
  assert.doesNotMatch(importUrl, /Poppins:wght@[^']*800/);
  assert.match(designSystemCss, /Poppins is loaded with 400\/600\/700\/900 only/);
});

test('index.html delega os defaults de consentimento ao Consent Bridge do GTM', () => {
  // O template Anhangá Consent Bridge roda em Consent Initialization e usa
  // setDefaultConsentState. Manter também um gtag('consent', 'default') inline
  // cria dois defaults e permite que a sincronização da escolha persistida seja
  // processada antes do segundo, gerando update-before-default no Tag Assistant.
  // Os updates também pertencem ao Bridge para não duplicar transições.
  assert.doesNotMatch(
    indexHtml,
    /gtag\(\s*['"]consent['"]/,
    'o Consent Bridge deve ser a única fonte dos comandos de consentimento',
  );
});

test('Traks tem gate de host para não poluir os goals de conversão em dev/CI', () => {
  const headHtml = getHeadHtml(indexHtml);

  // O stub de fila (window.traks = window.traks || function...) precisa continuar
  // definido incondicionalmente — trackTraks() em toda a app depende dele existir
  // mesmo quando o coletor não carrega (eventos só ficam enfileirados, sem envio).
  assert.match(headHtml, /window\.traks\s*=\s*window\.traks\s*\|\|\s*function/, 'stub de fila do Traks deve continuar definido');

  // O <script src="...t.js"> não pode ser um tag estático incondicional — precisa
  // ser injetado programaticamente, atrás do mesmo gate de host do GTM.
  assert.doesNotMatch(
    headHtml,
    /<script[^>]*src="https:\/\/analytics-collect\.anhanga\.tur\.br\/t\.js"/i,
    'o coletor do Traks não deve ser um <script> estático incondicional',
  );
  assert.match(headHtml, /analytics-collect\.anhanga\.tur\.br\/t\.js/, 'a URL do coletor deve continuar presente (injeção condicional)');

  const gateIndex = headHtml.indexOf('location.hostname');
  const trakerScriptIndex = headHtml.indexOf('analytics-collect.anhanga.tur.br/t.js');
  assert.ok(gateIndex > -1 && trakerScriptIndex > -1, 'gate de host e injeção do coletor devem existir');
  assert.ok(gateIndex < trakerScriptIndex, 'o gate de host deve preceder a injeção do coletor do Traks');

  // Slice até o fim da IIFE (não só até a URL) — o gate de DOMContentLoaded vem
  // depois da definição de injectTraks, que é onde a URL do coletor aparece.
  const iifeEndIndex = headHtml.indexOf('})();', trakerScriptIndex) + '})();'.length;
  assert.ok(iifeEndIndex > trakerScriptIndex, 'a IIFE do gate do Traks deve se fechar depois da URL do coletor');
  const gateToScriptSlice = headHtml.slice(gateIndex, iifeEndIndex);

  // .defer não tem efeito em scripts inseridos via createElement — só async = false
  // restaura a execução em ordem que a tag estática <script defer> original tinha.
  assert.doesNotMatch(gateToScriptSlice, /\.defer\s*=\s*true/, 'não deve usar .defer em script criado via createElement');
  assert.match(gateToScriptSlice, /\.async\s*=\s*false/, 'deve usar script.async = false para execução em ordem');

  // async = false sozinho não replica a garantia de defer de esperar o parse do
  // documento terminar (só ordena execução relativa a outros scripts em-ordem) —
  // por isso a injeção precisa ficar atrás de um gate de DOMContentLoaded, que só
  // dispara depois do parse completo (regressão de TBT/LCP apontada em review,
  // mesma classe do issue #1259).
  assert.match(gateToScriptSlice, /document\.readyState\s*===\s*'loading'/, 'deve checar document.readyState antes de injetar');
  assert.match(gateToScriptSlice, /addEventListener\(\s*'DOMContentLoaded'/, 'deve esperar DOMContentLoaded quando o parse ainda está em andamento');
  const domContentLoadedIndex = gateToScriptSlice.search(/addEventListener\(\s*'DOMContentLoaded'/);
  const injectFnIndex = gateToScriptSlice.indexOf('var injectTraks');
  assert.ok(injectFnIndex > -1 && domContentLoadedIndex > -1, 'função de injeção e gate de DOMContentLoaded devem existir');
  assert.ok(injectFnIndex < domContentLoadedIndex, 'a função de injeção deve ser definida antes de ser agendada no gate');

  assert.match(gateToScriptSlice, /'localhost'/, 'gate deve cobrir localhost');
  assert.match(gateToScriptSlice, /'127\.0\.0\.1'/, 'gate deve cobrir 127.0.0.1');
  assert.match(gateToScriptSlice, /'\[::1\]'/, 'gate deve cobrir o loopback IPv6 [::1]');
  assert.match(gateToScriptSlice, /'::1'/, 'gate deve cobrir o loopback IPv6 ::1');
  assert.match(gateToScriptSlice, /'0\.0\.0\.0'/, 'gate deve cobrir 0.0.0.0 (Docker/CI)');
  assert.match(gateToScriptSlice, /\.endsWith\('\.local'\)/, 'gate deve cobrir hosts .local');
  assert.match(gateToScriptSlice, /\.endsWith\('\.test'\)/, 'gate deve cobrir hosts .test');
});

test('index.html não carrega scripts do Mautic (ferramenta descontinuada)', () => {
  assert.doesNotMatch(indexHtml, /mtc\.js/i, 'script do Mautic não deve ser injetado');
  assert.doesNotMatch(indexHtml, /loadMautic/i, 'loader do Mautic não deve existir');
  assert.doesNotMatch(indexHtml, /MauticTrackingObject/i, 'objeto de rastreamento do Mautic não deve existir');
});

test('index.html difere terceiros sem atraso fixo de ~12s que fixa TTI no lab (issue #1259)', () => {
  // O atraso fixo antigo (setTimeout ~12s / 15s / requestIdleCallback timeout 25s) empurrava a
  // atividade dos scripts de terceiros para dentro da janela de medição do Lighthouse/PageSpeed,
  // fixando TTI/TBT em ~12s. O fallback agora dispara no primeiro tempo ocioso pós-load.
  assert.doesNotMatch(indexHtml, /setTimeout\(\s*triggerAnalytics\s*,\s*1[25]000\s*\)/, 'sem atraso fixo de 12s/15s no trigger de analytics');
  assert.doesNotMatch(indexHtml, /requestIdleCallback\([^)]*\{\s*timeout:\s*25000/, 'sem requestIdleCallback com timeout de 25s');

  // O fallback ocioso curto (<= 4s) e os gatilhos de interação devem continuar presentes.
  assert.match(indexHtml, /requestIdleCallback\(\s*triggerAnalytics\s*,\s*\{\s*timeout:\s*4000\s*\}\s*\)/, 'fallback ocioso curto deve existir');
  assert.match(indexHtml, /\['scroll',\s*'pointerdown',\s*'keydown',\s*'touchstart'\]/, 'gatilhos de interação devem permanecer');
  assert.match(indexHtml, /scheduleFallback/, 'fallback pós-load deve estar agendado');
});

test('index.html mantém teto absoluto de analytics independente do evento load', () => {
  // Se o 'load' atrasar/travar (iframe, tiles do Leaflet em /lollapalooza), o fallback de
  // analytics ainda precisa disparar para sessões sem interação. O backstop absoluto roda no
  // parse do script (não gated no load) e é idempotente/limpo via analyticsLoaded.
  assert.match(indexHtml, /absoluteFallbackTimer\s*=\s*setTimeout\(\s*triggerAnalytics\s*,\s*10000\s*\)/, 'backstop absoluto (10s) independente do load deve existir');
  assert.match(indexHtml, /clearTimeout\(absoluteFallbackTimer\)/, 'backstop deve ser limpo quando o analytics carrega (idempotência)');

  // A limpeza do timer deve ocorrer dentro de loadAnalytics, após marcar analyticsLoaded.
  const loadAnalyticsMatch = indexHtml.match(/var loadAnalytics\s*=\s*function\s*\(\)\s*\{([\s\S]*?)\n\s{6}\};/);
  assert.ok(loadAnalyticsMatch, 'loadAnalytics deve estar definida');
  assert.match(loadAnalyticsMatch[1], /clearTimeout\(absoluteFallbackTimer\)/, 'clearTimeout deve estar dentro de loadAnalytics');
});

test('index.html mantém no máximo 4 preconnects no head (guia de performance)', () => {
  const headHtml = getHeadHtml(indexHtml);
  const preconnects = [...headHtml.matchAll(/rel="preconnect"/g)];
  assert.ok(preconnects.length <= 4, `esperado <= 4 preconnects, encontrado ${preconnects.length}`);
  // O preconnect do CDN de mídia (origem do LCP) deve permanecer.
  assert.match(headHtml, /rel="preconnect"\s+href="https:\/\/media\.anhanga\.tur\.br"/, 'preconnect do CDN de mídia (LCP) deve permanecer');
});

test('index.html não carrega scripts do HubSpot (ferramenta descontinuada)', () => {
  assert.doesNotMatch(indexHtml, /hs-scripts\.com/i, 'script do HubSpot não deve ser injetado');
  assert.doesNotMatch(indexHtml, /loadHubspot/i, 'loader do HubSpot não deve existir');
});

test('index.html tem listener anhanga:marketing-consent', () => {
  assert.match(indexHtml, /anhanga:marketing-consent/, 'listener de aceite deve estar presente');
});

test('index.html expõe ponte fail-closed para o template de consentimento do GTM', () => {
  assert.match(indexHtml, /window\.addAnhangaConsentListener\s*=\s*function/);
  assert.match(
    indexHtml,
    /callConsentListener\(callback,\s*_consentChoice\)/,
    'assinante recebe imediatamente a escolha persistida com isolamento de falha'
  );
  assert.match(
    indexHtml,
    /anhanga_marketing_consent:\s*_consentChoice\s*===\s*'marketing'/,
    'estado inicial deve ser publicado no dataLayer'
  );
});

test('aceite notifica a ponte antes do evento marketing_consent_granted', () => {
  const acceptStart = indexHtml.indexOf("window.addEventListener('anhanga:marketing-consent'");
  const revokeStart = indexHtml.indexOf("window.addEventListener('anhanga:revoke-consent'");
  const acceptBlock = indexHtml.slice(acceptStart, revokeStart);
  const notifyIndex = acceptBlock.indexOf("notifyConsentListeners('marketing')");
  const eventIndex = acceptBlock.indexOf("event: 'marketing_consent_granted'");

  assert.ok(acceptStart > -1 && revokeStart > acceptStart);
  assert.ok(notifyIndex > -1, 'aceite deve notificar os assinantes');
  assert.ok(eventIndex > notifyIndex, 'updateConsentState deve ser solicitado antes do evento GTM');
  assert.match(acceptBlock, /anhanga_marketing_consent:\s*true/);
});

test('revogação notifica denied antes do reload', () => {
  const revokeStart = indexHtml.indexOf("window.addEventListener('anhanga:revoke-consent'");
  const revokeBlock = indexHtml.slice(revokeStart);
  const notifyIndex = revokeBlock.indexOf("notifyConsentListeners('essential')");
  const deniedIndex = revokeBlock.indexOf('anhanga_marketing_consent: false');
  const reloadIndex = revokeBlock.indexOf('reloadAfterZarazFlush()');

  assert.ok(notifyIndex > -1);
  assert.ok(deniedIndex > notifyIndex);
  assert.ok(reloadIndex > deniedIndex, 'revogação deve delegar o reload pra reloadAfterZarazFlush, não recarregar direto');
});

test('reloadAfterZarazFlush espera o flush do Zaraz antes de recarregar (com teto curto)', () => {
  // Achado de review (chatgpt-codex-connector[bot]): reload síncrono destruiria o
  // documento antes do retry de 10s da assinatura da ponte ter qualquer chance de
  // rodar, deixando o Zaraz reaplicar o 'marketing: true' persistido da visita
  // anterior na página recarregada. reloadAfterZarazFlush precisa tentar o flush
  // primeiro e, se falhar, esperar um pouco (não os 10s inteiros — travaria a UI).
  const fnStart = indexHtml.indexOf('var reloadAfterZarazFlush = function () {');
  const domListenersStart = indexHtml.indexOf("window.addEventListener('anhanga:marketing-consent'");
  assert.ok(fnStart > -1, 'reloadAfterZarazFlush deve existir');
  assert.ok(fnStart < domListenersStart, 'deve ser definida antes dos listeners de DOM que a usam');

  const fnBlock = indexHtml.slice(fnStart, domListenersStart);
  assert.match(fnBlock, /if\s*\(flushZarazConsent\(\)\)\s*\{\s*window\.location\.reload\(\);/, 'deve recarregar direto se o flush já tiver sucesso na hora');
  assert.match(fnBlock, /setInterval\(/, 'deve reter e tentar de novo por um teto curto se o flush falhar na hora');
  assert.match(fnBlock, /window\.location\.reload\(\);\s*\}\s*\},\s*200\)/, 'deve recarregar de qualquer forma depois do teto — não pode travar a revogação indefinidamente');
});

test('flushZarazConsent distingue "nada pendente" de "zaraz não está pronto"', () => {
  // Achado de review (claude[bot] + chatgpt-codex-connector[bot]): um único `||`
  // combinando as duas condições faz "já sincronizado" e "ainda não pronto" devolverem
  // `false` do mesmo jeito. No fluxo de revogação, notifyConsentListeners já dispara a
  // assinatura da ponte e flusha com sucesso quando o zaraz.js já tinha carregado (caso
  // comum) — sem essa distinção, reloadAfterZarazFlush não reconhece o flush como
  // concluído e espera o teto inteiro de ~1,2s à toa antes de recarregar.
  const fnStart = indexHtml.indexOf('var flushZarazConsent = function () {');
  const fnEnd = indexHtml.indexOf("window.addAnhangaConsentListener(function (choice)");
  assert.ok(fnStart > -1 && fnStart < fnEnd, 'flushZarazConsent deve existir antes da assinatura que a usa');

  const fnBlock = indexHtml.slice(fnStart, fnEnd);
  assert.match(
    fnBlock,
    /if\s*\(pendingZarazMarketing\s*===\s*null\)\s*return\s*true;/,
    'nada pendente deve retornar true imediatamente, sem checar se o zaraz.js carregou'
  );
  assert.match(
    fnBlock,
    /if\s*\(!window\.zaraz\s*\|\|\s*!window\.zaraz\.consent\)\s*return\s*false;/,
    'só chega a checar prontidão do zaraz.js quando existe algo pendente pra enviar'
  );
});

test('ponte assina addAnhangaConsentListener pra propagar a purpose de marketing pro Zaraz', () => {
  // A sincronização vive numa assinatura da própria ponte (addAnhangaConsentListener),
  // não numa chamada inline dentro dos listeners de DOM — assim ela também cobre uma
  // visita de retorno com consentimento já persistido, não só o clique em si (os
  // listeners de DOM são { once: true }).
  const syncStart = indexHtml.indexOf('var pendingZarazMarketing = null;');
  const marketingListenerStart = indexHtml.indexOf("window.addEventListener('anhanga:marketing-consent'");
  assert.ok(syncStart > -1, 'assinatura da ponte pro Zaraz deve existir');
  assert.ok(syncStart < marketingListenerStart, 'assinatura deve ser registrada antes dos listeners de DOM');

  const syncBlock = indexHtml.slice(syncStart, marketingListenerStart);
  assert.match(
    syncBlock,
    /pendingZarazMarketing\s*=\s*choice\s*===\s*'marketing'/,
    'callback deve mapear o choice pra um boolean da purpose marketing'
  );
  assert.match(
    syncBlock,
    /!window\.zaraz\s*\|\|\s*!window\.zaraz\.consent/,
    'flush deve verificar se o zaraz.js já carregou antes de chamar consent.set'
  );
  assert.match(
    syncBlock,
    /window\.zaraz\.consent\.set\(\{\s*marketing:\s*pendingZarazMarketing\s*\}\)/,
    'flush deve chamar consent.set com a purpose marketing pendente'
  );
  assert.match(
    syncBlock,
    /setInterval\(/,
    'deve reter e tentar de novo se o zaraz.js ainda não tiver carregado no momento do clique — não pode descartar o consentimento em silêncio'
  );
});

test('DOM listeners de aceite/revogação não chamam o Zaraz diretamente (delegam pra ponte)', () => {
  const acceptStart = indexHtml.indexOf("window.addEventListener('anhanga:marketing-consent'");
  const revokeStart = indexHtml.indexOf("window.addEventListener('anhanga:revoke-consent'");
  const acceptBlock = indexHtml.slice(acceptStart, revokeStart);
  const revokeBlock = indexHtml.slice(revokeStart);

  assert.doesNotMatch(acceptBlock, /window\.zaraz/, 'listener de aceite não deve chamar o Zaraz direto — a assinatura da ponte já cobre isso');
  assert.doesNotMatch(revokeBlock, /window\.zaraz/, 'listener de revogação não deve chamar o Zaraz direto — a assinatura da ponte já cobre isso');
});

test('index.html tem listener anhanga:revoke-consent com reload', () => {
  assert.match(indexHtml, /anhanga:revoke-consent/, 'listener de revogação deve estar presente');
  const revokeIdx = indexHtml.indexOf('anhanga:revoke-consent');
  const reloadIdx = indexHtml.indexOf('reloadAfterZarazFlush()', revokeIdx);
  assert.ok(reloadIdx > revokeIdx, 'reload (via reloadAfterZarazFlush) deve ocorrer após revoke-consent');
});
