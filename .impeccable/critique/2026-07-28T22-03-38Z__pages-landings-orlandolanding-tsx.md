---
timestamp: 2026-07-28T22-03-38Z
slug: pages-landings-orlandolanding-tsx
---
# Critique — /orlando (pages/landings/OrlandoLanding.tsx)

Data: 2026-07-28
Método: dual-agent (A: design review · B: detector + browser evidence)
Modo: Persuade
Restrição do dono: identidade scrapbook é DELIBERADA e preservada. Não migrar para DESIGN.md.

## Design Health Score — 20/36

Heurística 7 (Flexibilidade/Eficiência) = n/a (superfície de persuasão, caminho único).

| # | Heurística | Nota | Questão-chave |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Navegação interna não rola; sem feedback de posição em 7.524px |
| 2 | Correspondência com o mundo real | 3 | Metáfora do caderno se sustenta; quebra em "#Por Que Orlando?" e inglês solto |
| 3 | Controle e liberdade | 2 | Âncoras mortas + scroll-behavior smooth global |
| 4 | Consistência e padrões | 1 | Mesma ação com 5 rótulos e 2 cores |
| 5 | Prevenção de erros | 3 | Modal exemplar; "MELHOR PREÇO GARANTIDO" cria expectativa não honrada |
| 6 | Reconhecimento > memorização | 2 | 12 parques identificados só por logotipo, sem nome em texto |
| 7 | Flexibilidade e eficiência | n/a | — |
| 8 | Estética e minimalismo | 2 | 6 texturas + sombras em 4 cores em intensidade máxima simultânea |
| 9 | Diagnóstico e recuperação | 3 | Padrão do repo presente no componente |
| 10 | Ajuda e documentação | 2 | Conteúdo de ajuda bom, posicionado depois do rodapé |

## Veredito de especificidade

Recipiente específico, conteúdo genérico. A direção visual (polaroides com fita, papel pautado
do roteiro, selos costurados) é autoral e nenhuma OTA publicaria. O conteúdo não acompanha:
TEMPO BOM/COMPRAS/GASTRONOMIA é índice de folheto, e "MELHOR PREÇO GARANTIDO" é exatamente a
anti-referência nº 1 do PRODUCT.md. O trabalho não é redesenhar — é o conteúdo alcançar o
recipiente.

## Achados por prioridade

### P0 — Navegação interna morta (produção)
Os 4 âncoras trocam a hash e não rolam nada. Causa: `overflow-x: hidden` em `.landing-orlando`
(orlando.css:29) torna o container o ancestral rolável. Fix: `overflow-x: clip`.
Confirmado independentemente pelo parent: scrollY 0 → 0 com #parks existente.

### P1 — 10 falhas WCAG AA (A e B concordam, mesmos números)
H1 "Orlando" 1,87 (mín 3) · "É SURREAL." 2,60 · CTAs 1,92–2,77 (mín 4,5) · 3 destaques 2,68.
B descartou falso positivo de text-stroke/text-shadow em todos os 10.
Fix sem tocar na paleta: texto dos CTAs de branco → `#1a1a1a` (9,0:1 no verde, 8,5:1 no ciano).
Para os títulos: compor o feltro por cima do creme com blend/opacidade, ou escurecer os acentos
(`--accent-blue: #1a8fb8`, `--accent-pink: #d13b6e`).

### P2 — Peso de imagem: 2,33 MiB, 29 imagens, 0 srcSet
Pior caso: `magic-kingdom.png` 11502×1942 servido para 200×34 = 57,5×, 243 KB.
Os 12 logos vão crus do R2, sem transform Cloudflare. As 12 fotos são AVIF mas a 3,7×.
`generateSrcSet` já existe em lib/media-assets.ts.

### P3 — Mobile quebrado (390px)
Nav cortada nas duas pontas (left −5, right 380 num viewport de 375). H1 sangra (left −12).
3 rótulos de polaroide fatiados por `margin-top: -60px` e pelo selo. 8 alvos de toque < 44px
(nav 20,4px; sociais 23,8px).

### P4 — FAQ e SEO depois do rodapé
Rodapé em 5.713px, FAQ em 6.073px (desktop). As 5 respostas que desarmam o medo da família
(visto, suporte 24h, duração) ficam abaixo da linha de copyright, em outra tipografia.

### P5 — Parallax escapa do prefers-reduced-motion
`OrlandoHero.tsx:79` aplica `card.style.transform` por JS no mousemove. O reset CSS global só
neutraliza animation/transition-duration — não alcança transform inline por JS.
CONFLITO RESOLVIDO: A apontou, B classificou como falso positivo varrendo o CSSOM; a leitura do
código dá razão a A. Fix: guard `matchMedia('(prefers-reduced-motion: reduce)').matches`.

### P6 — Sem :focus-visible próprio
Zero regras de foco em orlando.css. Cai no anel padrão do Chrome (1px azul) numa página de
bordas pretas 2–4px. DESIGN.md exige dois sinais.

## Decisões do dono (não são de design)

1. "MELHOR PREÇO GARANTIDO" contradiz o PRODUCT.md (anti-referência: OTA de comparação de preço).
2. Logos Disney/Universal em página comercial de terceiro — implicação de marca registrada.
3. 12 parques sem opinião/curadoria contraria o princípio 2 (curadoria sobre catálogo).

## Falsos positivos declarados

- `design-system-font` (Space Mono, Outfit) do detector CLI: identidade deliberada confirmada
  pelo dono, mesma exceção da /beto-carrero com Fredoka/Nunito.
- 4 advisories `design-system-color`: cores da paleta scrapbook, idem.
- B classificou o motion como coberto pelo reset global — incorreto para o parallax JS (ver P5).

## Detector CLI

exit 2 — 6 achados: 0 error, 2 warning (fontes), 4 advisory (cores). Todos falso positivo no
contexto da identidade preservada.
