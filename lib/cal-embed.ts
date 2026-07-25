// Embed element-click do Cal.com Cloud para a consultoria paga, carregado
// SOB DEMANDA (só na primeira interação com o CTA), nunca no load da página —
// mantém a landing leve, dentro da disciplina de terceiros do projeto. O CTA
// mantém o <a href> (progressive enhancement): sem JS/no prerender é um link
// para a página do Cal.com; com JS, este helper abre o modal por cima do site.
//
// Ver project-consultoria-modelo-pago (memória) e a PR do embed.

const CAL_LINK = 'anhanga-viagens/consultoria';
const CAL_NAMESPACE = 'consultoria';
const CAL_ORIGIN = 'https://app.cal.com';
const CAL_EMBED_JS = 'https://app.cal.com/embed/embed.js';

// Cores de marca do design-tokens: azul de identidade no claro, azul de ação
// (mais vivo) no escuro. Espelha o que foi configurado no dashboard do Cal.com.
const BRAND_LIGHT = '#0056D2'; // anhanga-blue
const BRAND_DARK = '#0EA5E9'; // anhanga-action

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

// Loader oficial do Cal.com (o IIFE do snippet element-click), encapsulado para
// rodar on-demand em vez de no load. Cria o stub window.Cal e injeta o embed.js
// na primeira chamada; chamadas subsequentes são enfileiradas até o script
// carregar. Mantido próximo ao original para não divergir do que o Cal.com testa.
function loadCalScript(): void {
  /* eslint-disable */
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
  /* eslint-enable */
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') return;

  loadCalScript();
  const Cal = window.Cal;
  if (!Cal) return;

  Cal('init', CAL_NAMESPACE, { origin: CAL_ORIGIN });

  // Encaminha query params da URL (ex.: UTMs no primeiro acesso) para o booking.
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

  initialized = true;
}

// Abre o modal de agendamento do Cal.com. Só deve ser chamado a partir de uma
// interação do usuário no browser (onClick) — nunca em render/SSR.
export function openConsultoriaBooking(): void {
  ensureInitialized();
  window.Cal?.ns?.[CAL_NAMESPACE]('modal', {
    calLink: CAL_LINK,
    config: { layout: 'month_view', theme: 'auto' },
  });
}
