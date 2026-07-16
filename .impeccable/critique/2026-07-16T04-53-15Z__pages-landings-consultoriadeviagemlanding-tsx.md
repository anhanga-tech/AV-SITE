---
target: "/consultoria-de-viagem (re-crítica pós PR #1203)"
total_score: 33
p0_count: 1
p1_count: 2
timestamp: 2026-07-16T04-53-15Z
slug: pages-landings-consultoriadeviagemlanding-tsx
---
Method: dual-agent (A: general-purpose · B: general-purpose) — re-crítica pós-merge da PR #1203

## Design Health Score

| # | Heurística | Nota | Ponto-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3/4 | Estado "Enviando…" e confirmação com `aria-live` corretos; ghosting residual em scroll extremo pode ler como quebrado por instantes |
| 2 | Correspondência sistema/mundo real | 4/4 | Copy em segunda pessoa, natural, tom consistente |
| 3 | Controle e liberdade do usuário | 4/4 | Modal fecha por X, ESC, clique fora |
| 4 | Consistência e padrões | 3/4 | `ContactModal.tsx` mistura `anhanga-action` (novo) com `brand-cyan`/`brand-dark`/`brand-vibrant` (legado) no mesmo arquivo |
| 5 | Prevenção de erros | 3/4 | Campos obrigatórios desabilitam submit; honeypot anti-spam |
| 6 | Reconhecimento vs. recordação | 4/4 | Página única, sem necessidade de reter contexto |
| 7 | Flexibilidade e eficiência de uso | 2/4 | Banner de cookies bloqueia clique no CTA principal do hero em mobile no primeiro paint (P0 novo, não relacionado à PR #1203) |
| 8 | Design estético e minimalista | 4/4 | Whitespace generoso, hierarquia limpa, tokens de marca respeitados |
| 9 | Ajudar a reconhecer/recuperar de erros | 3/4 | `role="alert"` no erro de submit |
| 10 | Ajuda e documentação | 3/4 | FAQ antecipa dúvidas comuns |
| **Total** | | **33/40** | **Bom — subiu de 26/40 na rodada anterior** |

## Anti-Patterns Verdict

**LLM assessment (A):** não parece feito por IA à primeira vista — nenhum banimento absoluto presente (sem side-stripe, gradient text, hero-metric, grid de cards idênticos, eyebrow repetido, overflow de texto). O "01/02/03" de "Como funciona" é sequência real, não scaffolding. Ressalva: de ~10 seções, só 1 usa fotografia real (Lisboa) — melhoria real vs. zero fotos antes, mas ainda insuficiente para descaracterizar a sensação de "card SaaS genérico" em "Por que consultoria?" e "Como funciona".

**Deterministic scan:** `detect.mjs` no arquivo-alvo + `LandingNav`/`LandingFooter`/`ContactModal` retornou **limpo (0 achados)**, confirmado sem supressões (`--no-config` idêntico, sem `impeccable-disable`, sem config local). O overlay ao vivo no DOM renderizado completo encontrou 14-18 instâncias, incluindo um achado **novo e acionável**: `low-contrast` no botão "Falar no WhatsApp" do nav — texto branco sobre `bg-anhanga-action` (#0ea5e9) mede **2.8:1**, abaixo do mínimo de 4.5:1 do WCAG AA. Demais achados do overlay (FAQ accordion: `cramped-padding`, `nested-cards`, `layout-transition`) pertencem a `LandingFAQ.tsx`, fora do escopo do arquivo-alvo pedido no scan estático.

**Onde A e B convergem:** ambos confirmam de forma independente, com evidência concreta, que as 5 correções alegadas pela PR #1203 estão realmente no código (não é só o comentário sobrevivendo como no bug do último ciclo de review).

## Overall Impression

A nota subiu de 26 para 33/40 — ganho real e verificado, não maquiagem: foco de teclado funciona de verdade (testado com Tab real, não `.focus()` sintético), a Regra do Âmbar se sustenta em todo scroll/breakpoint, e o ghosting sob scroll humano ágil realista está genuinamente resolvido. A rodada também revelou dois problemas **não relacionados à PR #1203** que só apareceram porque a inspeção desta vez foi mais rigorosa (scroll real, viewport real, Tab real): um banner de cookies bloqueando o único CTA do hero em mobile (P0) e um contraste insuficiente no botão do nav (P1). Nenhum dos dois é regressão da PR — são achados novos de um exame mais profundo.

## What's Working

1. **Foco de teclado real e verificado** — outline visível nas cores corretas nos dois botões do modal, confirmado com Tab de verdade em vez de `.focus()` programático (que dá falso positivo, como o próprio processo desta sessão descobriu duas vezes).
2. **Regra do Âmbar sólida em todo o scroll e breakpoints** — nav nunca compete com o CTA da página.
3. **Ghosting por scroll rápido resolvido para o cenário real** — scroll contínuo a ritmo humano ágil (~2100px/s) não produziu nenhuma seção semitransparente.

## Priority Issues

**[P0] Banner de cookies bloqueia o CTA principal do hero em mobile**
- **Why it matters**: em 375×812, `elementFromPoint()` no centro do botão "Falar com um consultor" retorna o banner de cookies, não o botão. O único CTA da dobra inicial fica fisicamente inacessível ao toque antes de qualquer interação com o banner — o pior lugar possível para esse tipo de bloqueio (antes do primeiro engajamento).
- **Fix**: usar o mesmo mecanismo (`--cookie-banner-h`) que já protege elementos flutuantes (AIChat) para também deslocar/considerar CTAs em fluxo normal no hero em viewports compactos, ou reduzir a prioridade de empilhamento do banner nessa faixa.
- **Suggested command**: `/impeccable harden`

**[P1] Contraste insuficiente no botão "Falar no WhatsApp" do nav**
- **Why it matters**: texto branco sobre `bg-anhanga-action` mede 2.8:1, abaixo do piso de 4.5:1 do WCAG AA que o PRODUCT.md exige. Achado determinístico (overlay), não uma leitura subjetiva.
- **Fix**: escurecer o fundo (ex. usar `anhanga-actionDark` como base em vez de hover) ou usar texto com peso/cor que atinja 4.5:1 mantendo a variante `action`.
- **Suggested command**: `/impeccable polish`

**[P1] Ghosting residual em scroll instantâneo/teleporte (limitação estrutural, não regressão)**
- **Why it matters**: a margem de 1 viewport só ajuda quando o usuário rola progressivamente pela zona de antecedência. Um jump direto (arrastar thumb da scrollbar, âncora, `scrollTo` programático) ainda pousa em conteúdo semitransparente por até ~550ms. Sob scroll humano contínuo (o caso majoritário) já está resolvido.
- **Fix**: avaliar custo/benefício de reduzir a duração da animação para itens tardios no stagger, ou aceitar como limitação conhecida do mecanismo.
- **Suggested command**: `/impeccable animate` (opcional — ver pergunta provocativa 3)

**[P2] Imagery ainda majoritariamente ícone-only**
- **Why it matters**: 1 foto real em ~10 seções não é suficiente para descaracterizar o padrão de card genérico em "Por que consultoria?" e "Como funciona" — contraria o princípio "lugares reais, não categorias" para um brief que é literalmente sobre viagens.
- **Fix**: considerar uma segunda foto real, por exemplo pareada com "Sobre a Anhangá Viagens".
- **Suggested command**: `/impeccable colorize` ou `/impeccable shape`

**[P3] Namespace legado `brand-*` ainda presente em `ContactModal.tsx`**
- **Why it matters**: o mesmo arquivo que acabou de ganhar `focus-visible:outline-anhanga-action` nos botões de ação ainda usa `text-brand-vibrant`/`text-brand-dark`/`ring-brand-cyan` em outros elementos — já que o arquivo foi tocado por esta mesma PR, vale registrar como débito de follow-up.
- **Fix**: migrar os elementos restantes para `anhanga-*` numa passada de limpeza.
- **Suggested command**: `/impeccable polish`

## Persona Red Flags

**Jordan (primeira vez, mobile):** pousa na página, tenta tocar no botão amarelo do hero e toca no banner de cookies por baixo — sem entender por que nada aconteceu.

**Riley (testador de estresse):** arrasta a scrollbar direto para o final — vê CTA Final e "Sobre a Anhangá" quase invisíveis por ~550ms. Com campos vazios no modal, o Tab pula os dois botões (comportamento HTML correto de `disabled`, mas sem pista visual/aria).

**Casey (mobile distraído):** exatamente o perfil mais atingido pelo P0 — scroll rápido, toque rápido no que parece ser o CTA, e o toque cai no banner de cookies.

## Minor Observations

- Lista "Para quem é" tem 5 itens (viola levemente o teto de chunking ≤4).
- Cards de "Por que consultoria?" ficam apertados em tablet (768px) — texto ainda cabe, mas é o breakpoint mais espremido.
- Nav sticky com `backdrop-blur-md` produz "texto fantasma" quando um H2 rola por trás dele — funcional, não decorativo, mas vale um gut-check visual.
- FAQ acordeão não usa `whileInView` — decisão implícita acertada, evita mais um ponto de ghosting.

## Questions to Consider

- Se o objetivo é "conversa não transação", por que o WhatsApp ainda é campo obrigatório de texto livre em vez de vir pré-preenchido no fluxo "Abrir WhatsApp agora"?
- O banner de cookies já protege elementos flutuantes via `--cookie-banner-h` — por que esse cuidado não se estende a CTAs em fluxo normal no hero? Sugere que o padrão nunca foi testado em mobile real com o banner ativo.
- Vale a pena investir na correção estrutural do ghosting por jump instantâneo, ou o custo/benefício não compensa dado que o scroll progressivo (caso majoritário) já está resolvido?
