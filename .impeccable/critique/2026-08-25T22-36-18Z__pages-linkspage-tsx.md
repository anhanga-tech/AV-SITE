---
target: /links
total_score: 23
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-08-25T22-36-18Z
slug: pages-linkspage-tsx
---
# Critique de `/links`

## Design Health Score

| # | Heurística | Nota | Achado principal |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | WhatsApp e parceiros abrem nova aba sem feedback visível de hand-off. |
| 2 | Match System / Real World | 3/4 | Português é claro; “eSIM” ainda exige interpretação. |
| 3 | User Control and Freedom | 3/4 | Não há modal que prenda o usuário; a página permanece disponível após hand-offs. |
| 4 | Consistency and Standards | 2/4 | “Site oficial” recebe o mesmo peso visual das ações de conversão. |
| 5 | Error Prevention | 2/4 | Mensagens pré-preenchidas ajudam, mas links externos não são diferenciados como parceiros. |
| 6 | Recognition Rather Than Recall | 3/4 | Labels visíveis ajudam, mas 13 opções exigem varredura excessiva. |
| 7 | Flexibility and Efficiency | 2/4 | O clique direto é eficiente, porém a lista longa aumenta o custo de decisão. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Paleta limpa, mas cards repetidos e cookie banner adicionam ruído. |
| 9 | Error Recovery | 2/4 | Não há caminho de recuperação se um destino externo falhar. |
| 10 | Help and Documentation | 2/4 | Sublabels ajudam, mas falta explicar o que acontece após cada hand-off. |
| **Total** |  | **23/40** | **Aceitável; precisa de melhoria significativa para persuadir.** |

## Veredito de especificidade

**Parcialmente específico.** A rota tem pele Anhangá — ardósia profunda, um CTA âmbar, Poppins, sombras táteis e uma shell standalone — mas ainda não tem um ponto de vista Anhangá. A composição logo + pilha de botões + destinos + rodapé legal poderia pertencer a quase qualquer agência de viagens. O título visível está ausente; o único `h1` é `sr-only` em [pages/LinksPage.tsx:54](pages/LinksPage.tsx:54), apesar de o produto prometer uma conversa pessoal ([PRODUCT.md:24](PRODUCT.md:24)).

O detector CLI, executado exatamente uma vez sobre [pages/LinksPage.tsx](pages/LinksPage.tsx), retornou `[]` com exit code 0. Na inspeção do navegador, o overlay encontrou `line-length`, `flat-type-hierarchy` e `layout-transition`: o primeiro é um provável falso positivo no parágrafo global do cookie banner ([components/CookieConsentBanner.tsx:54](components/CookieConsentBanner.tsx:54)); o terceiro veio de CSS global usado em outras landings, não da rota; `flat-type-hierarchy` é válido para os tamanhos renderizados de 12, 14 e 16px. A injeção mutável funcionou, `window.impeccableScan` esteve disponível e foram produzidos dois overlays visuais e um label na aba `[Human]`.

## Impressão geral

A página é legível e tecnicamente disciplinada, mas emocionalmente anônima e pesada em escolhas. A maior oportunidade é trocar um diretório de links por um hand-off guiado: acolher, identificar a intenção e só então expor o próximo passo.

## O que está funcionando

- A escada de conversão é compreensível: “Falar no WhatsApp”, “Quero um orçamento” e “Planejar minha viagem” atendem níveis diferentes de prontidão ([data/linksPage.ts:59](data/linksPage.ts:59)).
- O feedback tátil é consistente: links primários têm press-down, foco visível e alturas generosas para mobile ([components/links/LinkButton.tsx:40](components/links/LinkButton.tsx:40)).
- A rota standalone remove AI chat e Back to Top concorrentes, preservando o foco no conteúdo ([App.tsx:44](App.tsx:44)).

## Carga cognitiva

**6/8 falhas — carga alta.** Falham foco único, chunking, agrupamento semântico, hierarquia visual, uma decisão por vez, escolhas mínimas e progressive disclosure. Passa apenas em working memory: os labels ficam visíveis e não exigem lembrar uma etapa anterior. A navegação expõe 13 escolhas e a transição entre ações e destinos é apenas uma margem extra ([pages/LinksPage.tsx:77](pages/LinksPage.tsx:77)). Além disso, `isPrimaryLink` usa presença de ícone/sublabel como proxy de prioridade ([components/links/LinkButton.tsx:23](components/links/LinkButton.tsx:23)).

## Jornada emocional

- **Chegada:** o fundo escuro e o logo são calmos e marcados, mas não há acolhimento nem motivo explícito para confiar.
- **Decisão:** o WhatsApp amarelo é um primeiro gesto claro; os sublabels reduzem alguma incerteza.
- **Vale:** a pilha repetida vira catálogo, contrariando “curadoria sobre catálogo”; seguro e eSIM desviam da relação principal.
- **Final:** a prova de confiança aparece pequena, depois dos 13 links; a experiência termina em informação legal, não em segurança ou antecipação.

## Problemas prioritários

### [P1] Falta uma promessa visível e um hand-off humano

**Por que importa:** tráfego social frio precisa entender em segundos o que a Anhangá faz e o que ocorre depois do clique. Hoje a sequência visível é apenas logo → botões; não há convite em segunda pessoa nem orientação ([pages/LinksPage.tsx:52](pages/LinksPage.tsx:52)).

**Correção:** inserir uma promessa factual de uma linha sob o logo e uma orientação de prontidão, por exemplo “Já sabe o destino?” versus “Ainda está escolhendo?”. Não transformar isso em outro bloco de marketing.

**Comando sugerido:** `$impeccable clarify`

### [P1] Treze escolhas aparecem como uma única pilha indiferenciada

**Por que importa:** seis ações/utilidades e sete destinos competem no mesmo percurso. “Site oficial” vira link pesado só porque tem ícone. Isso aumenta o scanning e faz a curadoria parecer um link dump.

**Correção:** separar semanticamente “Fale com a gente”, “Comece a planejar” e “Conheça nossos destinos”; manter duas ou três decisões na primeira dobra e revelar destinos progressivamente. Definir peso visual por intenção de negócio, não por ícone ou sublabel.

**Comando sugerido:** `$impeccable distill`

### [P1] O cookie banner cobre destinos acionáveis no primeiro acesso

**Por que importa:** em 390×844, o diálogo fixo cobre links inferiores enquanto o visitante ainda está explorando. O padding inferior reserva espaço para o rodapé, mas não impede a sobreposição na viewport ([pages/LinksPage.tsx:46](pages/LinksPage.tsx:46), [components/CookieConsentBanner.tsx:45](components/CookieConsentBanner.tsx:45)).

**Correção:** usar consentimento mobile mais compacto ou em fluxo/sticky sem cobrir targets; garantir também 44px para os controles do próprio banner ([components/CookieConsentBanner.tsx:65](components/CookieConsentBanner.tsx:65)).

**Comando sugerido:** `$impeccable adapt`

### [P2] A prova de confiança chega tarde e informa pouco

**Por que importa:** Cadastur e a nota do Google aparecem só depois de toda a lista. “Nota 5.0 no Google” não traz número de avaliações nem link direto para a fonte, funcionando mais como rodapé que como tranquilização ([components/links/TrustSeals.tsx:14](components/links/TrustSeals.tsx:14)).

**Correção:** mover um único sinal de confiança, factual e compacto, para perto do grupo de ações. Incluir contagem/fonte se estiver disponível e manter a razão social no final.

**Comando sugerido:** `$impeccable clarify`

## Red flags por persona

### Jordan — first-timer

- Não explica o que a Anhangá oferece nem o que acontece ao tocar no WhatsApp.
- “Quero um orçamento” e “Planejar minha viagem” são ambos fortes e exigem inferência para distinguir.
- As 13 opções não dizem por onde começar.
- “eSIM” pode exigir interpretação apesar do sublabel.

### Riley — stress tester

- WhatsApp e parceiro abrem nova aba, enquanto rotas internas permanecem na SPA; a diferença não é explicitada ([components/links/LinkButton.tsx:79](components/links/LinkButton.tsx:79)).
- “Seguro viagem” parece um destino Anhangá, embora seja hand-off de terceiro.
- Não existe recuperação visível se um destino externo falhar.
- Se todos os itens forem ocultados, `visibleLinks` pode deixar uma navegação vazia sem estado alternativo ([pages/LinksPage.tsx:34](pages/LinksPage.tsx:34)).

### Casey — usuário mobile distraído

- A primeira viewport já contém uma sequência alta de cards de 72px, seguida por uma rolagem longa.
- O cookie banner disputa a parte inferior no primeiro acesso.
- A prova de confiança fica distante da primeira decisão.
- Depois de rolar, não há atalho persistente para retornar às ações primárias.

## Observações menores

- Destinos continuam usando sombras offset, fazendo a lista parecer coleção de botões, não índice curado; isso tensiona a regra de reservar peso físico para ações significativas ([DESIGN.md:171](DESIGN.md:171)).
- O logo não é link; “Site oficial” é o único retorno claro à home.
- `TrustSeals` dá 44px ao Cadastur, mas os controles do cookie não explicitam o mesmo piso.
- Os ícones são decorativos e os labels visíveis fornecem nomes acessíveis.
- Não há `h2` ou rótulos de seção visíveis, piorando a separação visual e semântica.
- A regra do âmbar está respeitada: o banner do quiz está desligado e o amarelo fica principalmente no WhatsApp ([data/linksPage.ts:49](data/linksPage.ts:49)).

## Perguntas para destravar uma solução melhor

- Se esta é a primeira impressão vinda das redes sociais, o que a pessoa deve acreditar em três segundos além de “há alguns links aqui”?
- A marca pareceria mais confiante se mostrasse menos destinos e perguntasse uma coisa sobre prontidão antes de expandir?
- O cookie banner pode cobrir justamente a rota que a pessoa veio tocar? Se não, `/links` precisa de consentimento compacto ou em fluxo?
