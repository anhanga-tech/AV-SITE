// Data de referência do build (fuso de São Paulo), compartilhada entre as duas metades do
// `pnpm build`: o `vite build` do cliente e o build SSR que scripts/prerender.mjs dispara em
// outro processo. Cada uma avalia vite.config.ts de novo; um build que atravessasse a meia-noite
// daria datas diferentes ao HTML prerenderizado e ao bundle do cliente, e a hidratação traria de
// volta uma oferta de /achados que o prerender já tinha tirado (lib/achados.ts).
//
// O cliente grava a data em BUILD_DATE_FILENAME dentro do outDir; o prerender lê, exporta em
// BUILD_DATE_ENV para o build SSR e apaga o arquivo antes do deploy.
//
// Arquivo .js (não .ts): importado por vite.config.ts e por scripts/prerender.mjs (JS puro).

import { todayInSaoPaulo } from './blog-schedule.js';

export const BUILD_DATE_ENV = 'BUILD_DATE_SP';
export const BUILD_DATE_FILENAME = '.build-date-sp';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Data herdada via ambiente quando válida; senão, hoje em São Paulo.
 * @param {Record<string, string | undefined>} env
 * @param {Date} [now]
 * @returns {string}
 */
export function resolveBuildDate(env, now = new Date()) {
  const inherited = env[BUILD_DATE_ENV]?.trim();
  return inherited && ISO_DATE_PATTERN.test(inherited) ? inherited : todayInSaoPaulo(now);
}
