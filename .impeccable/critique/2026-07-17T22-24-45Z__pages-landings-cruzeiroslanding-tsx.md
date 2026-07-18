---
target: página de cruzeiros
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-07-17T22-24-45Z
slug: pages-landings-cruzeiroslanding-tsx
---
Method: dual-agent (A: general-purpose design review · B: general-purpose detector/browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Sem loading skeleton para imagens lazy (flash de caixa cinza); modal de contato dá feedback correto |
| 2 | Match System / Real World | 4 | Copy em linguagem simples, sem jargão não explicado; FAQ pré-responde termos de cabine |
| 3 | User Control and Freedom | 3 | Modal tem X + rota alternativa; seção de ofertas tem saída explícita ("Conte o que procura") |
| 4 | Consistency and Standards | 3 | Estrutura de card é consistente; **estilo de imagem não é** (colagem vs. foto única vs. cena genérica) |
| 5 | Error Prevention | 3 | Submit desabilitado até validar; opt-in de marketing desmarcado por padrão |
| 6 | Recognition Rather Than Recall | 4 | Cada card de oferta é autocontido |
| 7 | Flexibility and Efficiency of Use | 2 | Sem filtro/ordenação por perfil apesar das tags existirem em cada card |
| 8 | Aesthetic and Minimalist Design | 3 | Tipografia e espaçamento disciplinados; **descasamento de imagem trabalha contra a estética**; parágrafo de fallback excede a regra de 65–75ch do DESIGN.md (achado do detector, ver abaixo) |
| 9 | Error Recovery | 2 | Não testado ao vivo (nenhum envio inválido disparado); padrão de prevenção é bom mas mensagem de recuperação não verificada |
| 10 | Help and Documentation | 3 | FAQ accordion (primeiro item pré-expandido) cumpre esse papel adequadamente |
| **Total** | | **30/40** | **Good (28–35)** |

## Anti-Patterns Verdict

**Avaliação LLM (Assessment A):** A camada de tipografia/layout/copy resiste aos tells óbvios: só Poppins, sem eyebrow uppercase repetido em cada seção, "Como funciona" ganha seu 01/02/03 (é uma sequência real de 3 passos), e "Por que curadoria?" quebra deliberadamente a proibição de grade de cards idêntica com um card central preenchido. Essa parte não pareceria "feita por IA".

A imagem, sim. Cruzando `data/cruiseOffers.ts` com o que renderiza: **nenhum dos 5 cards de oferta mostra navio, cabine ou deck de piscina de verdade** — toda imagem é foto de blog/destino reaproveitada, e várias são geograficamente erradas para o próprio roteiro anunciado (MSC Grandiosa, roteiro Mediterrâneo, usa foto de rua em Lisboa; Costa Diadema e Norwegian Getaway, roteiros brasileiros, usam fotos de blog do Caribe; a oferta **featured** — o elemento visual mais proeminente da página — usa foto de um post de blog sobre viagem solo feminina, sem navio nenhum). Numa marca cujo discurso inteiro é "curadoria confiante", mostrar a foto de estoque do continente errado ao lado da nota curatorial que explica por que aquela saída específica foi escolhida é exatamente o padrão de "imagem genérica em briefing image-led" citado como proibição no registro de marca — e mina a única coisa que esta página deveria provar.

**Scan determinístico (Assessment B):**
- **CLI (`detect.mjs --json` contra o arquivo-fonte): exit 0, `[]` — limpo, nenhum achado estático.**
- **Overlay no browser ao vivo (`/cruzeiros`, servidor de detecção injetado)**: grupo de console reportou "4 anti-patterns found" com **6 linhas de achado**:
  1. `all-caps-body` — uppercase em 35 caracteres do kicker do hero ("Cruzeiros · Brasil e internacionais")
  2. `line-length` — ~138 caracteres/linha no parágrafo "Não achou a saída ideal?" (o DESIGN.md documenta máximo de 65–75ch de largura de coluna para body text — **achado real, confirmado pela regra do próprio design system**)
  3. `body-text-viewport-edge` — um `<p>` de 49 caracteres encostando na borda do viewport (esquerda 0px)
  4. `single-font` — único font usado é poppins
  5. `bounce-easing` — `animation: var(--animate-bounce)` no `body`
  6. `layout-transition` — `transition: height` no `body`

**Divergência CLI vs. browser:** o scanner estático não pega nada porque os achados 2–6 dependem de estilo computado/viewport em runtime (Tailwind resolvido, largura real da coluna) — não é uma contradição entre as ferramentas, é a diferença esperada entre análise estática e DOM ao vivo.

**Falsos positivos identificados:**
- `single-font` — o design system da Anhangá (DESIGN.md, "A Regra da Voz da Marca") determina Poppins como voz única da interface por decisão deliberada; Merriweather é reservada só ao blog. A Assessment A confirma independentemente essa leitura ("Poppins only" listado como ponto forte, não como defeito). **Falso positivo neste projeto especificamente** — a regra genérica do detector não conhece a exceção documentada.
- `bounce-easing` / `layout-transition` — disparados no elemento `body`, não em um componente específico de `CruzeirosLanding.tsx`. Provável utilitário Tailwind global (`--animate-bounce`, definido no design system para outros componentes) sendo capturado pela regra genérica, não um anti-padrão autoral desta página. Vale confirmar se vem do shell/layout compartilhado, mas não é uma correção a fazer neste arquivo.
- `all-caps-body` — tecnicamente é `text-transform: uppercase` em texto de corpo, mas é exatamente o uso do papel tipográfico **Label** do DESIGN.md (Poppins 900 12px uppercase, kicker único, não repetido por seção) — o padrão que o próprio sistema define como aceitável. Não é o anti-padrão de "eyebrow repetido"; é uso correto do token.

**Achados que sobrevivem como reais:** `line-length` (confirmado pela própria regra do DESIGN.md) e `body-text-viewport-edge` (mesmo parágrafo, provável mesma causa raiz: `<p className="mt-10 text-zinc-600">` sem `max-w-*` dentro do container `max-w-6xl`, que é bem mais largo que a coluna de leitura recomendada).

**Overlays visuais:** a injeção funcionou e o overlay foi capturado durante a avaliação (badges amarelos sobre o kicker e três badges fixos no topo do viewport), mas o `live-server` foi parado ao final da etapa (limpeza obrigatória do protocolo) — não há overlay persistente visível no seu navegador agora. A screenshot em largura mobile (~390px) ficou inconclusiva (metadados de captura não confirmaram a mudança de viewport); tratar qualquer leitura mobile como não verificada visualmente, embora o code-read confirme touch targets ≥44px e CTAs full-width.

## Overall Impression

O sistema de design está sendo seguido com disciplina real — motion, acessibilidade e hierarquia de cards são craft de verdade, não teatro. O problema não é a estrutura, é o conteúdo visual: a página promete curadoria pessoal e entrega fotos de estoque desencontradas do roteiro que está descrevendo. Essa é a maior oportunidade única: substituir a imagem das ofertas por fotografia real de navio/roteiro, começando pela oferta featured.

## What's Working

1. **Reduced-motion e no-JS são resolvidos de verdade, não apenas declarados.** `MotionConfig reducedMotion="user"` + o `<noscript>` que força `opacity:1` (com comentário explicando que o framer-motion serializa `initial` no HTML pré-renderizado) atende ao requisito de acessibilidade do PRODUCT.md sem deixar como suposição.
2. **A hierarquia featured-vs-secundário + card central preenchido funciona de verdade.** Nas duas instâncias (ofertas, "Por que curadoria") a proibição de grade idêntica é quebrada por escala/peso, não só cor — e o código cita a regra do design system como motivo, mostrando que foi decisão deliberada.
3. **O modal de contato não tem dark patterns.** Opt-in de marketing desmarcado por padrão, submit desabilitado (não falha silenciosamente) até validar, campo de nome com autofocus.

## Priority Issues

**[P1] Imagem das ofertas é geograficamente errada e não mostra navios, minando o discurso de curadoria**
- **Why it matters:** A promessa central da página é "escolhemos esta saída especificamente para você" (toda `notaCuratorial` reforça isso). Um visitante que reconhece que Lisboa não é uma escala Mediterrânea, ou percebe que a foto "featured" não tem nada a ver com cruzeiro, lê o descompasso como descuido — o oposto de curadoria confiante.
- **Fix:** Fotografia real de navio/roteiro pelo menos para a oferta featured e as duas mais erradas geograficamente (MSC Grandiosa, Costa Diadema); aposentar o reaproveitamento de fotos de blog em `data/cruiseOffers.ts`.
- **Suggested command:** `/impeccable harden`

**[P2] Âmbar se repete em todos os CTAs de card na seção de ofertas**
- **Why it matters:** O variant `primary` do `Button` (usado em todo "Falar sobre este"/"Quero saber mais") carrega `shadow-hard-yellow` por padrão. Com 4–5 cards visíveis num mesmo scroll, isso é 4–5 sombras âmbar na tela simultaneamente — versão suave da violação da "Regra do Âmbar" (máx. 1 elemento por tela), distinta da violação mais grave de fundo âmbar (que a página evita corretamente no hero e CTA final). O acento para de sinalizar quando se repete.
- **Fix:** Trocar os botões de card de `variant="primary"` para `variant="action"` (pílula azul, sem sombra âmbar) — reserva o âmbar só para os dois CTAs de nível de página.
- **Suggested command:** `/impeccable quieter`

**[P2] Parágrafo de fallback das ofertas excede a largura de coluna documentada (65–75ch)**
- **What:** `<p className="mt-10 text-zinc-600">Não achou a saída ideal? ...</p>` não tem `max-w-*` dentro do container `max-w-6xl` — o detector mediu ~138 caracteres/linha em desktop, e um segundo achado (`body-text-viewport-edge`) provavelmente tem a mesma causa raiz.
- **Why it matters:** O próprio DESIGN.md define "Máximo 65–75ch de largura de coluna" para body text — este é um desvio documentado da regra do sistema, não uma opinião externa.
- **Fix:** Envolver o parágrafo em `max-w-2xl` ou similar, consistente com os outros parágrafos de corpo da página.
- **Suggested command:** `/impeccable typeset`

**[P2] Linha órfã na grade de ofertas secundárias em `lg` com 4 itens**
- **What:** Com 4 ofertas secundárias, `lg:grid-cols-3` deixa o 4º card sozinho numa nova linha com duas colunas vazias ao lado. Confirmado em 1440px; `sm:grid-cols-2` (abaixo de `lg`) empilha corretamente.
- **Why it matters:** Só aparece em desktop com exatamente 4 ofertas secundárias, mas é um momento visivelmente quebrado numa página disciplinada.
- **Fix:** Limitar ofertas secundárias a 3 ou 6 (contagens grid-friendly) via o agendamento de ofertas, ou ajustar a grade para não esticar um card órfão.
- **Suggested command:** `/impeccable layout`

**[P3] Trio de estatísticas quebra o paralelismo ("Em cruzeiros")**
- **What:** "Sobre a Anhangá Viagens" mostra `2018 / Fundada em`, `5.0 / Nota Google`, `Em cruzeiros / Especialistas` — as duas primeiras são valores quantitativos, a terceira inverte o padrão com uma frase de categoria no lugar do "número grande".
- **Why it matters:** Pequeno tropeço de leitura; parece preenchimento para completar um trio, não uma credencial real.
- **Fix:** Substituir por um número real (anos de experiência combinada, cruzeiros vendidos) ou reduzir para duas estatísticas.
- **Suggested command:** `/impeccable clarify`

## Persona Red Flags

**Jordan (Confused First-Timer):** A primeira ação (pílula azul "Falar com especialista") é visível em 5 segundos e sem jargão. Nenhum termo de cruzeiro não explicado na página em si — "interna", "varanda", "suíte" são apresentados juntos no FAQ antes de Jordan precisar deles. A ação de "falar com especialista" abre um modal claramente rotulado com campo de nome em autofocus — confirmação imediata de que o clique funcionou. Onde Jordan ainda tropeça: a foto da oferta featured (mulher sozinha num barco, sem navio visível) não confirma visualmente "isto é um cruzeiro" — pequena lacuna de confiança bem no primeiro ponto real de decisão.

**Riley (Deliberate Stress Tester):** Confirmado via código (não testado ao vivo): `hasOffers` falso esconde toda a seção de ofertas e a página ainda se sustenta — "Como funciona", "Por que curadoria", "Sobre" e o CTA final permanecem. A linha órfã de 4 ofertas secundárias em `lg` (P2 acima) é o edge case confirmado ao vivo. A string de roteiro mais longa da página quebra limpo em duas linhas no mobile sem estourar o card.

**Casey (Distracted Mobile User):** Em 390px, o CTA do hero e o "Falar sobre este" de cada card são full-width, bem acima do piso de 44×44px — boa alcançabilidade de polegar. Imagens lazy-load com placeholder cinza visível antes do fade-in, sem layout shift (LazyImage reserva o aspect-ratio). Casey vê **dois botões estilo-CTA na primeira tela mobile**: a pílula azul do header fixo e o botão âmbar do hero, ambos acima da dobra simultaneamente — padrão defensável (ação utilitária persistente vs. CTA de página, variantes diferentes), mas vale nomear porque Casey tem pouca paciência para pedidos que parecem redundantes.

## Minor Observations

- Ícone do logo no header renderizou como avião de papel numa aba mobile fresca vs. um ícone diferente (voluta) na aba desktop inicial — provável artefato de asset/cache entre abas do navegador, não bug de página; vale checar rapidamente mas não bloqueia.
- Colagem de 3 fotos no card `Costa Diadema` destoa do padrão de foto única dos outros cards secundários — deve se resolver junto com o fix de imagem do P1.
- FAQ com primeiro item pré-expandido é bom default — reduz a incerteza de "tem conteúdo aqui" para quem só passa o olho.
- `RegionBadge` ("PORTO DE SAÍDA · DATA") dá escaneabilidade sem adicionar mais um eyebrow repetido acima de cada seção — boa contenção.

## Questions to Consider

1. Se a proposta de valor inteira da página é "curadoria confiante — escolhemos esta saída específica para você", por que toda imagem de oferta vem de um post de blog não relacionado em vez do navio ou destino que ela descreve de fato?
2. A repetição do âmbar na grade de ofertas (via `shadow-hard-yellow` em cada CTA de card) foi uma escolha consciente para esta página, ou é só o que o variant `primary` compartilhado do `Button` faz em todo lugar, sem exame?
3. Com `hasOffers` podendo virar falso e esconder toda a seção "Seleção da temporada", alguém já olhou a página nesse estado ao vivo, ou a coerência dela é só uma inferência de leitura de código?
