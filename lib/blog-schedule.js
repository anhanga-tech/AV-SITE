// Agendamento de publicação do blog.
//
// Posts com `date` futura ficam fora do build de PRODUÇÃO (Cloudflare Pages,
// branch main) e entram no ar via rebuild diário disparado pelo workflow
// .github/workflows/scheduled-publish.yml. Dev local, previews de PR e os
// artefatos gerados commitados continuam contendo todos os posts — o filtro
// só se aplica onde publicar de verdade importa, o que também mantém os
// arquivos gerados estáveis no repositório independente do dia do build.
//
// Arquivo .js (não .ts) de propósito: é importado tanto pelo lado TypeScript
// (lib/blog-manifest.ts) quanto pelo pipeline de prerender em JavaScript puro
// (lib/prerender-routes.js, executado via `node scripts/prerender.mjs`).

const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

/**
 * Data de "hoje" no fuso de São Paulo, em ISO (YYYY-MM-DD).
 * @param {Date} [now]
 * @returns {string}
 */
export function todayInSaoPaulo(now = new Date()) {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: SAO_PAULO_TIME_ZONE }).format(now);
}

/**
 * Um post é "futuro" quando sua `date` ISO é posterior a hoje.
 * Datas ISO comparam corretamente como string.
 * @param {string | undefined} dateStr
 * @param {string} [today]
 * @returns {boolean}
 */
export function isFuturePost(dateStr, today = todayInSaoPaulo()) {
  if (!dateStr) return false;
  return dateStr > today;
}

/**
 * O filtro liga automaticamente no build de produção do Cloudflare Pages
 * (CF_PAGES=1 + CF_PAGES_BRANCH=main). BLOG_HIDE_FUTURE_POSTS=true|false
 * força o comportamento em qualquer ambiente (útil em testes e depuração).
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function shouldHideFuturePosts(env = process.env) {
  if (env.BLOG_HIDE_FUTURE_POSTS === 'true') return true;
  if (env.BLOG_HIDE_FUTURE_POSTS === 'false') return false;
  return env.CF_PAGES === '1' && env.CF_PAGES_BRANCH === 'main';
}
