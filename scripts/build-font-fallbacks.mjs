/**
 * Gera src/font-fallbacks.css: faces `Poppins Fallback` com métricas ajustadas,
 * usadas enquanto a Poppins (font-display: swap) ainda não chegou.
 *
 * Sem isso o fallback é o `sans-serif` genérico do sistema, mais estreito que a
 * Poppins: textos quebravam em uma linha a menos e ganhavam uma linha no swap,
 * empurrando a página (CLS da home no mobile, #1972).
 *
 * - size-adjust: razão de largura medida no Chromium entre cada peso da Poppins e
 *   a Arial (via Liberation Sans/Arimo, métricas idênticas), sobre textos reais do
 *   site. Uma face por peso que a Poppins tem (400/600/700/900): o browser escolhe
 *   o peso do fallback como escolhe o do webfont, e ≥600 usa a Arial Bold em vez de
 *   negrito sintético.
 * - ascent/descent/line-gap-override: hhea da Poppins ÷ unitsPerEm ÷ size-adjust,
 *   para a linha do fallback ter a mesma altura e baseline da Poppins.
 *
 * Uso: node scripts/build-font-fallbacks.mjs
 * Requer uma fonte com métricas da Arial instalada (Arial, Liberation Sans ou Arimo);
 * aborta se o local() não resolver, em vez de gravar valores medidos contra outra fonte.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { decompress } from 'wawoff2';
import { chromium } from '@playwright/test';

const FONTS_DIR = 'src/fonts';
const OUT_FILE = 'src/font-fallbacks.css';
const WEIGHTS = [400, 600, 700, 900];

const REGULAR_SOURCES = ['Arial', 'ArialMT', 'Liberation Sans', 'LiberationSans', 'Arimo'];
const BOLD_SOURCES = ['Arial Bold', 'Arial-BoldMT', 'Liberation Sans Bold', 'LiberationSans-Bold', 'Arimo Bold'];

// Textos que de fato aparecem acima da dobra (hero, barra de IA, banner) e um
// parágrafo típico do blog. Acentos e pontuação do português contam na largura.
const SAMPLES = [
  'Roteiro sob medida, proposta sem compromisso e atendimento humano para viajar sem pacote pronto',
  'Agência de Viagens em São Paulo Sua Próxima Aventura',
  'Usamos cookies de marketing para te mostrar ofertas de viagem mais relevantes. Analytics continua ativo por interesse legítimo — saiba como se opor em nossa Política de Privacidade.',
  'Orlando é o destino mais pedido pelas famílias brasileiras: parques da Disney e da Universal, compras e um clima que ajuda o ano inteiro. Planejar com antecedência faz diferença no preço.',
  'Sem compromisso • Retorno humano em até 2h úteis',
  'Quer pesquisar antes de conversar? Pergunte sobre a Anhangá:',
];

const fontFile = (weight) => `${FONTS_DIR}/poppins-${weight}-latin.woff2`;
const localSources = (weight) =>
  (weight >= 600 ? BOLD_SOURCES : REGULAR_SOURCES).map((name) => `local('${name}')`).join(', ');

async function readVerticalMetrics(weight) {
  const sfnt = Buffer.from(await decompress(readFileSync(fontFile(weight))));
  const tables = {};
  for (let index = 0; index < sfnt.readUInt16BE(4); index += 1) {
    const record = 12 + index * 16;
    tables[sfnt.toString('latin1', record, record + 4)] = sfnt.readUInt32BE(record + 8);
  }
  return {
    unitsPerEm: sfnt.readUInt16BE(tables.head + 18),
    ascender: sfnt.readInt16BE(tables.hhea + 4),
    descender: sfnt.readInt16BE(tables.hhea + 6),
    lineGap: sfnt.readInt16BE(tables.hhea + 8),
  };
}

async function measureSizeAdjust() {
  const faces = WEIGHTS.map((weight) => {
    const data = readFileSync(fontFile(weight)).toString('base64');
    return `
      @font-face { font-family: 'Webfont'; font-weight: ${weight}; src: url(data:font/woff2;base64,${data}) format('woff2'); }
      @font-face { font-family: 'Fallback'; font-weight: ${weight}; src: ${localSources(weight)}; }`;
  }).join('\n');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${faces}
      @font-face { font-family: 'Missing'; src: local('Nenhuma Fonte Com Este Nome'); }
      body { font-synthesis: none; } span { white-space: nowrap; font-size: 100px; }</style>`);

    return await page.evaluate(async ({ weights, samples }) => {
      const width = (family, weight, text) => {
        const span = document.createElement('span');
        Object.assign(span.style, { fontFamily: family, fontWeight: String(weight) });
        span.textContent = text;
        document.body.appendChild(span);
        const value = span.getBoundingClientRect().width;
        span.remove();
        return value;
      };
      const results = {};
      for (const weight of weights) {
        await document.fonts.load(`${weight} 100px Webfont`);
        const fallbackFaces = await document.fonts.load(`${weight} 100px Fallback`);
        const unresolved = width("'Fallback', 'Missing'", weight, samples[0]) === width("'Missing'", weight, samples[0]);
        if (fallbackFaces.length === 0 || unresolved) {
          throw new Error(`local() do peso ${weight} não resolveu: instale Arial, Liberation Sans ou Arimo`);
        }
        const total = (family) => samples.reduce((sum, text) => sum + width(family, weight, text), 0);
        results[weight] = total("'Webfont'") / total("'Fallback'");
      }
      return results;
    }, { weights: WEIGHTS, samples: SAMPLES });
  } finally {
    await browser.close();
  }
}

const percent = (value) => `${(value * 100).toFixed(2)}%`;

const sizeAdjust = await measureSizeAdjust();
const blocks = [];
for (const weight of WEIGHTS) {
  const { unitsPerEm, ascender, descender, lineGap } = await readVerticalMetrics(weight);
  const adjust = sizeAdjust[weight];
  blocks.push(`@font-face {
    font-family: 'Poppins Fallback';
    font-style: normal;
    font-weight: ${weight};
    src: ${localSources(weight)};
    size-adjust: ${percent(adjust)};
    ascent-override: ${percent(ascender / unitsPerEm / adjust)};
    descent-override: ${percent(Math.abs(descender) / unitsPerEm / adjust)};
    line-gap-override: ${percent(lineGap / unitsPerEm / adjust)};
}`);
}

writeFileSync(OUT_FILE, `/* Gerado por \`node scripts/build-font-fallbacks.mjs\` — não editar à mão.
 *
 * Fallback com métricas da Poppins sobre a Arial (ou Liberation Sans/Arimo, que têm
 * as mesmas métricas). Enquanto a Poppins não chega, o texto já ocupa a largura e a
 * altura de linha finais, e o swap não muda a quebra de linha (CLS, #1972).
 *
 * Limitações conhecidas: Android não tem Arial, então ali o local() não resolve e o
 * fallback continua sendo o sans-serif do sistema (Roboto), como antes. Safari < 17
 * ignora size-adjust.
 */

${blocks.join('\n')}
`);

console.log(`✓ ${OUT_FILE}: ${WEIGHTS.map((weight) => `${weight} → ${percent(sizeAdjust[weight])}`).join(', ')}`);
