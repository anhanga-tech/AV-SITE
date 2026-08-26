---
target: /links
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-08-26T02-59-51Z
slug: pages-linkspage-tsx
---
# Critique de `/links`

**Method:** dual-agent (Assessment A e Assessment B rodaram como sub-agentes isolados e paralelos, sem visibilidade um do outro).

## Design Health Score

| # | Heurística | Nota | Achado principal |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Feedback tátil rest→hover→active em todo botão; falta sinal de "abre em nova aba" para WhatsApp/links externos. |
| 2 | Match System / Real World | 4/4 | Português fluente, caloroso, sem jargão. |
| 3 | User Control and Freedom | 2/4 | `/links` foi excluída do FAB de Back to Top (`App.tsx:44-46,81`); sem essa saída rápida, é rolagem manual completa para voltar ao WhatsApp. |
| 4 | Consistency and Standards | 2/4 | Cards de intenção usam uma terceira gramática de botão não catalogada; `text-white` puro substitui o token documentado em 7-8 lugares. |
| 5 | Error Prevention | 3/4 | Sistema de guards de visibilidade (`utils/linksPageLayout.ts`) evita seções vazias e links órfãos de forma deliberada. |
| 6 | Recognition Rather Than Recall | 4/4 | Todo ícone tem rótulo; nada escondido em menu. |
| 7 | Flexibility and Efficiency | n/a | Página de diretório em modo Persuade; não há fluxo de usuário recorrente a acelerar. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Meio de rolagem vira pilha de 6+ pílulas quase idênticas com hard-shadow. |
| 9 | Error Recovery | 1/4 | Dois modos de falha silenciosa: fallback `href ?? '#'`/`'/'` e ícone não mapeado rebaixando o tier do botão sem aviso. |
| 10 | Help and Documentation | n/a | Página de diretório em modo Persuade; não se espera documentação de tarefa. |
| **Total** | | **21/32** | **Aceitável (65,6%)** |

*(8 heurísticos aplicáveis; 7 e 10 marcados n/a pela regra de modo Persuade.)*

## Veredito de especificidade de design

**Específico na pele, genérico no esqueleto.**

**Avaliação (Assessment A):** O tom é genuinamente autoral — "Qual é o próximo passo da sua viagem?" ([pages/LinksPage.tsx:92-97](pages/LinksPage.tsx:92-97)) fala a voz "conversa não transação" do PRODUCT.md; os scripts de WhatsApp carregam UTM real e produtos reais ([data/linksPage.ts:60-68](data/linksPage.ts:60-68)); o CADASTUR e a nota do Google em [components/links/TrustSeals.tsx:5-25](components/links/TrustSeals.tsx:5-25) são prova real, não fabricada. Mas a forma geral — pergunta-herói → 2 cards de intenção → pilha achatada de tudo mesmo assim → "ver mais" → rodapé de confiança — é o template atual de "link-in-bio guiado" (estilo Linktree/Beacons). Tirando ícones e copy, o esqueleto não se reduz a nada exclusivamente Anhangá; um concorrente de cruzeiros poderia reskinar os rótulos e publicar a estrutura idêntica. O próprio token visual mais distintivo do sistema — o hard-shadow "peso físico", que deveria ser raro e reservado à ação dominante — aparece em 6 botões na mesma rolagem, o que dilui a assinatura em estilo de lista repetida, não em curadoria.

**Scan determinístico (Assessment B):** `node detect.mjs --json pages/LinksPage.tsx components/links components/CookieConsentBanner.tsx` retornou exit code 0, `[]` (zero achados). **Ressalva de escopo importante:** para arquivos `.tsx`, o detector roda apenas o motor regex de texto (`detect-text.mjs`) — checa gradient-text, side-tab borders, bounce easing, paleta roxa, fonte do sistema, `<img>` quebrada. Os analisadores de página completa (hierarquia tipográfica plana, espaçamento monótono etc.) exigem forma de documento HTML completo e nunca rodaram aqui. Não há nenhuma regra no caminho de código para: contraste, tamanho de touch target, uso indevido de hard-shadow em elemento não-clicável, ou as regras nomeadas do DESIGN.md (Âmbar, Branco Rebaixado). **Zero achados é verdadeiro e ao mesmo tempo não certifica nada sobre os problemas de fundo** — esses só apareceram na revisão manual abaixo. Nenhum falso positivo a reportar (conjunto vazio).

**Overlays visuais:** indisponíveis nesta sessão — nenhuma ferramenta de automação de navegador (Playwright/Puppeteer) está exposta. Ambas as avaliações reconstruíram o comportamento visual por leitura literal de JSX/Tailwind e matemática de contraste WCAG a partir dos valores documentados no DESIGN.md, sem confirmação por screenshot.

## Impressão geral

A página é tecnicamente cuidada por baixo do capô — há testes automatizados reais para a Regra do Âmbar ([tests/links-page-data.test.ts:169-179](tests/links-page-data.test.ts:169-179)), comentários explicando decisões de acessibilidade e de contraste — mas o redesign "guia por intenção" de hoje adicionou uma pergunta de orientação sem reduzir o inventário: as duas avaliações, trabalhando cegas uma da outra, convergem exatamente no mesmo veredito por caminhos diferentes (leitura holística vs. contagem mecânica de itens). A maior oportunidade é fazer a intenção escolhida realmente cortar o que é mostrado a seguir, e devolver o hard-shadow à raridade que o justifica.

## O que está funcionando

- A pergunta-herói e a copy dos cards de intenção encarnam "conversa, não transação" com fidelidade real ao PRODUCT.md, não apenas em nível decorativo.
- A Regra do Âmbar está protegida por um teste automatizado que cobre inclusive o caso de mútua exclusão banner+highlight ([tests/links-page-data.test.ts:169-179](tests/links-page-data.test.ts:169-179)) — uma regra de design como contrato testável, não só aspiração de estilo.
- `LinkButton` usa padding/gap em `px` (não `rem`) deliberadamente para sobreviver a zoom de texto 200% sem scroll horizontal ([components/links/LinkButton.tsx:29-36](components/links/LinkButton.tsx:29-36)) — engenharia de acessibilidade incomumente cuidadosa para uma página de link-in-bio.

## Carga cognitiva

**6 de 8 itens falham → carga alta (correção crítica necessária).** Falham: foco único (5 seções renderizam incondicionalmente abaixo da dobra, não importa qual card de intenção foi tocado), chunking (o `<nav>` de destinos agrupa 5 itens, acima do limite de 4), hierarquia visual (6 botões compartilham o mesmo tier branco+hard-shadow), uma decisão por vez (tocar um card de intenção é apenas um `#anchor`, não esconde nada), escolhas mínimas (12 itens tocáveis por padrão) e progressive disclosure (o único adiamento real é o "Ver mais páginas de viagem" com 3 itens — não relacionado ao mecanismo de intenção, que é a peça central do redesign de hoje). Passa em: agrupamento (cada seção tem `h2` + `aria-label` próprios) e working memory (página estática, nada para lembrar entre telas). Isso não contradiz a nota "Aceitável" dos heurísticos — são dois eixos coerentes: a página não confunde isoladamente, mas pede mais processamento simultâneo do que o próprio enquadramento do redesign promete poupar.

## Jornada emocional

- **Chegada:** forte — logo + "Qual é o próximo passo da sua viagem?" é caloroso e pessoal, entrega a promessa de marca de imediato.
- **Decisão:** forte no primeiro toque — WhatsApp lidera, seguido por dois ramos de intenção claramente rotulados.
- **Vale:** real — depois da primeira dobra, a experiência deixa de ser conversa curada e vira mapa do site: 5-6 pílulas visualmente idênticas empilhadas. É exatamente o "diretório de links indiferenciado" que a crítica anterior nomeou, agora usando o token de sombra da marca em vez de resolvido.
- **Final:** peak-end fraco — o último elemento da página é `TrustSeals` com número do CADASTUR e razão social ([pages/LinksPage.tsx:207](pages/LinksPage.tsx:207)) — sinal de confiança necessário para tráfego frio de redes sociais, mas um fechamento burocrático para uma marca "acolhedora e pessoal." Nenhuma despedida calorosa sucede a informação de compliance.

## Problemas prioritários

### [P1] O redesign "guiar por intenção" adiciona orientação sem reduzir o inventário

**Por que importa:** os cards de intenção ([pages/LinksPage.tsx:104](pages/LinksPage.tsx:104), [:118](pages/LinksPage.tsx:118)) são apenas âncoras (`#destinos`/`#preparar`); toda seção abaixo ([pages/LinksPage.tsx:148-205](pages/LinksPage.tsx:148-205)) renderiza incondicionalmente, não importa qual card foi tocado. Continuam 12 itens tocáveis sempre visíveis, e o único adiamento real da página (o `<details>` "Ver mais páginas de viagem") não tem relação com o mecanismo de intenção. O diagnóstico da crítica anterior — diretório indiferenciado — só foi meio-resolvido: o trabalho de hoje acrescentou uma pergunta calorosa e duas portas rotuladas, mas o que está atrás de ambas as portas continua sendo a mesma pilha idêntica.

**Correção:** liderar por hierarquia/enquadramento, não por esconder — um toque errado nesse tipo de página deveria continuar livre e reversível (esconder conteúdo custa Controle do Usuário). Depois de um toque de intenção, rebaixar visualmente a seção não escolhida (tipo menor, tier mais quieto, divisor explícito) em vez de apresentar os dois ramos com peso idêntico.

**Comando sugerido:** `/impeccable clarify`

### [P1] O tier hard-shadow "peso físico" aparece em 6+ botões na mesma rolagem, diluindo a assinatura onde a curadoria deveria falar mais alto

**Por que importa:** `tierClasses` em [components/links/LinkButton.tsx:48-56](components/links/LinkButton.tsx:48-56) dá o mesmo tratamento `bg-white` + `shadow-hard` a orçamento, quiz, seguro-viagem, chip/eSIM e site — mais 4 botões de destino em destaque compartilhando um tier secundário uniforme. O princípio do DESIGN.md é "peso físico só onde se age (1 por tela)"; uma rolagem com seis botões igualmente carimbados não sinaliza nenhuma ação dominante — é a expressão visual exata de "todos os links são iguais," o anti-padrão que a crítica anterior já havia nomeado.

**Correção:** reservar o tier hard-shadow para 1-2 ações de intenção genuinamente mais alta por seção (WhatsApp + orçamento); dar aos links de navegação/produto um terceiro tratamento mais quieto (sem sombra offset) para que o peso visual acompanhe a intenção real.

**Comando sugerido:** `/impeccable distill`

### [P1] Os botões "Recusar"/"Aceitar" do banner de cookies ficam abaixo do piso de 44×44px documentado, em todos os breakpoints

**Por que importa:** [components/CookieConsentBanner.tsx:65-78](components/CookieConsentBanner.tsx:65-78) — no base (`<640px`, ou seja, todo celular): `px-3 py-1.5 text-xs` resulta em altura de botão ≈28px; em `sm:` (≥640px): `sm:px-4 sm:py-2 sm:text-sm` ≈36px. O DESIGN.md documenta "touch targets 44px+" como piso do produto inteiro, e o próprio `TrustSeals.tsx:19` cita essa regra e usa `min-h-11` corretamente na mesma área de funcionalidade. O banner fica fixo (`fixed bottom-0`) para todo visitante de primeira vez, desproporcionalmente em celular — exatamente o dispositivo que esta página prioriza.

**Correção:** aumentar padding/altura mínima dos botões do banner para 44px em todos os breakpoints, replicando o padrão já usado em `TrustSeals`.

**Comando sugerido:** `/impeccable adapt`

### [P2] `text-white` puro substitui o token documentado "branco rebaixado" em 7-8 lugares, no mesmo arquivo que segue a regra corretamente em um componente vizinho

**Por que importa:** o DESIGN.md é explícito — texto branco sobre Ardósia Profunda é "sempre `rgba(255,255,255,0.9)` ... nunca `#ffffff` pleno." [components/links/TrustSeals.tsx:12-13](components/links/TrustSeals.tsx:12-13) cita essa regra literalmente e a aplica certo. Mesmo assim, o H1 ([pages/LinksPage.tsx:92](pages/LinksPage.tsx:92)), os dois rótulos em negrito dos cards de intenção ([pages/LinksPage.tsx:107](pages/LinksPage.tsx:107)/[111](pages/LinksPage.tsx:111), [:121](pages/LinksPage.tsx:121)/[125](pages/LinksPage.tsx:125)) e os quatro `h2` de seção ([pages/LinksPage.tsx:150](pages/LinksPage.tsx:150), [158](pages/LinksPage.tsx:158), [185](pages/LinksPage.tsx:185), [197](pages/LinksPage.tsx:197)) usam `text-white` puro. Sem dano de acessibilidade (branco pleno mede ~17,85:1, ainda mais alto que o `white/90`), mas quebra a suavidade intencional do sistema e vira o precedente que o próximo contribuidor vai copiar — as duas avaliações, isoladas uma da outra, chegaram ao mesmo achado por caminhos diferentes.

**Correção:** trocar `text-white` → `text-white/90` nos locais citados, replicando o padrão já usado em `TrustSeals`.

**Comando sugerido:** `/impeccable polish`

### [P2] O grid dos cards de intenção deixa uma lacuna vazia quando só um dos dois ramos é renderizado

**Por que importa:** [pages/LinksPage.tsx:101-130](pages/LinksPage.tsx:101-130) envolve os dois cards de intenção condicionais num `grid gap-3 sm:grid-cols-2` sem nenhum card carregar `sm:col-span-2` como fallback. Se exatamente uma das duas condições for verdadeira (uma configuração alcançável hoje, ex. desabilitar todos os destinos em destaque mantendo um link de produto visível), o card sobrevivente fica preso na coluna 1 em telas `sm:`+, deixando uma lacuna vazia e inexplicada na coluna 2 — um bug de tablet/desktop, não de mobile. Isso é relevante porque o commit citado "fix(links): guard intent shortcuts and reflow" tratou a *presença* (não renderizar link quebrado) mas não o *reflow* (um card sobrevivente ocupando a linha inteira).

**Correção:** adicionar `sm:col-span-2` (ou equivalente) ao card quando ele for o único visível no grupo.

**Comando sugerido:** `/impeccable harden`

## Red flags por persona

### Jordan — first-timer

- O emparelhamento ícone+rótulo passa no teste central de Jordan — nenhuma navegação só-de-ícone. Mas links de WhatsApp/externos ([components/links/LinkButton.tsx:82-96](components/links/LinkButton.tsx:82-96)) não avisam antes de trocar de app; o perfil de Jordan é "hesita antes de tocar em algo desconhecido," e não há sinal visível nem ARIA de que o toque vai sair da página.
- O `<details>` "Ver mais páginas de viagem" ([pages/LinksPage.tsx:169-172](pages/LinksPage.tsx:169-172)) depende do triângulo nativo do navegador, inconsistente com o resto do sistema totalmente customizado — um first-timer pode não reconhecer isso como expansível.

### Riley — stress tester

- Dois modos de falha silenciosa: fallback `href ?? '#'` / `href ?? '/'` para links mal configurados ([components/links/LinkButton.tsx:90](components/links/LinkButton.tsx:90),[99](components/links/LinkButton.tsx:99)), e um nome de ícone não mapeado rebaixando silenciosamente um botão de tier primário para secundário, sem indicação nenhuma ([components/links/linkIcons.ts:14-15](components/links/linkIcons.ts:14-15), reconhecido no próprio comentário do código).
- Caso de borda combinado sem cobertura de teste: `whatsapp` visível E os dois ramos de intenção desabilitados ao mesmo tempo deixaria a primeira dobra inteira sem CTA algum ([pages/LinksPage.tsx:99-131](pages/LinksPage.tsx:99-131)) — os testes existentes cobrem colapso de seção individual, não essa combinação.

### Casey — usuário mobile distraído

- Touch targets da página em si passam (`min-h-[4.5rem]`/`[3.25rem]`, ≥44px). O red flag real é o `CookieConsentBanner` (`fixed bottom-0`, `z-[10000]`) **não** estar excluído de `/links` como `AIChat`/`ContactModal`/`BackToTop` explicitamente estão ([App.tsx:44-46](App.tsx:44-46),[81](App.tsx:81)) — o comentário do código justifica essas exclusões como "cobririam o conteúdo curado," mas o banner de cookies não recebeu o mesmo raciocínio, e seus próprios botões medem apenas ~28-36px (ver Problema Prioritário P1 acima). Visitantes de primeira viagem no celular disputam a mesma zona de polegar que a página trabalha duro para manter livre.

### Sônia — decide pela família à noite (persona derivada do PRODUCT.md)

- Tocar em "Ainda estou escolhendo" — copy escrita para falar diretamente com a situação dela — a leva a uma lista de 5 destinos com peso igual ([pages/LinksPage.tsx:160-167](pages/LinksPage.tsx:160-167)), sem nenhum sinal curatorial (sem "recomendado," sem ordem além da sequência crua de configuração). A página promete autoridade curada no topo e entrega um menu achatado uma tela depois — o oposto de "curadoria confiante."
- A única prova concreta de legitimidade construída exatamente para a ansiedade dela ("em quem confiar?") — CADASTUR, razão social real, nota real do Google — fica no rodapé absoluto, depois de 12 itens tocáveis. Ela precisa rolar por todo o diretório para chegar à seção construída para responder à pergunta que ela realmente tem.

## Observações menores

- Sem sinal visível/ARIA de "abre em nova aba" em links de WhatsApp/externos ([components/links/LinkButton.tsx:82-96](components/links/LinkButton.tsx:82-96)) — relevante também para usuários de leitor de tela.
- O `<nav>` primário de destinos agrupa 5 itens ([pages/LinksPage.tsx:161-166](pages/LinksPage.tsx:161-166)), um acima do limite recomendado de 4 por grupo.
- Anel de foco inconsistente: `LinkButton` e os cards de intenção usam `ring-anhanga-yellow` ([components/links/LinkButton.tsx:38](components/links/LinkButton.tsx:38)), enquanto o DESIGN.md documenta `outline-anhanga-action` (ciano) "em todas as variantes"; `CookieConsentBanner` segue a especificação corretamente ([components/CookieConsentBanner.tsx:68](components/CookieConsentBanner.tsx:68),[75](components/CookieConsentBanner.tsx:75)). Pode ser uma exceção deliberada (amarelo lê melhor sobre fundo escuro) mas não está documentada como tal.
- `LinkButton` usa `text-anhanga-darkBlue` (#003B8E) onde o DESIGN.md documenta `dark` (#0f172a) puro para o texto do `button-cta` ([components/links/LinkButton.tsx:50](components/links/LinkButton.tsx:50),[53](components/links/LinkButton.tsx:53),[55](components/links/LinkButton.tsx:55)). Contraste não é problema (7,4:1 e 10,4:1, ambos acima do piso) — parece desvio de token deliberado, sinalizado para julgamento de intenção.
- Risco de layout shift: `--cookie-banner-h` é medido em `useEffect` (pós-pintura), não `useLayoutEffect` ([components/CookieConsentBanner.tsx:16-31](components/CookieConsentBanner.tsx:16-31)); o padding inferior compensatório em `LinksPage.tsx:81` usa fallback `0px` até o efeito rodar — uma janela real, ainda que estreita, de sobreposição no primeiro paint.
- Regra do Âmbar hoje respeitada (só o WhatsApp usa `bg-anhanga-yellow` sólido, com `banner.visible: false`), mas é config-latente: reativar o banner ([data/linksPage.ts:53](data/linksPage.ts:53), cujo comentário convida a isso) criaria um segundo elemento Âmbar Vivo sólido simultâneo ([pages/LinksPage.tsx:142](pages/LinksPage.tsx:142)), violando a regra.
- `detect.mjs` retornou zero achados, mas seu motor regex para `.tsx` não cobre contraste, touch target, nem as regras nomeadas do DESIGN.md — "limpo" aqui certifica apenas ausência de gradient-text, side-tabs, bounce easing e paleta roxa, não a saúde geral da página.

## Perguntas para destravar uma solução melhor

- Se "guiar por intenção" é a tese inteira deste redesign, por que escolher uma intenção ainda renderiza 100% do conteúdo da página? Como seria o primeiro filtro de verdade nessa página?
- O hard-shadow "carimbo" deveria marcar uma ação dominante por tela — o que ele comunica quando seis botões na mesma rolagem o usam ao mesmo tempo?
- O acordeão de destinos já prova que o time sabe adiar conteúdo com confiança ("Ver mais páginas de viagem") — o que impede a mesma confiança de ser aplicada à lista principal de destinos?
