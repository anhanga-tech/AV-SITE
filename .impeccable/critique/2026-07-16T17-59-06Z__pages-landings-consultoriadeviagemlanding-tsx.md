---
target: página de consultoria (/consultoria-de-viagem)
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-07-16T17-59-06Z
slug: pages-landings-consultoriadeviagemlanding-tsx
---
# Critique — Página de Consultoria (`/consultoria-de-viagem`)

Method: dual-agent (A: a69346e629c1e19d5 · B: a710cebee3ef2adfd)

Alvo: `pages/landings/ConsultoriaDeViagemLanding.tsx` + componentes compartilhados (`LandingNav`, `LandingFooter`, `LandingFAQ`, `ContactModal`). Inspeção ao vivo em desktop 1440×900 e mobile 390px.

## Design Health Score — 32/40 (Good)

| # | Heurística | Score | Issue-chave |
|---|---|---|---|
| 1 | Visibilidade de status | 3 | Em rolagem rápida no desktop, seções `whileInView` aparecem semi-transparentes ~1s dentro do viewport |
| 2 | Correspondência com o mundo real | 4 | n/a — copy 2ª pessoa, zero jargão, prazos concretos |
| 3 | Controle e liberdade | 3 | Modal fecha por X e Esc ✓; mas no mobile não há caminho rápido de volta à ação no meio dos ~6.900px |
| 4 | Consistência e padrões | 3 | Três rótulos para a mesma conversa: "Falar no WhatsApp" / "Falar com um consultor" / "Fale com um especialista" |
| 5 | Prevenção de erros | 3 | Placeholder mostra formato do telefone; validação só no submit, não on-blur |
| 6 | Reconhecimento > memorização | 4 | n/a — FAQ com 1º item aberto, credenciais visíveis |
| 7 | Flexibilidade e eficiência | 2 | Mobile: CTA do nav é `hidden sm:block` (LandingNav.tsx:31); único elemento flutuante é "voltar ao topo" |
| 8 | Estética e minimalismo | 3 | Desktop: H1 de 4 linhas empurra o CTA para fora da dobra a 1366×768 |
| 9 | Recuperação de erros | 3 | "Informe um WhatsApp válido." é claro, mas não sugere o formato aceito |
| 10 | Ajuda e documentação | 4 | n/a — FAQ responde custo, prazo, escopo; disclosure LGPD no modal |
| **Total** | | **32/40** | **Good — base sólida, atacar os pontos fracos** |

## Anti-Patterns Verdict

**Não parece feito por IA.** Avaliação LLM: o único eyebrow é o badge do hero (não replicado por seção), os 3 pilares variam deliberadamente (`variant: 'filled'` no do meio), o 01/02/03 descreve um processo real de 3 passos, zero gradient text/side-stripe/glassmorphism/hero-métrica, nada vazando a 390px. A ressalva: estrutura canônica de landing + iconografia genérica (MessageSquare/Users/Headphones) — o que salva é o depoimento com foto de Lisboa, a copy com opinião e a disciplina âmbar/sombra.

**Scan determinístico:** CLI limpo (0 findings nos 4 arquivos). No browser, 13 anti-patterns — quase todos no componente compartilhado `LandingFAQ.tsx`: `nested-cards` + `cramped-padding` (item do FAQ), `layout-transition` (5× `transition-[max-height,opacity]` no accordion), `line-length` (5× ~87ch, alvo <80). Falsos positivos/sinais fracos: `single-font` (Poppins única é regra do DESIGN.md), `all-caps-body`+`hero-eyebrow-chip` (dupla contagem do mesmo nó do hero), `bounce-easing`/`transition: height` atribuídos a `body` (CSS global, sem elemento concreto). Convergência A+B: `LandingFAQ` ainda usa namespace legado `brand-*` (`brand-cyan`) — o canônico é `anhanga-*`.

**Overlays visuais:** injetados com sucesso — visíveis na aba **[Human]** do Chrome, destacando os elementos detectados. Live server parado (porta 8400 liberada).

## Overall Impression

Uma landing bem executada e disciplinada — o design system "O Diário de Bordo" foi genuinamente aplicado, não só citado. O problema não é estética, é **conversão mobile**: para o público que "decide pelo celular à noite" (PRODUCT.md), há ~4.200px de página sem nenhuma ação alcançável, e o único FAB no polegar é "voltar ao topo". A maior oportunidade: fazer o caminho primário honrar a promessa "sem formulário" da própria página.

## What's Working

1. **Disciplina do design system.** Regra do Âmbar respeitada (nav usa `action` cyan de propósito, com comentário citando a regra); hard shadow só nos 2 CTAs; press-down completo; par de contraste âmbar/ardósia correto. Raro em landing de campanha.
2. **Reasseguramento no ponto de risco.** "Sem taxa. Gratuito." colado no CTA do hero + "Sem taxa, sem compromisso" no CTA final + FAQ respondendo preço em 2º lugar. O maior medo do lead atacado três vezes, sem urgência manipulativa.
3. **Robustez invisível:** fallback `<noscript>` para opacity do framer-motion, `MotionConfig reducedMotion="user"`, alt texts descritivos.

## Priority Issues

**[P1] Contraste do botão de conversão final falha WCAG AA**
- **O quê:** `components/ContactModal.tsx:231` — "Abrir WhatsApp agora": `text-white` sobre `bg-[#25D366]` ≈ **2.0:1** (piso 4.5:1 para text-sm).
- **Por que importa:** é o último clique do funil, à noite, no celular — onde legibilidade mais importa.
- **Fix:** `text-anhanga-dark` sobre o verde (≈8:1) — o repo já resolveu esse padrão nas variants `cta` e `action` do Button.
- **Comando:** /impeccable polish

**[P2] Mobile sem caminho persistente para a ação primária**
- **O quê:** `LandingNav.tsx:31` esconde o CTA no mobile (`hidden sm:block`). Entre hero e CTA final: ~4.200px de deserto de ação.
- **Por que importa:** contradiz diretamente o princípio mobile-first do PRODUCT.md; Casey nunca encontra a ação no polegar.
- **Fix:** pílula compacta no nav mobile (ícone WhatsApp, 44×44px) — o nav já é sticky.
- **Comando:** /impeccable adapt

**[P2] BackToTop cobre conteúdo no mobile e contradiz a própria justificativa do App**
- **O quê:** `App.tsx:74` monta `<BackToTop />` nas landings; a 390px ele sobrepõe resposta do FAQ, card "Viagens para Executivos" e CNPJ do footer. O comentário da linha 42 proíbe FABs porque "cobririam o conteúdo curado".
- **Fix:** incluir as landings na lógica de supressão do BackToTop (coerente com o argumento do próprio comentário). Se combinado com o item anterior, o imóvel do polegar vai para a conversão, não para navegação.
- **Comando:** /impeccable adapt

**[P2] Desktop: CTA do hero na dobra ou abaixo dela**
- **O quê:** `ConsultoriaDeViagemLanding.tsx:141–161` — `text-6xl` em `max-w-3xl` gera H1 de 4 linhas; a 1440×900 o botão vira lasca de 10px; a 1366×768 some.
- **Fix:** `max-w-4xl` no container ou `md:text-5xl` — H1 cai para 2–3 linhas e o par CTA+disclaimer entra na primeira tela.
- **Comando:** /impeccable layout

**[P2] LandingFAQ: cluster de higiene (detector + review convergem)**
- **O quê:** `components/LandingFAQ.tsx` — nested cards, padding apertado sem inset lateral, `transition-[max-height]` (anima propriedade de layout), linhas de ~87ch (alvo 65–75ch), hover do título em cyan `#0ea5e9` sobre branco ≈2.8:1, e namespace legado `brand-*`.
- **Por que importa:** componente compartilhado — corrigir aqui melhora todas as landings que o usam.
- **Fix:** grid-template-rows/altura via `grid` para o accordion (ou `interpolate-size` progressivo), `max-w-[70ch]` nas respostas, hover para `anhanga-actionDark`, migrar para `anhanga-*`.
- **Comando:** /impeccable polish

## Persona Red Flags

**Jordan (first-timer):** três rótulos para a mesma conversa (WhatsApp? consultor? especialista?); placeholder `+55 (11) 9 0000-0000` sugere que precisa digitar +55 e o erro não diz o formato aceito; "São Paulo" no badge do hero pode expulsar quem é de fora (a correção "atendemos todo o Brasil" só chega na 3ª pergunta do FAQ).

**Riley (stress tester):** contradição "sem formulário, sem burocracia" (linhas 53 e 77) vs. formulário no clique do CTA; rolagem rápida produz seções fantasma semi-transparentes ~1s; hover do FAQ a 2.8:1. Positivos: Esc fecha modal, erro de telefone claro e vermelho+texto.

**Casey (mobile, uma mão, à noite):** nenhum CTA alcançável em ~4.200px de página; o FAB "voltar ao topo" senta na zona do polegar e cobre conteúdo; página inteira em fundo claro brilhante para o momento noturno que o PRODUCT.md descreve. Positivos: touch targets ≥44px, hero completo com CTA na primeira tela.

## Minor Observations

- [P3] Promessa "sem formulário" (linhas 53, 77) vs. `openContactModal()` abrindo um formulário — fix barato: reescrever a copy dos pilares; fix melhor: deep-link `wa.me` com mensagem pré-preenchida como caminho primário, formulário como fallback.
- `LandingFAQ.tsx` e `LandingFooter.tsx` no namespace legado `brand-*` (guard congela, não migra).
- Links de "Outros serviços" sem `focus-visible:outline` explícito (abaixo do padrão de dois sinais).
- FAQ diz "sem taxa de consultoria **no momento**" — planta a dúvida que o hero ("Gratuito.") mata; alinhar.
- `hover:shadow-float-lg` nos cards de pilares dá lift a cards não-clicáveis (falso affordance); badges de credenciais em pílula branca elevada idem.
- Carga cognitiva: 1½ falhas de 8 — "Para quem é" tem 5 bullets, os 2 últimos são o mesmo perfil (cortar para 4).

## Questions to Consider

1. Se a tese da marca é "conversa, não transação", por que o caminho primário desta landing é um formulário e não a própria conversa (`wa.me` pré-preenchido)? O formulário existe para o CRM, não para o cliente.
2. Esta página provaria a curadoria que vende? Um único roteiro real anonimizado (destino, 5 linhas, o problema resolvido) provaria em 200px o que 5 seções afirmam com ícones genéricos.
3. "São Paulo" no badge e no title é SEO local ou cerca desnecessária? Se boa parte do tráfego vier de fora de SP, o primeiro elemento lido convida a sair.
