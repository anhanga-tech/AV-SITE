# Inventário de fontes por rota

Fonte de verdade para *quais famílias, pesos e subconjuntos* cada rota baixa, e por que.
Medições de 09/09/2026 (issue #1603). Ao mexer em fonte, atualize esta página.

## O que mudou

Poppins e Merriweather deixaram de vir do `fonts.googleapis.com` e passaram a ser
**auto-hospedadas**: `src/fonts/*.woff2`, declaradas em `src/fonts.css`, geradas por
`pnpm fonts:build` (`scripts/build-fonts.mjs`) e emitidas pelo Vite em `/assets/`
com hash de conteúdo — ou seja, já cobertas pelo `Cache-Control: immutable` de
`public/_headers`.

As landings de evento (`/orlando`, `/lollapalooza`, `/beto-carrero`) continuam
carregando as famílias próprias delas pelo Google Fonts — ver
[Por que as landings ficaram de fora](#por-que-as-landings-ficaram-de-fora).

## Resultado medido

Chromium via Playwright, viewport 412×823 DPR 1,75, cache limpo, contando só
requisições de fonte (arquivos + o CSS do Google Fonts). "Antes" é o `main` de
08/09/2026; "depois" é o build desta mudança.

| Rota | Antes | Depois | Δ | Origens de terceiro |
|---|---|---|---|---|
| `/` (home) | ~93 KiB (82 de fonte + 11,6 do CSS) | **45,9 KiB** | −51% | 2 → 0 |
| `/blog/<post>` | ~188 KiB (176 + 11,6) | **66,6 KiB** | −65% | 2 → 0 |
| `/quiz` | ~93 KiB | **38,4 KiB** | −59% | 2 → 0 |
| `/orlando` | ~104 KiB | **91,2 KiB** | −12% | 2 → 2 (só Outfit/Space Mono) |

O artigo era o pior caso e virou o melhor ganho, como a issue pedia.

## Inventário

### Famílias globais (auto-hospedadas)

Um arquivo por peso **e** por subconjunto, com os mesmos `unicode-range` que o Google
Fonts usa. Em português o browser baixa só `latin`; `latin-ext` fica sob demanda para
nome próprio estrangeiro e nunca chega na maioria das sessões.

| Família | Peso | Estilo | `latin` | `latin-ext` | Onde é usada |
|---|---|---|---|---|---|
| Poppins | 400 | normal | 7,6 KiB | 4,9 KiB | `body` (`font-sans`), texto corrido |
| Poppins | 600 | normal | 7,7 KiB | 4,9 KiB | `font-semibold` |
| Poppins | 700 | normal | 7,5 KiB | 4,8 KiB | `font-bold` |
| Poppins | 900 | normal | 7,3 KiB | 4,6 KiB | `font-black` e os `h1`/`h2` `font-extrabold` (800 resolve para 900) |
| Merriweather | 400 | normal | 14,2 KiB | 28,6 KiB | corpo editorial do blog (`prose-p:font-serif`) |
| Merriweather | 700 | normal | 14,2 KiB | 28,7 KiB | `<strong>` dentro do texto serifado do MDX |
| Merriweather | 400 | italic | 15,9 KiB | 30,6 KiB | citações e depoimentos (`font-serif italic`) |

Não há peso 500/800 declarado: `font-medium` cai em 400 e `font-extrabold` em 900,
que é como o site já renderizava quando as fontes vinham do Google.

### Famílias por landing (ainda no Google Fonts)

| Rota | Família | Pesos pedidos | Bytes baixados (latin) |
|---|---|---|---|
| `/orlando` | Outfit (variável) | 400;500;600;700;900 | 31,5 KiB — **um** arquivo para todos os pesos |
| `/orlando` | Space Mono (estática) | 400;700 | 16,1 + 16,3 KiB (baixa `latin-ext` também) |
| `/lollapalooza` | Outfit (variável) | 300;400;600;700;900 | 31,5 KiB |
| `/beto-carrero` | Fredoka (variável) | 300;400;600;700 | 29,0 KiB |
| `/beto-carrero` | Nunito (variável) | 400;600;700;800 | 38,2 KiB |

Os pesos 500 e 600 do Outfit foram acrescentados em `/orlando` nesta mudança: as
regras `font-weight: 500/600` de `pages/landings/orlando.css` não tinham face
correspondente e caíam na de 400. Como o Outfit é variável e o Google serve o mesmo
arquivo para todos os pesos declarados, a correção custou zero byte.

## As três descobertas que orientaram a decisão

**1. Trocar de peso não muda nada em fonte variável.** Merriweather, Outfit, Fredoka e
Nunito são variáveis no Google Fonts: o `css2` devolve @font-face separadas por peso
apontando para a *mesma* URL. Tirar Merriweather 700 do `index.html`, por exemplo,
economizava exatamente 0 byte. Toda tentativa de "reduzir pesos" nessas famílias é
inócua — o que pesa é o arquivo variável inteiro.

**2. O Merriweather do Google custa 95 KiB por causa dos eixos.** São três eixos
(`opsz`, `wdth`, `wght`). Instanciando em pesos estáticos com `opsz` fixo em 18 (o
padrão do eixo, e o corpo do blog), o mesmo subconjunto `latin` cai para 43,7 KiB.

**3. `kern` responde por ~30 KiB de cada face do Merriweather.** Descartando a tabela,
`latin` vai de 43,7 KiB para 14,2 KiB. Renderizando o mesmo parágrafo em português a
18px no Chromium, com e sem `kern`, a largura do texto muda **0,85%** e as capturas são
indistinguíveis — a família já tem sidebearings bem ajustados. É a única feature
OpenType descartada, e só nessa família: no Poppins a tabela `kern` não muda o tamanho
do arquivo, então continua lá. `liga`, `clig`, `ccmp`, `mark` e `mkmk` são preservadas
em todas as faces (acentuação e ligaduras intactas).

## Decisões de carregamento

**`font-display: swap` em todas as faces** — mesmo comportamento de antes, sem texto
invisível. A janela de swap encurtou por tabela: o CSS com os `@font-face` viaja no
bundle que o `<head>` já carrega, então não há mais o encadeamento
`CSS do googleapis → arquivo no gstatic` com abertura de duas conexões novas.

**Nenhum `<link rel="preload">` de fonte.** O `index.html` é o mesmo template para toda
rota (ver `HOME_ONLY_PRELOAD_PATTERN` em `lib/prerender-html.js`), e as landings usam
outras famílias — um preload global baixaria Poppins em rota que renderiza Outfit.
Como o CSS que declara as faces já é render-blocking e de mesma origem, o preload
economizaria pouco e desperdiçaria bytes onde a face não é usada. Preload de fonte só
volta a fazer sentido junto com um mecanismo de preload por rota.

**Sem `size-adjust`/métricas de fallback.** Não há regressão de CLS a corrigir (o
comportamento de swap é o mesmo de antes e a fonte chega mais cedo). Casar métricas de
fallback é um ajuste independente, com risco próprio de errar os números; fica como
oportunidade futura, medindo CLS antes e depois.

## Por que as landings ficaram de fora

Auto-hospedar Outfit + Space Mono levaria `/orlando` de 76,4 KiB de terceiro para
~65,7 KiB locais: o ganho real ali é **conexão, não byte** (duas origens a menos), e
custaria mais cinco binários versionados e três landings tocadas. O blog, que era o
caso apontado na issue, já foi resolvido. Se `/orlando` e `/lollapalooza` virarem
destino de mídia paga com meta de LCP, vale abrir issue própria e reaproveitar o mesmo
`scripts/build-fonts.mjs` — ele já aceita qualquer família do repositório
`google/fonts`.

## Como regerar os arquivos

```bash
pnpm fonts:build   # baixa os TTFs oficiais, gera src/fonts/*.woff2 e imprime os tamanhos
```

Commite a saída. O contrato (faces esperadas, existência dos arquivos, ausência de
órfãos, `font-display`, orçamento de bytes por família) é verificado por
`tests/self-hosted-fonts.test.ts`; que o `index.html` não volte a falar com o Google
Fonts é verificado por `tests/index-third-party-scripts.test.ts`.

O `docs/design/brand-system/colors_and_type.css` continua importando do Google Fonts de
propósito: é um preview standalone, aberto direto no browser e fora do bundle do site.
