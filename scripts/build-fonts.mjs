// Gera os WOFF2 auto-hospedados de `src/fonts/` a partir dos TTFs oficiais do
// repositório google/fonts.
//
// NÃO roda no `pnpm build`: os arquivos ficam versionados em `src/fonts/` e só
// precisam ser regerados quando uma família/peso muda. Rode `pnpm fonts:build`
// e commite a saída (o script baixa ~9 MB de TTF de origem para um diretório
// temporário; nada disso entra no repo).
//
// Por que auto-hospedar (medições de 09/09/2026, ver docs/design/fonts-inventory.md):
//   - O Google Fonts serve Merriweather como fonte VARIÁVEL de 3 eixos; o arquivo
//     `latin` sozinho tem 95 KiB. Instanciar em pesos estáticos derruba para ~14 KiB.
//   - `kern` do Merriweather custa ~30 KiB por face e altera a largura do texto em
//     0,85% a 18px (medido no Chromium, indistinguível a olho) — por isso é a única
//     feature OpenType descartada, e só nessa família. Poppins mantém `kern` porque
//     ali a tabela é irrelevante em bytes.
//   - Mesma origem elimina a request de CSS em fonts.googleapis.com e os dois
//     preconnects; o CSS com os @font-face já viaja no bundle que o head carrega.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import subsetFont from 'subset-font';

const GOOGLE_FONTS_RAW = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const OUT_DIR = path.resolve(import.meta.dirname, '..', 'src', 'fonts');

// Os mesmos unicode-ranges que o Google Fonts usa hoje. Mantê-los idênticos
// preserva o comportamento sob demanda: em pt-BR o browser baixa só `latin`,
// e `latin-ext` fica reservado a nomes próprios estrangeiros.
const SUBSETS = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

const WITH_KERN = ['kern', 'liga', 'clig', 'ccmp', 'mark', 'mkmk'];
const WITHOUT_KERN = WITH_KERN.filter((feature) => feature !== 'kern');

// `opsz` fica fixado em 18 (o padrão do eixo, e o corpo do texto do blog). Sem
// pinar, o subset variável do Merriweather volta a passar de 160 KiB.
const MERRIWEATHER_AXES = (weight) => ({ wght: weight, wdth: 100, opsz: 18 });

const FACES = [
  {
    file: 'merriweather/Merriweather[opsz,wdth,wght].ttf',
    output: 'merriweather-400',
    axes: MERRIWEATHER_AXES(400),
    keepFeatures: WITHOUT_KERN,
  },
  {
    file: 'merriweather/Merriweather[opsz,wdth,wght].ttf',
    output: 'merriweather-700',
    axes: MERRIWEATHER_AXES(700),
    keepFeatures: WITHOUT_KERN,
  },
  {
    file: 'merriweather/Merriweather-Italic[opsz,wdth,wght].ttf',
    output: 'merriweather-400-italic',
    axes: MERRIWEATHER_AXES(400),
    keepFeatures: WITHOUT_KERN,
  },
  { file: 'poppins/Poppins-Regular.ttf', output: 'poppins-400', keepFeatures: WITH_KERN },
  { file: 'poppins/Poppins-SemiBold.ttf', output: 'poppins-600', keepFeatures: WITH_KERN },
  { file: 'poppins/Poppins-Bold.ttf', output: 'poppins-700', keepFeatures: WITH_KERN },
  { file: 'poppins/Poppins-Black.ttf', output: 'poppins-900', keepFeatures: WITH_KERN },
];

const LICENSES = [
  { file: 'merriweather/OFL.txt', output: 'OFL-Merriweather.txt' },
  { file: 'poppins/OFL.txt', output: 'OFL-Poppins.txt' },
];

/** Expande uma lista de unicode-ranges CSS na string de caracteres que o subsetter espera. */
function expandUnicodeRange(spec) {
  let text = '';
  for (const part of spec.split(',')) {
    const range = part.trim().replace(/^U\+/i, '');
    if (range.includes('-')) {
      const [start, end] = range.split('-').map((hex) => Number.parseInt(hex, 16));
      for (let code = start; code <= end; code += 1) text += String.fromCodePoint(code);
    } else {
      text += String.fromCodePoint(Number.parseInt(range, 16));
    }
  }
  return text;
}

async function download(remotePath, destination) {
  const url = `${GOOGLE_FONTS_RAW}/${remotePath.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function main() {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anhanga-fonts-'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { file, output } of LICENSES) {
    const source = path.join(cacheDir, output);
    await download(file, source);
    fs.copyFileSync(source, path.join(OUT_DIR, output));
  }

  let total = 0;
  for (const face of FACES) {
    const source = path.join(cacheDir, face.file);
    if (!fs.existsSync(source)) await download(face.file, source);
    const buffer = fs.readFileSync(source);

    for (const [subset, spec] of Object.entries(SUBSETS)) {
      const options = { targetFormat: 'woff2', keepFeatures: face.keepFeatures };
      if (face.axes) options.variationAxes = face.axes;

      const result = await subsetFont(buffer, expandUnicodeRange(spec), options);
      const name = `${face.output}-${subset}.woff2`;
      fs.writeFileSync(path.join(OUT_DIR, name), result);
      total += result.length;
      console.log(`${name.padEnd(36)} ${(result.length / 1024).toFixed(1)} KiB`);
    }
  }

  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log(`\n${FACES.length * 2} arquivos, ${(total / 1024).toFixed(1)} KiB no total.`);
}

await main();
