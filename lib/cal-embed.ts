// Embed element-click do Cal.com Cloud para a consultoria paga, carregado
// SOB DEMANDA (só na primeira interação com o CTA), nunca no load da página —
// mantém a landing leve, dentro da disciplina de terceiros do projeto. O CTA
// mantém o <a href> (progressive enhancement): sem JS/no prerender é um link
// para a página do Cal.com; com JS, este helper abre o modal por cima do site.
// Se o embed.js falhar ao carregar, o clique cai de volta na navegação para
// CONSULTORIA_BOOKING_URL (ver fallback abaixo) — o CTA pago nunca fica morto.
//
// Ver project-consultoria-modelo-pago (memória) e a PR do embed.

import { getTrackingDataObject } from '../utils/whatsapp';

const CAL_LINK = 'anhanga-viagens/consultoria';
const CAL_NAMESPACE = 'consultoria';
const CAL_ORIGIN = 'https://app.cal.com';
const CAL_EMBED_JS = 'https://app.cal.com/embed/embed.js';

// URL pública de agendamento no Cal.com Cloud. Fonte única de verdade: o <a href>
// do CTA (fallback sem-JS) e o fallback de falha do embed usam esta constante.
export const CONSULTORIA_BOOKING_URL = `https://cal.com/${CAL_LINK}`;

// Cores de marca do design-tokens: azul de identidade no claro, azul de ação
// (mais vivo) no escuro. Espelha o que foi configurado no dashboard do Cal.com.
const BRAND_LIGHT = '#0056D2'; // anhanga-blue
const BRAND_DARK = '#0EA5E9'; // anhanga-action

// Se o embed.js não carregar neste tempo após o clique, o CTA navega para a
// página do Cal.com em vez de ficar morto (backstop para o caso "lento, sem
// erro"; falhas duras disparam o onerror imediatamente).
const FALLBACK_TIMEOUT_MS = 4000;

// A API global do Cal.com é injetada em runtime e não é tipada; tratamos como
// função variádica no boundary. Único ponto de `any` neste módulo.
type CalApi = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns?: Record<string, (...args: unknown[]) => void>;
  q?: unknown[];
  config?: Record<string, unknown>;
};

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

let initialized = false;
let scriptState: 'idle' | 'loading' | 'loaded' | 'failed' = 'idle';

// Shape do evento `bookingSuccessfulV2` do embed (https://cal.com/help/embedding/embed-events).
// Só os campos que este módulo usa; o Cal.com envia mais (title, startTime etc.).
interface CalBookingSuccessfulEvent {
  detail?: {
    data?: {
      uid?: unknown;
    };
  };
}

// Marca "reserva criada" no dataLayer, não "pagamento concluído" — o embed não
// emite um evento de pagamento (issue #1302). event_id é o uid do booking do
// Cal.com sem transformação: mesma chave que o server-side verá quando #1297
// ligar o webhook BOOKING_PAID ao purchase-dispatch, permitindo dedup por
// event_id entre o evento de funil (aqui) e o Purchase real (server-side).
export function pushConsultoriaBookingCreatedDataLayerEvent(uid: string): void {
  if (typeof window === 'undefined' || !window.dataLayer) {
    return;
  }

  window.dataLayer.push({
    event: 'consultoria_booking_created',
    event_id: uid,
    page_location: window.location.href,
  });

  window.dataLayer.push({
    event: 'form_submission',
    form_type: 'consultoria_booking',
    form_id: uid,
    page_location: window.location.href,
  });
}

// No fallback (embed bloqueado/lento/fora do ar), a navegação sai fora do
// embed — o comando `modal` com o `metadata[...]` nunca chega a rodar. Sem
// isto, a atribuição capturada se perderia justo nas reservas que passam
// pelo caminho de fallback (achado de review, PR #1369).
function navigateToBooking(): void {
  const attribution = new URLSearchParams(buildAttributionMetadataConfig()).toString();
  window.location.href = attribution ? `${CONSULTORIA_BOOKING_URL}?${attribution}` : CONSULTORIA_BOOKING_URL;
}

// Loader oficial do Cal.com (o IIFE do snippet element-click), encapsulado para
// rodar on-demand em vez de no load. Cria o stub window.Cal; o embed.js real só
// é injetado na primeira chamada a Cal(...). Mantido próximo ao original para
// não divergir do que o Cal.com testa — daí a supressão escopada abaixo:
// prefer-const e no-explicit-any são estilo/tipagem do snippet vendored, não
// bugs; nenhuma regra de correção é silenciada.
function loadCalScript(): void {
  /* eslint-disable prefer-const, prefer-rest-params, @typescript-eslint/no-explicit-any -- snippet vendored do Cal.com, mantido fiel ao original */
  (function (C: any, A: string, L: string) {
    let p = function (a: any, ar: any) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () {
      let cal = C.Cal; let ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        const api: any = function () { p(api, arguments); };
        const namespace = ar[1]; api.q = api.q || [];
        if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, CAL_EMBED_JS, 'init');
  /* eslint-enable prefer-const, prefer-rest-params, @typescript-eslint/no-explicit-any */
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') return;

  loadCalScript();
  const Cal = window.Cal;
  if (!Cal) return;

  // Este primeiro Cal(...) é o que injeta o <script> do embed.js no head.
  Cal('init', CAL_NAMESPACE, { origin: CAL_ORIGIN });

  // Pré-preenche campos NOMEADOS do formulário (nome, e-mail etc.) a partir de
  // query params com o mesmo identificador — NÃO é o mecanismo de atribuição.
  // UTMs/click IDs vão por `metadata[chave]` (ver buildAttributionMetadataConfig),
  // que o Cal.com grava na coluna metadata do booking e replica nos webhooks.
  Cal.config = Cal.config || {};
  Cal.config.forwardQueryParams = true;

  Cal.ns?.[CAL_NAMESPACE]('ui', {
    cssVarsPerTheme: {
      light: { 'cal-brand': BRAND_LIGHT },
      dark: { 'cal-brand': BRAND_DARK },
    },
    hideEventTypeDetails: false,
    layout: 'month_view',
  });

  // Dispara o evento de funil (issue #1302) assim que o embed confirma a
  // reserva — no domínio do site, sessão do usuário, ligado ao sGTM.
  Cal.ns?.[CAL_NAMESPACE]('on', {
    action: 'bookingSuccessfulV2',
    callback: (event: CalBookingSuccessfulEvent) => {
      const uid = event?.detail?.data?.uid;
      if (typeof uid === 'string' && uid) {
        pushConsultoriaBookingCreatedDataLayerEvent(uid);
      }
    },
  });

  // Fallback de carregamento: o clique já deu preventDefault, então sem isto um
  // embed.js bloqueado/lento/fora do ar deixaria o CTA pago morto. onerror
  // navega na hora; o timeout em openConsultoriaBooking cobre "lento, sem erro".
  scriptState = 'loading';
  const script = document.querySelector<HTMLScriptElement>(`script[src="${CAL_EMBED_JS}"]`);
  script?.addEventListener('load', () => { scriptState = 'loaded'; }, { once: true });
  script?.addEventListener('error', () => { scriptState = 'failed'; navigateToBooking(); }, { once: true });

  initialized = true;
}

// Converte o tracking já capturado por utils/whatsapp (UTMs, click IDs, GA4
// cid/sid) em entradas `metadata[chave]` do embed. O Cal.com grava isso na
// coluna metadata do booking e replica em payload.metadata nos webhooks
// (BOOKING_CREATED e, na mesma reserva, BOOKING_PAID) — fecha a atribuição até
// o purchase-dispatch (issue #1297). Ver cal.com/help/embedding/prefill-
// booking-form-embed. Não usa forwardQueryParams: aquele mecanismo só
// pré-preenche campos nomeados do formulário, não grava metadata arbitrário.
export function buildAttributionMetadataConfig(): Record<string, string> {
  const tracking = getTrackingDataObject();
  if (!tracking) return {};

  const metadataConfig: Record<string, string> = {};
  for (const [key, value] of Object.entries(tracking)) {
    if (value) metadataConfig[`metadata[${key}]`] = value;
  }
  return metadataConfig;
}

// Abre o modal de agendamento do Cal.com. Só deve ser chamado a partir de uma
// interação do usuário no browser (onClick) — nunca em render/SSR.
export function openConsultoriaBooking(): void {
  ensureInitialized();
  window.Cal?.ns?.[CAL_NAMESPACE]('modal', {
    calLink: CAL_LINK,
    config: {
      layout: 'month_view',
      theme: 'auto',
      ...buildAttributionMetadataConfig(),
    },
  });

  // Backstop: se o embed.js não tiver carregado a tempo, navega para a página
  // do Cal.com em vez de deixar o clique morto.
  window.setTimeout(() => {
    if (scriptState !== 'loaded') navigateToBooking();
  }, FALLBACK_TIMEOUT_MS);
}
