---
target: /links
total_score: 24
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-27T03-55-28Z
slug: pages-linkspage-tsx
---
**Method:** dual-agent (A: `ac5e3dc7f0b24b006` · B: `aa0d91b1eab21fba7`) — as duas avaliações rodaram como sub-agentes isolados e paralelos, sem visibilidade uma da outra, e sem receber o histórico de críticas anteriores deste mesmo slug.

## Design Health Score

**Nota sobre o modo:** o Assessment A classificou `/links` como modo **Operate** (não Persuade, como as rodadas anteriores implicitamente assumiram) — argumento: a persuasão real acontece a jusante, no chatbot BANT; esta página só precisa rotear o visitante para o próximo componente correto. Isso muda quais heurísticos podem ser `n/a`. É uma leitura defensável, mas é uma mudança de enquadramento em relação às rodadas de 2026-08-25/26 — vale uma decisão consciente do time, não uma herança silenciosa.

| # | Heurística | Nota | Achado principal |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Nenhum sinal distingue "abre WhatsApp/site externo" de "navega dentro do site" — os três `type` renderizam identicamente ([components/links/LinkButton.tsx:104-130](components/links/LinkButton.tsx:104-130)). |
| 2 | Match Between System and Real World | 4/4 | "Qual é o próximo passo da sua viagem?" replica o registro de segunda pessoa do PRODUCT.md ([pages/LinksPage.tsx:121-126](pages/LinksPage.tsx:121-126)). |
| 3 | User Control and Freedom | 3/4 | A bifurcação de intenção é reversível em princípio, mas depois de rolar a página não há atalho de volta ao topo/fork — só rolagem manual ([utils/linksPageLayout.ts:70-78](utils/linksPageLayout.ts:70-78)). |
| 4 | Consistency and Standards | 4/4 | Sistema de três tiers aplicado sem exceção ([components/links/LinkButton.tsx:48-56](components/links/LinkButton.tsx:48-56)); o anel de foco agora é ciano/`outline-anhanga-action` em todos os 4 controles focáveis customizados — confirmado por grep — resolvendo o P2 da crítica de 2026-08-26. |
| 5 | Error Prevention | 4/4 | Regra do Âmbar e o teto do tier de peso físico são travados por CI, não só documentados ([tests/links-page-data.test.ts:192-195,201-204](tests/links-page-data.test.ts:192-195)); `href` ausente agora gera `console.error` em dev ([components/links/LinkButton.tsx:67-72,82-85](components/links/LinkButton.tsx:67-72)) — resolve o P3 da crítica anterior. |
| 6 | Recognition Rather Than Recall | 4/4 | Padrão ícone+rótulo+sublabel ([components/links/LinkButton.tsx:87-101](components/links/LinkButton.tsx:87-101)); 10 dos 13 links da config já têm `icon` (confirmado por grep). |
| 7 | Flexibility and Efficiency of Use | n/a | Diretório estático de visita única; não há uso recorrente a acelerar. |
| 8 | Aesthetic and Minimalist Design | 2/4 | 13 entradas em ~5 seções; a seção "Destinos" expõe 5 escolhas simultâneas antes de qualquer disclosure ([pages/LinksPage.tsx:189-196](pages/LinksPage.tsx:189-196)) — em tensão direta com "curadoria sobre catálogo" (PRODUCT.md). |
| 9 | Help Users Recognize, Diagnose, Recover from Errors | n/a | Página estática sem formulário; não há estado de erro gerado pelo usuário para recuperar. |
| 10 | Help and Documentation | n/a | Gênero de lista de links é autoexplicativo; documentação contextual não se aplica. |
| **Total** | | **24/28** | **Bom (86%)** |

*(7 heurísticos aplicáveis; 7, 9 e 10 marcados n/a.)*

## Veredito de especificidade de design

**Específico na voz e na mecânica, ainda genérico na forma e no volume.**

**Avaliação (Assessment A):** o token `{origem}` que reescreve a mensagem de WhatsApp por UTM real ([utils/linksTracking.ts:85-109](utils/linksTracking.ts:85-109)) e o teste de CI que derruba o build se um segundo elemento âmbar aparecer ([tests/links-page-data.test.ts:192-195](tests/links-page-data.test.ts:192-195)) são mecânica de marca proprietária, não boilerplate reskinado. Mas a forma estrutural — coluna central estreita de pílulas full-width empilhadas sobre fundo escuro — é o formato Linktree que qualquer negócio usa, e com ~13 entradas de config ([data/linksPage.ts:66-85](data/linksPage.ts:66-85)) a página se aproxima mais de um índice do site inteiro do que de uma seleção curada, em tensão real com o próprio princípio "curadoria sobre catálogo" do PRODUCT.md.

**Scan determinístico (Assessment B):** `node detect.mjs --json pages/LinksPage.tsx components/links utils/linksPageLayout.ts utils/linksTracking.ts data/linksPage.ts` → exit code `0`, `[]` — zero achados. Ressalva de escopo: o motor `.tsx`/`.ts` é regex para um conjunto fixo de anti-padrões (gradient-text, side-borders, easing bounce, paleta roxa, `<img>` quebrada) — não checa contraste, alvo de toque, uso indevido de hard-shadow, nem as regras nomeadas do DESIGN.md. Zero achados aqui não certifica ausência de problemas de design. Nenhum falso positivo (conjunto vazio).

**Overlays visuais:** indisponíveis nesta sessão — a extensão Chrome não está conectada. Nenhum servidor local foi iniciado para visualização (o dev server levantado para checagem própria foi encerrado ao final desta crítica). Toda leitura visual vem de JSX/Tailwind literal e da grade de tokens do DESIGN.md.

## Impressão geral

O trabalho desde a crítica de 2026-08-26 (score 21/28) é real e verificável: os quatro destinos em destaque ganharam ícone e sublabel curatorial, o anel de foco foi realinhado ao token ciano documentado, o fallback silencioso de `href` ganhou aviso em dev, e a contagem real de avaliações do Google passou a aparecer no rodapé. Score subiu para 24/28 (86%). O centro de gravidade dos problemas restantes migrou: não é mais "pílulas fisicamente idênticas sem sinal algum", é "volume estrutural + falta de sinalização para links que saem do site + um encerramento que ainda fecha em nota administrativa". A oportunidade mais barata e concreta: tirar a seção "Destinos" de 5 para ≤4 escolhas simultâneas — um único ajuste que resolve ao mesmo tempo o achado de carga cognitiva e o heurístico #8.

## O que está funcionando

- **O token `{origem}` nas mensagens de WhatsApp** ([data/linksPage.ts:67,71,75](data/linksPage.ts:67); resolvido por [utils/linksTracking.ts:85-109](utils/linksTracking.ts:85-109)) — cada clique já chega qualificado e com origem real declarada, em vez de um "oi" genérico. É a promessa de curadoria por conversa do PRODUCT.md aparecendo mecanicamente numa página de link-in-bio.
- **A disciplina do Âmbar e do tier de peso físico é travada por teste de CI, não só por convenção** ([tests/links-page-data.test.ts:192-195,201-204](tests/links-page-data.test.ts:192-195)) — confirmado linha a linha: um PR que adicionar um segundo `highlight` ou espalhar hard-shadow por mais de dois itens quebra o build.
- **A bifurcação de intenção rebaixa em vez de esconder** ([pages/LinksPage.tsx:77-83](pages/LinksPage.tsx:77), [utils/linksPageLayout.ts:70-78](utils/linksPageLayout.ts:70-78)) — escolher um caminho nunca remove o outro, respeitando a autonomia de quem ainda está decidindo.

## Problemas prioritários

### [P1] A seção "Destinos" expõe 5 escolhas simultâneas antes de qualquer disclosure

**Por que importa:** quiz + 4 destinos em destaque renderizam como uma única pilha plana ([pages/LinksPage.tsx:189-196](pages/LinksPage.tsx:189-196), `FEATURED_DESTINATION_IDS` em [utils/linksPageLayout.ts:3](utils/linksPageLayout.ts:3)) — o maior bloco não diferenciado da página, logo após o CTA principal, e a violação mais concreta e ao vivo de "curadoria sobre catálogo".

**Correção:** mover um destino para dentro do acordeão "Ver mais páginas de viagem" já existente, ou reorganizar para 2 visíveis + 2 sob disclosure, mantendo a pilha imediata em ≤4.

**Comando sugerido:** `/impeccable distill`

### [P2] Nenhum sinal visual distingue links que saem do site

**Por que importa:** WhatsApp, o parceiro externo (`seguro-viagem` → `go.nuvembr.com`) e rotas internas da SPA renderizam pixel-idênticos ([components/links/LinkButton.tsx:104-130](components/links/LinkButton.tsx:104-130)). Quem toca em "Calcular meu seguro viagem" cai num domínio de terceiro sem aviso — pode ler como link quebrado ou sequestrado numa página cujo trabalho inteiro é construir confiança.

**Correção:** adicionar um glifo `ArrowSquareOut` (já disponível no set Phosphor usado aqui) só em itens `external`, e um `aria-label` indicando "abre em nova aba" para leitores de tela.

**Comando sugerido:** `/impeccable clarify`

### [P2] A página ainda termina em nota administrativa

**Por que importa:** o último conteúdo renderizado é Cadastur + razão social ([components/links/TrustSeals.tsx:16-28](components/links/TrustSeals.tsx:16-28)) — pela regra peak-end, isso pesa desproporcionalmente na impressão final, e uma string estilo CNPJ fechando a visita é o registro "formulário corporativo frio" que o PRODUCT.md rejeita explicitamente. A contagem real de avaliações já foi adicionada desde a última crítica, mas o tom de fechamento continua administrativo, não caloroso.

**Correção:** manter a linha de compliance (ela é necessária e honesta), mas acrescentar uma frase calorosa de despedida acima dela — mudança só de copy, sem componente novo.

**Comando sugerido:** `/impeccable clarify`

### [P3] Entradas do acordeão sem ícone nem sublabel

**Por que importa:** `consultoria-de-viagem`, `corporativo` e `lollapalooza` ([data/linksPage.ts:79-80,84](data/linksPage.ts:79-80)) são os únicos 3 dos 13 links sem `icon` (confirmado por grep) — dentro do acordeão já rebaixado, isso lê como conteúdo inacabado, não como restrição deliberada.

**Correção:** adicionar sublabel de uma linha e ícone Phosphor a cada um, replicando o padrão já estabelecido nos destinos em destaque.

**Comando sugerido:** `/impeccable delight`

### [P3] Hover do TrustSeals cria um segundo elemento âmbar transitório

**Por que importa:** `hover:text-anhanga-yellow` no link do Cadastur ([components/links/TrustSeals.tsx:21](components/links/TrustSeals.tsx:21)) pode aparecer na tela ao mesmo tempo que o botão amarelo fixo do WhatsApp — tensão pontual com a Regra do Âmbar (máximo 1 elemento por tela).

**Correção:** trocar a cor de hover desse link para algo fora da paleta âmbar (ex.: `hover:text-anhanga-action`).

**Comando sugerido:** `/impeccable polish`

## Red flags por persona

**Casey — usuária mobile distraída (chegando de um story do Instagram):** a pilha de 5 itens em "Destinos" são pílulas `bg-white/90` do mesmo tamanho, sem destaque — uma rolagem rápida pode pular Orlando inteiro. Tocar em "Calcular meu seguro viagem" a joga sem aviso no domínio `go.nuvembr.com` ([components/links/LinkButton.tsx:114-121](components/links/LinkButton.tsx:114-121)) — fácil de confundir com link quebrado e abandonar.

**Sam — usuária dependente de leitor de tela:** todo ícone é `aria-hidden="true"` e nenhum link externo/WhatsApp tem `aria-label` de "abre em nova aba" (confirmado por grep: 0 ocorrências de `aria-label`/`role=` em `LinkButton.tsx`/`TrustSeals.tsx`) — Sam recebe o mesmo formato de anúncio para "ficar na página", "abrir o app do WhatsApp" e "sair para um site parceiro". O rebaixamento tipográfico da seção não escolhida ([pages/LinksPage.tsx:56-57](pages/LinksPage.tsx:56)) é só CSS — o leitor de tela anuncia os dois `<h2>` de forma idêntica.

**Dona Célia — decide a viagem da família às 22h no celular (persona derivada do PRODUCT.md):** "Consultoria de Viagem" — plausivelmente exatamente o serviço "só quero que alguém decida por mim" que ela quer — está a dois toques de distância dentro do "Ver mais", sem ícone nem sublabel que expliquem do que se trata ([data/linksPage.ts:79](data/linksPage.ts:79)), ao contrário de "Viagens Melhor Idade", que felizmente já está em destaque.

## Observações menores

- Nenhuma ocorrência de `text-white` puro em nenhum arquivo revisado — toda opacidade de branco é `/60` a `/90`, conforme a Regra do Branco Rebaixado.
- Zero uso do componente-assinatura `SectionHeader` nos quatro `<h2>` de seção de `/links` (confirmado por grep: seu único consumidor no repo é `components/Testimonials.tsx`) — observação que já constava na crítica anterior e segue não corrigida, mas nunca foi P0–P2.
- O banner desativado (`data/linksPage.ts:56-65`, `visible: false`) segue totalmente codificado e testado, mas inativo — watch-item, não bug.
- `formatReviewCountLabel` omite corretamente a contagem quando zero, em vez de mostrar "0 avaliações".
- `detect.mjs` seguiu retornando zero achados — confirma ausência dos anti-padrões regex específicos, não a saúde geral da página.

## Perguntas para destravar uma solução melhor

- Se "curadoria sobre catálogo" é princípio declarado, por que `/links` lista quase todas as rotas do site em vez das 3-4 que a marca de fato recomendaria a um visitante frio chegando do Instagram esta noite — e quem é dono desse corte?
- A bifurcação de intenção e o CTA de WhatsApp já fazem o mesmo trabalho de qualificação que o chatbot faz em outro lugar — `/links` poderia rotear direto para a experiência de chat com BANT, em vez de manter um segundo padrão de diretório em paralelo?
- Mostrar "3 avaliações" de forma tão proeminente constrói mais confiança do que uma nota sem contagem nenhuma, dado que o PRODUCT.md pede cautela contra prova social não conquistada?
