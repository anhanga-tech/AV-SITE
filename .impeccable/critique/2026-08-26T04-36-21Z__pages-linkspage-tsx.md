---
target: /links
total_score: 21
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-26T04-36-21Z
slug: pages-linkspage-tsx
---
# Critique de `/links`

**Method:** dual-agent (Assessment A e Assessment B rodaram como sub-agentes isolados e paralelos, sem visibilidade um do outro — nenhum recebeu a crítica anterior deste mesmo slug).

## Design Health Score

| # | Heurística | Nota | Achado principal |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Sem sinal de "abre em nova aba" para WhatsApp/links externos ([components/links/LinkButton.tsx:82-96](components/links/LinkButton.tsx:82-96)); o acordeão "Ver mais páginas de viagem" depende só do marcador nativo do `<details>` ([pages/LinksPage.tsx:198-201](pages/LinksPage.tsx:198-201)). |
| 2 | Match Between System and Real World | 4/4 | Copy idiomática e calorosa, fiel à voz do PRODUCT.md em cada CTA ("Qual é o próximo passo da sua viagem?", [pages/LinksPage.tsx:121-122](pages/LinksPage.tsx:121-122)). |
| 3 | User Control and Freedom | 3/4 | O padrão "rebaixar, não esconder" da porta de intenção não escolhida preserva reversibilidade ([pages/LinksPage.tsx:56-57,82-83](pages/LinksPage.tsx:56-57)); falta uma saída rápida de volta ao topo — `BackToTop` segue excluído desta rota ([App.tsx:46,81](App.tsx:46)). |
| 4 | Consistency and Standards | 3/4 | O anel de foco é âmbar em toda a página ([components/links/LinkButton.tsx:32](components/links/LinkButton.tsx:32), [pages/LinksPage.tsx:136,150,199](pages/LinksPage.tsx:136)) contra o `outline-anhanga-action` ciano que o DESIGN.md documenta "em todas as variantes" — e o próprio `CookieConsentBanner` da mesma página segue a regra corretamente ([components/CookieConsentBanner.tsx:70,77](components/CookieConsentBanner.tsx:70)). |
| 5 | Error Prevention | 3/4 | `href ?? '#'` em links externos falha silenciosamente se uma config futura omitir a URL ([components/links/LinkButton.tsx:90](components/links/LinkButton.tsx:90)). |
| 6 | Recognition Rather Than Recall | 3/4 | Os quatro destinos em destaque não têm `icon` ([data/linksPage.ts:76-79,83](data/linksPage.ts:76-79)), reduzindo o único âncora visual de reconhecimento do sistema a texto puro. |
| 7 | Flexibility and Efficiency of Use | n/a | Página de diretório em modo Persuade; sem fluxo recorrente de usuário a acelerar. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Os quatro destinos renderizam como pílulas brancas idênticas — mesmo padding, mesma sombra `shadow-float`, mesma ausência de ícone ([components/links/LinkButton.tsx:48-56](components/links/LinkButton.tsx:48-56)). |
| 9 | Help Users Recognize, Diagnose, Recover from Errors | n/a | Página estática sem entrada de formulário; a falha silenciosa de link já está capturada em Error Prevention (#5) — não há estado de erro voltado ao usuário para "recuperar". |
| 10 | Help and Documentation | n/a | Padrão de lista de links universalmente compreendido; nenhuma documentação contextual é esperada nesse gênero. |
| **Total** | | **21/28** | **Bom (75%)** |

*(7 heurísticos aplicáveis; 7, 9 e 10 marcados n/a pela regra de modo Persuade.)*

## Veredito de especificidade de design

**Ainda específico na pele, mas o esqueleto ficou mais coerente com o próprio sistema — e revelou onde a genericidade realmente mora.**

**Avaliação (Assessment A):** O que é genuinamente autoral continua invisível numa captura de tela: a mensagem de WhatsApp que declara a origem real do clique em vez de assumir Instagram ([utils/linksTracking.ts:85-109](utils/linksTracking.ts:85-109)), e o pedido de orçamento pré-estruturado ([data/linksPage.ts:71](data/linksPage.ts:71)). Mas nenhum dos quatro `<h2>` de seção usa o `SectionHeader` — o componente-assinatura do próprio DESIGN.md (badge + headline + subtítulo) — preferindo `<h2>` ad hoc ([pages/LinksPage.tsx:179,187,214,226](pages/LinksPage.tsx:179)). E o achado mais concreto: os quatro destinos em destaque (Orlando, Beto Carrero, Melhor Idade, Cruzeiros) não têm `icon` em `data/linksPage.ts:76-79,83`, então caem todos no mesmo tier quieto (`shadow-float`, `bg-white/90`) e viram pílulas brancas indistinguíveis — o "cards idênticos em grade repetida" que o próprio DESIGN.md bane, na seção de maior peso emocional da página (escolher destino).

**O que mudou desde a crítica anterior:** dos cinco problemas prioritários da rodada de 2026-08-26T02:59, quatro foram genuinamente corrigidos e verificados linha a linha nesta sessão: o tier `shadow-hard` agora é reservado só a `highlight`/`primary` — comentário explícito no código cita a regra do DESIGN.md ([components/links/LinkButton.tsx:34-43](components/links/LinkButton.tsx:34-43)); todo `text-white` puro virou `text-white/90` ou variantes de opacidade equivalentes; o grid de cards de intenção agora recebe uma classe de `col-span` condicional quando só um ramo está visível (`soleIntentCardSpanClass`, [pages/LinksPage.tsx:76,136,150](pages/LinksPage.tsx:76)); e os botões do banner de cookies agora usam `min-h-11` (44px) em todo breakpoint, com comentário citando o piso do DESIGN.md ([components/CookieConsentBanner.tsx:65-77](components/CookieConsentBanner.tsx:65)). O quinto — "guiar por intenção sem reduzir o inventário" — foi resolvido por rebaixamento tipográfico reversível (não por ocultar), e as duas avaliações desta rodada, cegas uma da outra, tratam essa escolha como acerto, não como pendência.

**Scan determinístico (Assessment B):** `node detect.mjs --json pages/LinksPage.tsx components/links components/CookieConsentBanner.tsx` retornou exit code 0, `[]` — zero achados, confirmado sem supressão via config ou comentários `impeccable-disable`. Ressalva de escopo repetida e ainda válida: para `.tsx` o detector roda só o motor regex de texto (gradient-text, side-tab borders, bounce easing, paleta roxa, fonte do sistema, `<img>` quebrada) — não checa contraste, touch target, uso indevido de hard-shadow, nem as regras nomeadas do DESIGN.md. Zero achados aqui não certifica os problemas abaixo; eles só aparecem na revisão manual. Nenhum falso positivo (conjunto vazio).

**Overlays visuais:** indisponíveis nesta sessão — nenhuma ferramenta de automação de navegador (Playwright/Puppeteer) está exposta; confirmado por ambas as avaliações de forma independente. Nenhum servidor local foi iniciado. Toda leitura de comportamento visual vem de JSX/Tailwind literal.

## Impressão geral

O trabalho de correção desde a última crítica foi real e verificável, não cosmético: quatro de cinco problemas prioritários anteriores têm evidência de código que os resolve, e a carga cognitiva caiu de "alta/crítica" para "moderada" (ver abaixo). O que resta é mais estreito e mais específico do que antes: a seção com a decisão de maior peso emocional da página — qual destino escolher — entrega quatro opções fisicamente idênticas, sem nenhum sinal curatorial além da ordem em que aparecem no arquivo de config. Não é mais "a página inteira vira diretório"; é "a página vira diretório exatamente no momento em que promete o oposto."

## O que está funcionando

- A disciplina de hard-shadow foi restaurada: `pressPrimary` (peso físico total) agora é exclusiva de `highlight`/`primary`, e todo o resto usa `pressQuiet` (`shadow-float`, sem offset direcional) — com o próprio comentário do código citando a regra do DESIGN.md ([components/links/LinkButton.tsx:34-43](components/links/LinkButton.tsx:34-43)). A crítica anterior apontou exatamente essa diluição como P1; hoje é o contrato mais bem guardado da página.
- O rebaixamento tipográfico da porta de intenção não escolhida é reversível por design, nunca esconde conteúdo, e tem cobertura de teste real ([pages/LinksPage.tsx:56-57,77-83](pages/LinksPage.tsx:56-57), [tests/links-page-data.test.ts](tests/links-page-data.test.ts)) — Controle do Usuário sem custo de Prevenção de Erro.
- `LinkButton` usa padding/gap/slot de ícone em `px` (não `rem`), deliberadamente, para sobreviver a zoom de texto 200% sem scroll horizontal ([components/links/LinkButton.tsx:26-32](components/links/LinkButton.tsx:26-32)) — engenharia de acessibilidade incomum para uma página de link-in-bio, com comentário explicando o porquê.

## Carga cognitiva

**2 de 8 itens falham → carga moderada** (queda real frente aos 6/8 da rodada anterior). Falham:
- **Chunking**: "Conheça destinos e ideias" renderiza 5 itens (quiz + 4 destinos em destaque) antes de qualquer disclosure — acima do limite de 4 ([pages/LinksPage.tsx:190-195](pages/LinksPage.tsx:190), [utils/linksPageLayout.ts:3-4](utils/linksPageLayout.ts:3)).
- **Escolhas mínimas**: mesma seção, mesmo motivo — 5 opções simultâneas num único ponto de decisão.

Passam os outros 6, com destaque para **progressive disclosure** real (os 3 destinos restantes — consultoria, corporativo, Lollapalooza — ficam genuinamente atrás do `<details>` "Ver mais páginas de viagem", com teste de regressão cobrindo o comportamento) e **foco único** (o rebaixamento tipográfico da porta não escolhida reduz, mas não elimina, a competição visual pós-escolha).

## Jornada emocional

- **Chegada:** forte e sem mudança — "Qual é o próximo passo da sua viagem?" entrega a promessa de marca de imediato, sobre o fundo escuro íntimo que o PRODUCT.md pede para o contexto noturno/mobile.
- **Decisão:** limpa — WhatsApp + duas portas de intenção rotuladas, 3 opções, dentro do orçamento de memória de trabalho.
- **Vale:** localizado, não mais difuso — é especificamente "Conheça destinos e ideias" ([pages/LinksPage.tsx:185-210](pages/LinksPage.tsx:185)): quatro pílulas brancas idênticas sem ícone nem sinal de recomendação, exatamente onde a marca promete "curadoria confiante."
- **Final:** ainda fraco — `TrustSeals` fecha a página com Cadastur + "Nota 5.0 no Google" sem nenhum denominador visível ([components/links/TrustSeals.tsx:14-25](components/links/TrustSeals.tsx:14-25)), embora `data/googleReviews.json` tenha `totalReviews: 3` disponível e nunca exibido. Prova social real existe no dado, mas não chega à tela — e o encerramento segue sendo administrativo, não caloroso.

## Problemas prioritários

### [P1] Os quatro destinos em destaque são pílulas idênticas e sem ícone, na seção de maior peso emocional da página

**Por que importa:** `orlando`, `beto-carrero`, `melhor-idade` e `curadoria-cruzeiros-brasil` não têm campo `icon` em `data/linksPage.ts:76-79,83`; sem `highlight`/`primary`, todos caem no mesmo tier `pressQuiet` de `components/links/LinkButton.tsx:48-56` — mesmo padding, mesma sombra, mesmo peso tipográfico. É o "cards idênticos em grade repetida" que o próprio DESIGN.md bane ([DESIGN.md, Don'ts](DESIGN.md)), e o oposto de "curadoria sobre catálogo" do PRODUCT.md, no exato ponto em que a persona de família/casal decidindo à noite (ver personas abaixo) precisa de um sinal de autoridade.

**Correção:** o próprio DESIGN.md já prescreve o remédio sem pedir fotos novas — "variar dimensão, peso tipográfico, ou hierarquia visual entre os itens." Caminho mais barato: atribuir um ícone Phosphor distinto a cada destino (o slot de ícone já existe e já reserva `w-[24px]`, [components/links/LinkButton.tsx:64-66](components/links/LinkButton.tsx:64-66)) e considerar um `sublabel` curatorial em pelo menos um item (ex.: "o mais pedido em dezembro").

**Comando sugerido:** `/impeccable delight`

### [P2] O anel de foco é âmbar em toda a página, contra o ciano documentado — e o componente vizinho já faz certo

**Por que importa:** `focus-visible:ring-anhanga-yellow` aparece em todo elemento focável da página ([components/links/LinkButton.tsx:32](components/links/LinkButton.tsx:32); [pages/LinksPage.tsx:136,150,199](pages/LinksPage.tsx:136)), enquanto o DESIGN.md prescreve `outline-anhanga-action` (ciano) "em todas as variantes" — e `CookieConsentBanner`, na mesma página, segue a regra corretamente ([components/CookieConsentBanner.tsx:70,77](components/CookieConsentBanner.tsx:70)). Não é um problema de contrastes ou de acessibilidade funcional (o anel âmbar é bem visível sobre o fundo escuro), mas é um desvio sistemático e não documentado do único sinal de foco que o DESIGN.md padroniza — e o `<summary>` do "Ver mais" ainda perde o `ring-offset-2` que todo outro controle da página carrega ([pages/LinksPage.tsx:199](pages/LinksPage.tsx:199)), produzindo uma inconsistência visível dentro da própria página, não só contra o token.

**Correção:** se o âmbar for uma escolha deliberada (lê melhor sobre o fundo escuro do que o ciano), documentar a exceção no DESIGN.md; caso contrário, alinhar ao token documentado e adicionar o `ring-offset-2` que falta no `<summary>`.

**Comando sugerido:** `/impeccable polish`

### [P2] A página termina em nota administrativa, escondendo a prova social real que já existe no dado

**Por que importa:** `TrustSeals` ([components/links/TrustSeals.tsx:14-25](components/links/TrustSeals.tsx:14-25)) é o último conteúdo da página — Cadastur, "Nota 5.0 no Google" sem número de avaliações, "ANHANGA TURISMO LTDA" em forma jurídica pura. `data/googleReviews.json` já tem `totalReviews: 3` calculado e nunca exibido na UI. Pelo peak-end rule, o fechamento é burocrático, não caloroso — em tensão com a anti-referência do PRODUCT.md contra "frieza transacional," e uma lacuna suave de credibilidade exatamente para quem decide a viagem da família à noite.

**Correção:** exibir "5.0 · 3 avaliações" (o dado já existe, não precisa de nova coleta) para honestidade e prova social mais forte; considerar uma linha de despedida calorosa antes do selo legal, em vez de terminar rente a ele.

**Comando sugerido:** `/impeccable clarify`

### [P3] Fallback silencioso de `href` para links externos mal configurados

**Por que importa:** `const href = item.href ?? '#'` ([components/links/LinkButton.tsx:90](components/links/LinkButton.tsx:90)) renderiza um botão com aparência de vivo mas morto se uma entrada `external` futura omitir `href`. `data/linksPage.ts` é explicitamente marcado "⚙️ EDITÁVEL" para não-engenheiros ([data/linksPage.ts:42](data/linksPage.ts:42)), e o teste de regressão existente cobre o conteúdo da config atual, não esse fallback de runtime.

**Correção:** falhar de forma visível em dev (throw/console.error) em vez de renderizar silenciosamente `href="#"`.

**Comando sugerido:** `/impeccable harden`

## Red flags por persona

### Sam — usuária dependente de leitor de tela / navegação por teclado

- O anel de foco âmbar (em vez do ciano documentado) ainda é funcionalmente visível, mas o `<summary>` do "Ver mais páginas de viagem" perde o `ring-offset-2` que todo outro controle da página tem ([pages/LinksPage.tsx:199](pages/LinksPage.tsx:199)) — um tratamento de foco visivelmente mais fino no meio da sequência de tabulação, sem razão aparente para quem navega linearmente.
- Ativar um card de intenção muda o peso tipográfico da seção não escolhida (`sectionHeadingClass`, [pages/LinksPage.tsx:56-57](pages/LinksPage.tsx:56)) puramente por CSS — nada é anunciado a tecnologia assistiva sobre essa mudança de estado.

### Casey — usuária mobile distraída

- Os dois cards de intenção ([pages/LinksPage.tsx:132-158](pages/LinksPage.tsx:132)) têm fundo, anel e leiaute quase idênticos, diferenciados só por ícone e uma linha de subtexto pequeno — convite a um toque rápido errado.
- As quatro linhas de destino são igualmente indiferenciadas ([data/linksPage.ts:76-79,83](data/linksPage.ts:76-79)); com `BackToTop` excluído desta rota ([App.tsx:46,81](App.tsx:46)), não há atalho de volta ao WhatsApp do topo depois de rolar por ~10 botões.

### Sônia — decide pela família à noite (persona derivada do PRODUCT.md)

- Tocar em "Ainda estou escolhendo" — copy escrita para falar diretamente com a situação dela — a leva a quatro destinos com peso visual idêntico ([pages/LinksPage.tsx:190-195](pages/LinksPage.tsx:190)), sem nenhum sinal curatorial além da ordem crua da config. A página promete autoridade curada no topo e entrega um menu achatado uma tela depois.
- A prova de legitimidade construída exatamente para a ansiedade dela ("em quem confiar?") — Cadastur, razão social real, nota real do Google — chega ao fim da rolagem sem o número de avaliações que tornaria a nota verificável, mesmo esse dado já existindo no arquivo `data/googleReviews.json:3`.

## Observações menores

- Nenhum dos quatro `<h2>` de seção usa o componente-assinatura `SectionHeader` (badge + headline + subtítulo) que o DESIGN.md documenta; são `<h2>` ad hoc ([pages/LinksPage.tsx:179,187,214,226](pages/LinksPage.tsx:179)) — mais um ponto a favor do veredito "específico na pele, genérico no esqueleto."
- Sem sinal visível/ARIA de "abre em nova aba" para links de WhatsApp/externos ([components/links/LinkButton.tsx:82-96](components/links/LinkButton.tsx:82-96)).
- "Outros acessos" é uma seção completa — `<h2>` e `<nav>` próprios — para um único link na config atual ("Site oficial", [pages/LinksPage.tsx:224-234](pages/LinksPage.tsx:224)).
- O banner do quiz (`banner.visible: false`) continua config-latente: reativá-lo sem também remover `highlight` do WhatsApp recriaria dois elementos Âmbar Vivo sólidos ao mesmo tempo — já sinalizado no próprio comentário do arquivo ([data/linksPage.ts:56-59](data/linksPage.ts:56)); watch-item, não bug ativo.
- A mensagem do WhatsApp principal ("Quero planejar uma viagem. Meu destino:") e a seção de orçamento ("Já tem destino e datas?") seguem mirando intenções próximas o suficiente para gerar uma ambiguidade leve de "qual botão eu uso."
- `detect.mjs` seguiu retornando zero achados — confirma ausência de gradient-text/side-tabs/bounce/paleta roxa, não a saúde geral da página (ver Scan determinístico acima).

## Perguntas para destravar uma solução melhor

- O DESIGN.md já dá a receita para diferenciar cards idênticos ("variar dimensão, peso tipográfico, ou hierarquia") — o que impede aplicá-la aos quatro destinos, dado que o slot de ícone já existe no componente e está vazio?
- O anel de foco âmbar aparece em toda a página, mas nunca foi documentado como exceção deliberada — é uma escolha ou um desvio que ninguém decidiu?
- A prova social real (3 avaliações, nota 5.0) já está no dado; por que ela não chega à tela onde a persona que mais precisa dela — decidindo à noite, pelo celular — vai vê-la?
