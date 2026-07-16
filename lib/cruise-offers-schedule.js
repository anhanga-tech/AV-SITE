// Expiração das ofertas de cruzeiro da landing /cruzeiros.
//
// Cada oferta em data/cruiseOffers.ts tem um `expiraEm` (YYYY-MM-DD, fuso de
// São Paulo). A oferta é visível ATÉ e incluindo esse dia; a partir do dia
// seguinte ela some. O rebuild diário do Cloudflare Pages
// (.github/workflows/scheduled-publish.yml, ~06:15 America/Sao_Paulo)
// re-renderiza a landing estática e materializa a remoção sem PR nenhum.
//
// Arquivo .js (não .ts) de propósito: reusa todayInSaoPaulo() de
// blog-schedule.js e é importado pelo componente da landing (runtime) e pelos
// testes. Prerender e cliente rodam ESTE MESMO código, então concordam sobre
// quais ofertas mostrar — a única divergência possível é a data-base entre o
// build e o load. Como o rebuild é diário e a granularidade de `expiraEm` é o
// dia, o HTML servido em qualquer dia D contém as ofertas ativas em D e o
// cliente que carrega em D filtra idêntico. A janela de divergência é apenas
// 00:00–06:15 SP (antes do rebuild do novo dia), afetando só uma oferta que
// expirou na virada; o efeito é ela sumir suavemente após a hidratação, sem
// quebrar o layout (keys estáveis por `id`).

import { todayInSaoPaulo } from './blog-schedule.js';

export { todayInSaoPaulo };

/**
 * Uma oferta está expirada quando hoje já passou do seu `expiraEm`.
 * Datas ISO (YYYY-MM-DD) comparam corretamente como string.
 * @param {string | undefined} expiraEm
 * @param {string} [today]
 * @returns {boolean}
 */
export function isOfferExpired(expiraEm, today = todayInSaoPaulo()) {
  if (!expiraEm) return false;
  return today > expiraEm;
}

/**
 * Filtra a lista mantendo só as ofertas ainda válidas, preservando a ordem.
 * @template {{ expiraEm?: string }} T
 * @param {readonly T[]} offers
 * @param {string} [today]
 * @returns {T[]}
 */
export function getActiveOffers(offers, today = todayInSaoPaulo()) {
  return offers.filter((offer) => !isOfferExpired(offer.expiraEm, today));
}
