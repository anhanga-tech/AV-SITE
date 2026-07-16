---
target: página de consultoria
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-07-16T01-43-13Z
slug: pages-landings-consultoriadeviagemlanding-tsx
---
Method: dual-agent (A: general-purpose · B: general-purpose)

## Design Health Score

| # | Heurística | Nota | Ponto-chave |
|---|-----------|-------|-----|
| 1 | Visibilidade do status do sistema | 2/4 | Conteúdo em `whileInView` some/reaparece sem placeholder — lê como quebrado durante rolagem rápida |
| 2 | Correspondência sistema/mundo real | 3/4 | Linguagem natural PT-BR; relação do bubble "ROTEIRO IA" com o CTA principal não é explicada |
| 3 | Controle e liberdade do usuário | 3/4 | Modal fecha por X, ESC e backdrop — bem implementado |
| 4 | Consistência e padrões | 2/4 | Regra do Âmbar do próprio DESIGN.md violada; CTA do nav desaparece no mobile sem razão de conteúdo |
| 5 | Prevenção de erros | 3/4 | Campos obrigatórios, tipos de input corretos, honeypot, submit desabilitado até validar |
| 6 | Reconhecimento vs. recordação | 3/4 | FAQ accordion, steps com título+descrição |
| 7 | Flexibilidade e eficiência de uso | 2/4 | Sem atalho; WhatsApp obrigatório sem caminho alternativo real por e-mail |
| 8 | Design estético e minimalista | 2/4 | Três affordances de CTA competindo no hero; Âmbar duplicado |
| 9 | Ajudar a reconhecer/diagnosticar/recuperar erros | 3/4 | `role="alert"`, mensagens de campo — estrutura correta |
| 10 | Ajuda e documentação | 3/4 | FAQ funciona como ajuda embutida; política de privacidade linkada no momento certo |
| **Total** | | **26/40** | **Aceitável — melhorias significativas antes que usuários fiquem satisfeitos** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** Não é slop grosseiro à primeira vista — paleta restrita, sem gradiente, sem grid de cards idênticos, testemunho único em vez de grade genérica. Mas carrega 3 digitais de scaffolding de IA: (1) numeração `01/02/03` em "Como funciona", o padrão explicitamente banido pelo sistema Impeccable; (2) pilares 100% ícone-only (`MessageSquare`, `Users`, `Headphones`) sem nenhuma fotografia real de destino/viajante — contradiz o princípio de produto #4 "lugares reais, não categorias"; (3) todo o conteúdo gated por `whileInView` fade-up sem exceção, confirmado visualmente escondendo seções inteiras (inclusive dentro do viewport) durante rolagem instrumentada.

**Deterministic scan:** `detect.mjs` no arquivo-alvo + `components/landings/shared/*` (LandingNav, LandingFooter, constants) retornou **limpo (0 achados)**. A injeção ao vivo via overlay (`detect.js` no DOM renderizado completo) encontrou **13-17 instâncias** de achados, mas a maioria pertence a `components/LandingFAQ.tsx` — fora do escopo do arquivo-alvo pedido, então não é uma falha da página em si, é cobertura mais ampla do overlay: `all-caps-body`/`hero-eyebrow-chip` no chip do hero, `cramped-padding`+`nested-cards` no item de FAQ, `layout-transition` (max-height) 5x no accordion, `line-length` 5x nas respostas do FAQ, `single-font` e `bounce-easing` no body.

**Falsos positivos identificados por B:** `single-font` é esperado — CLAUDE.md reserva Merriweather só para prosa de blog, landing usar só Poppins é conforme o design system. `layout-transition: max-height` no accordion é a técnica padrão para animar altura em CSS (não é bug). `nested-cards` no FAQ é um accordion dentro de painel — pode ser heurística capturando um padrão de lista comum, não um erro real.

**Overlaps entre A e B:** Nenhum dos achados do detector aponta diretamente para os 3 P1s que A levantou (Regra do Âmbar, 3 CTAs competindo, twin-button no modal) — são problemas de julgamento holístico que só uma revisão visual pega, confirmando o valor de rodar os dois assessments. Onde os dois se cruzam é no acordeão do FAQ: B sinaliza `layout-transition`/`cramped-padding` ali; A não citou o FAQ diretamente, mas ambos concordam que animação de conteúdo é um ponto de atenção recorrente da página (A no `whileInView` das seções principais, B no accordion).

## Overall Impression

A página está tecnicamente sólida (reduced-motion tratado, contraste de cor validado, honeypot anti-spam, foco visível na maior parte) e evita os clichês óbvios de "SaaS genérico". O problema real é que ela **quebra as próprias regras que o DESIGN.md e o PRODUCT.md da marca escreveram**: a Regra do Âmbar (máximo 1 por tela) é violada por um botão de nav sticky visível o tempo todo; o princípio "um CTA dominante por tela" perde para três affordances de conversão competindo simultaneamente no hero; e o princípio "lugares reais, não categorias de produto" perde para uma página 100% ícone-only sem nenhuma imagem de destino. A maior oportunidade não é remover slop de IA — é fazer a página seguir o próprio sistema de design que a Anhangá já documentou.

## What's Working

1. **`MotionConfig reducedMotion="user"` + fallback sem JS** (`ConsultoriaDeViagemLanding.tsx:102-105`) — tratamento cuidadoso de acessibilidade de movimento, raro de ver bem-feito.
2. **Testemunho único e crível** em vez de grade de depoimentos genéricos, com atribuição só de iniciais (LGPD-consciente) — coerente com "curadoria sobre catálogo".
3. **Contraste de cor validado em todo o sistema de tokens** — combinações âmbar/ardósia e azul/branco passam AA com folga.

## Priority Issues

**[P1] Regra do Âmbar violada em tablet/desktop**
- **Why it matters**: O DESIGN.md é explícito: "Colocado em dois lugares ao mesmo tempo, perde todo o efeito." O botão do nav sticky (`shadow-hard-yellow`) fica visível ao lado do CTA do hero (`bg-anhanga-yellow`) na primeira tela em tablet/desktop, confirmado visualmente — dilui o sinal de "isso é a ação principal" que a marca deliberadamente reserva para 1 elemento.
- **Fix**: Trocar o botão do nav para a variante `action` (Céu Vivo, pílula, sem hard shadow) ou `ghost`, deixando o Âmbar exclusivo ao CTA hero/CTA final.
- **Suggested command**: `/impeccable polish`

**[P1] Três affordances de conversão competindo no hero**
- **Why it matters**: Nav WhatsApp + CTA hero + bubble flutuante do AIChat aparecem juntos na primeira dobra. `App.tsx` comenta que landing pages evitam overlays flutuantes, mas `STANDALONE_ROUTES` só exclui `/links` — o AIChat aparece normalmente em `/consultoria-de-viagem`, contradizendo "um CTA dominante por tela" do PRODUCT.md.
- **Fix**: Adicionar `/consultoria-de-viagem` (e possivelmente as demais landings de conversão) a `STANDALONE_ROUTES`, ou decidir deliberadamente qual dos três é o caminho primário e rebaixar os outros dois visualmente.
- **Suggested command**: `/impeccable polish`

**[P1] Twin-button no modal de conversão**
- **Why it matters**: "Chamar no WhatsApp" e "Me chamem no WhatsApp" (`ContactModal.tsx:219-233`) têm peso visual quase idêntico no momento de maior risco do funil (entrega de dados pessoais) — a diferença semântica (você inicia vs. eles ligam) não é óbvia à primeira leitura, gerando hesitação exatamente onde a conversão mais importa.
- **Fix**: Diferenciar hierarquia visual (um primário, um secundário/ghost) e/ou rotular com a ação mais explícita ("Chamar agora no WhatsApp" vs. "Prefiro que vocês me liguem").
- **Suggested command**: `/impeccable clarify`

**[P2] Conteúdo gated por animação sem fallback de progresso**
- **Why it matters**: Elementos dentro do viewport (não só fora dele) renderizam semitransparentes por período perceptível durante rolagem — confirmado em captura instrumentada. Para a persona "Casey" (mobile, rolagem rápida), isso lê como página quebrada, não como transição intencional.
- **Fix**: Reduzir o threshold/delay do `whileInView`, ou remover o gate de opacidade em seções que já estão predominantemente no viewport ao carregar.
- **Suggested command**: `/impeccable animate`

**[P2] Página 100% ícone-only, nenhuma imagem de lugar real**
- **Why it matters**: Contraria diretamente o princípio de produto #4 ("lugares reais, não categorias de produto") e a Regra do Diário de Bordo. Pilares usam `MessageSquare`/`Users`/`Headphones` — o mesmo inventário de ícone que qualquer SaaS B2B usaria para vender suporte técnico.
- **Fix**: Substituir ao menos 1-2 blocos de ícone por imagem/foto de destino real ou momento de viagem, mantendo a curadoria (não virar grade de fotos genéricas).
- **Suggested command**: `/impeccable colorize` (ou `/impeccable shape` se a mudança exigir redesenho de seção)

## Persona Red Flags

**Jordan (primeira vez, decidindo se confia):** Vê 3 formas diferentes de "falar com alguém" no hero sem hierarquia clara. Ao clicar no CTA principal, chega num modal pedindo WhatsApp real, mas o único reasseguramento de confiança (nota 5.0, fundada em 2018) vive numa seção "Sobre" que só aparece *depois* do modal na ordem da página — risco real de abandono por falta de prova social próxima ao ponto de decisão.

**Casey (mobile distraído, rolagem rápida):** CTA do nav é `hidden` no mobile — depois do hero, não há nenhum CTA persistente até a seção final, 4 seções de distância. Se parar no meio da rolagem, corre risco real de ver conteúdo semitransparente e concluir que a página travou. O banner de cookies também cobre parcialmente o CTA do hero na primeira dobra em mobile, tornando "Sem taxa de consultoria. Gratuito." praticamente inacessível até lidar com o banner.

**Riley (testador de stress):** Se preenche e-mail mas deixa WhatsApp em branco (por preferir esse canal), o submit continua bloqueado porque WhatsApp é obrigatório — decisão de produto válida, mas a copy não avisa isso antes da tentativa de envio.

## Minor Observations

- `ContactModal.tsx` e `LandingFAQ.tsx` ainda usam o namespace legado `brand-*` em vez de `anhanga-*` — sem divergência visual (mesmos hex), mas fora do padrão atual; componente compartilhado, fora do escopo desta landing especificamente.
- Bubble do AIChat e botão `BackToTop` colidem levemente no canto inferior direito durante a rolagem — dois FABs empilhados muito próximos.
- Seção "Outros serviços", logo antes da FAQ e do fechamento, oferece 3 links de saída no momento em que a página deveria reforçar conversão, não abrir rotas de escape.
- 3 `<Link>` de "Outros serviços" (`ConsultoriaDeViagemLanding.tsx:375-407`) não têm `focus-visible` explícito, diferente do resto da página que usa o padrão consistentemente.

## Questions to Consider

- Por que uma agência "boutique" e "curadora" vende consultoria inteiramente com ícones de mensagem/pessoas/headset — o mesmo inventário que qualquer SaaS B2B usaria? Onde estão os lugares reais que o PRODUCT.md diz que a marca deve mostrar?
- Se a Regra do Âmbar existe para que a cor grite raramente, por que o botão de nav — presente em toda tela, todo scroll — recebeu a mesma cor reservada para "a ação máxima"?
- O AIChat aparece em toda landing exceto `/links`. Foi decisão deliberada de que toda landing deve competir consigo mesma por atenção, ou efeito colateral de uma lista de exclusão desatualizada?
