---
target: links
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-06-28T15-24-29Z
slug: pages-linkspage-tsx
---
# Critique — Página de Links na Bio (`/links`) — reavaliação

## Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|-----------|-------|----------------|
| 1 | Visibilidade do status | 3 | Externos não sinalizam "nova aba/sai do site"; resto ok (focus ring, press-down) |
| 2 | Match com o mundo real | 4 | PT-BR claro, ordem quente→frio, ícones reconhecíveis |
| 3 | Controle e liberdade | 3 | Lista de links, baixo risco; externos em nova aba |
| 4 | Consistência e padrões | 4 | **Corrigido**: slot de ícone fixo, alturas padronizadas por tier, sistema tátil aplicado |
| 5 | Prevenção de erro | 3 | n/a — sem formulários |
| 6 | Reconhecer vs. lembrar | 4 | Tudo visível e rotulado |
| 7 | Flexibilidade/eficiência | 3 | Ação primária a 1 toque; sem aceleradores (não precisa) |
| 8 | Estético e minimalista | 3 | **Melhorou** (2 tiers quebram a pilha) mas: dois amarelos na 1ª dobra, /quiz duplicado, FAB BackToTop ainda cobre conteúdo |
| 9 | Recuperação de erro | 3 | n/a |
| 10 | Ajuda e documentação | 3 | A própria página é um hub; selos reforçam |
| **Total** | | **33/40** | **Bom — saiu do "cara de Linktree", resta polimento P2/P3** |

## Anti-Patterns Verdict

**Parece feito por IA?** Já não. O commit #962 aplicou o sistema "O Diário de Bordo": `shadow-hard` + press-down (rest→hover→active, tipo carimbo) e **dois níveis de peso** — ações (WhatsApp/quiz/site/utilidades) cheias e os 7 destinos como lista de apoio mais leve/compacta. A pilha de 12 cartões brancos idênticos do Linktree foi quebrada.

**Scan determinístico:** `detect.mjs` em `LinksPage.tsx`, `LinkButton.tsx`, `TrustSeals.tsx` → **0 achados** (exit 0). Nenhum tell automatizado.

**O que o #962 resolveu (dos 3 P1 + 2 P2 do critique anterior):**
- ✅ **Sistema tátil ausente** → aplicado (`shadow-hard`/press-down + tiers).
- ✅ **Ícones/rótulos desalinhados** → slot de ícone `w-6 shrink-0`, alturas padronizadas (4.5rem / 3.25rem).
- ✅ **Rodapé reprova AA** → gradiente agora `darkBlue → action → darkBlue`; o rodapé cai sobre o `#003B8E` escuro do fim (branco ≈ 8:1). Sublabels passaram a `darkBlue/80` sobre branco.
- ✅ **AIChat em página standalone** → `ROUTES_WITHOUT_AICHAT = ['/links']` esconde o assistente.

## Overall Impression

A página deu um salto: de "Linktree na cor da marca" (30/40) para "Anhangá com peso tátil" (33/40). Não há mais P0/P1 — o que falta é polimento de foco e de saída. O maior ganho remanescente é **desfazer a competição de amarelos e a duplicação do /quiz na primeira dobra**, para a página comunicar curadoria (uma ação dominante) em vez de catálogo.

## What's Working

- **Sistema tátil aplicado com critério:** dois tiers de peso (`pressPrimary`/`pressSecondary`) comunicam hierarquia de intenção — exatamente "curadoria sobre catálogo".
- **Ordem e copy on-brand:** quente→frio, PT-BR caloroso, selos de confiança (Cadastur/ABAV/Google) com contraste agora legível.
- **Acessibilidade de base:** focus-visible ring com offset, `aria-label` na nav, ícones `aria-hidden`, touch targets 52–72px.

## Priority Issues (o que falta)

- **[P2] Três focos de amarelo na primeira dobra.** O banner empilha: container `bg-anhanga-yellow/15`, ring amarelo e pílula CTA `bg-anhanga-yellow` ("Fazer o quiz") — e logo abaixo o botão WhatsApp é amarelo cheio. A "Regra do Âmbar" (máx. 1 por tela) está violada e o foco primário se divide. *Fix:* eleger 1 dono do amarelo (o WhatsApp, ação de maior valor) e rebaixar o banner para superfície neutra/branca com CTA secundário. *Comando:* `/impeccable distill`.

- **[P2] /quiz aparece duas vezes na 1ª dobra.** O banner ("Fazer o quiz" → `/quiz`) e o link primário "Planejar minha viagem" → `/quiz` levam ao mesmo lugar, encostados. Catálogo, não curadoria. *Fix:* manter o banner do quiz **ou** o link, não os dois; se manter o banner, remover o link `quiz` (ou vice-versa). *Comando:* `/impeccable distill`.

- **[P2] BackToTop ainda flutua sobre o conteúdo em /links (fix parcial).** `ROUTES_WITHOUT_AICHAT` removeu só o AIChat; `ContactModal` e `BackToTop` continuam montando no `ClientFeatures`. Como a página tem ~1300px, o FAB "Voltar ao topo" (`fixed bottom-24 right-4 z-[9980]`) aparece após 400px de scroll e cobre os últimos destinos/selos. *Fix:* incluir `/links` numa lista que também suprima o BackToTop (ou condicionar todo o `ClientFeatures` a não renderizar em `/links`, já que o spec define a página como standalone). *Comando:* `/impeccable harden`.

- **[P3] Externos não sinalizam saída do site.** "Seguro viagem" (afiliado), "Site oficial", Cadastur e ABAV abrem em nova aba sem indicador (↗) — Jordan pode achar que "saiu" da Anhangá. *Fix:* ícone/sufixo "↗" + `aria-label` "(abre em nova aba)" nos `type: 'external'`. *Comando:* `/impeccable clarify`.

- **[P3] Sem agrupamento explícito ações × destinos.** Os tiers separam visualmente, mas os 7 destinos seguem como lista contínua sem rótulo. Um divisor sutil ou um único kicker ("Destinos") deixaria a intenção mais legível sem virar scaffolding. *Comando:* `/impeccable layout`.

## Persona Red Flags

**Casey (mobile, polegar):** ações primárias no topo, fora da zona do polegar; o FAB BackToTop ocupa a zona alcançável e cobre conteúdo. Scroll longo (~1300px) sem rótulo de seção entre utilidades e destinos.

**Jordan (primeira vez):** externos (seguro afiliado, ABAV, Cadastur, site) não avisam que abrem nova aba. "Chip / eSIM" leva ao WhatsApp — o sublabel resolve, o ícone de SIM ainda sugere página própria.

**Dona Marisa (melhor idade — persona do projeto):** muito melhor agora; sublabels em `darkBlue/80` e rodapé sobre fundo escuro são legíveis à noite. Resta o ruído dos amarelos competindo.

## Minor Observations

- `BackToTop` usa tokens legados `brand-cyan` e `z-[9980]` arbitrário — pré-existente, fora do escopo de `/links`, mas relevante se for tocado.
- `isPrimary = highlight || icon || sublabel` faz 5 botões ganharem peso físico cheio; com `shadow-hard` em 5 cartões, o "peso reservado à ação" fica generoso. Aceitável, mas se quiser reforçar curadoria, dá para limitar o tier cheio a WhatsApp + quiz.
- Verificar em viewport curta (conteúdo < tela): se o rodapé subir para a faixa `via-action #0ea5e9`, o branco cai para ~2.6:1. Com 12 links isso não ocorre, mas se a lista encolher por config, o contraste volta a reprovar.

## Questions to Consider

- A primeira dobra precisa de banner *e* link de quiz, ou uma única entrada confiante já basta?
- O amarelo deveria ser exclusivo do WhatsApp (a conversa é o produto), deixando o quiz numa superfície neutra?
- Os 7 destinos precisam estar todos abertos, ou caberia um agrupamento "Destinos" depois das ações?
