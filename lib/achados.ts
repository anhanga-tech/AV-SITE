// Achados da quinzena (/achados): ofertas de operadoras escolhidas a dedo, por tempo limitado.
//
// O conteúdo mora em content/achados.json (editável pelo Decap CMS em /admin). Uma oferta
// publicada vincula quem anuncia (CDC, art. 30), então a página nunca pode exibir oferta
// vencida: `getActiveAchados` filtra por `validoAte` contra a data do BUILD, e o rebuild diário
// de .github/workflows/scheduled-publish.yml (06:15 em São Paulo) tira do ar o que venceu.
// A data é a do build — e não a do navegador — para o HTML prerenderizado e a hidratação
// enxergarem a mesma lista; o texto "Reservas até DD/MM" protege a janela entre a meia-noite
// e o rebuild.

import { todayInSaoPaulo } from './blog-schedule.js';

export interface Achado {
  /** único e estável; vira `data-tracking` do CTA */
  id: string;
  titulo: string;
  destino: string;
  fornecedor: string;
  /** a opinião da Anhangá: por que a oferta vale e para quem — é o que separa achado de vitrine */
  porQueVale: string;
  /** preço "a partir de" exatamente como a operadora divulgou; omitir quando não houver */
  preco?: string;
  condicoes: string;
  /** último dia para reservar, ISO (YYYY-MM-DD) */
  validoAte: string;
  /** texto pré-preenchido do WhatsApp; nomear o achado identifica a oferta no atendimento */
  mensagemWhatsapp: string;
}

/** Curadoria, não catálogo: a página nunca mostra mais que isso. */
export const MAX_ACHADOS_VISIVEIS = 3;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

declare const __BUILD_DATE_SP__: string | undefined;

/** Data de referência do filtro: a do build (vite.config.ts) ou, fora do Vite (testes), hoje. */
export function getAchadosReferenceDate(): string {
  return typeof __BUILD_DATE_SP__ === 'string' ? __BUILD_DATE_SP__ : todayInSaoPaulo();
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/**
 * Achados ainda válidos em `today`, do prazo mais curto para o mais longo (o que vence
 * primeiro aparece primeiro), limitados a MAX_ACHADOS_VISIVEIS. `validoAte` é inclusivo.
 * Datas inválidas são descartadas: na dúvida, a oferta não vai ao ar.
 */
export function getActiveAchados(achados: readonly Achado[], today: string): Achado[] {
  return achados
    .filter((achado) => isValidIsoDate(achado.validoAte) && achado.validoAte >= today)
    .sort((a, b) => a.validoAte.localeCompare(b.validoAte))
    .slice(0, MAX_ACHADOS_VISIVEIS);
}

/** "2026-10-29" → "29/10/2026" */
export function formatIsoDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}
