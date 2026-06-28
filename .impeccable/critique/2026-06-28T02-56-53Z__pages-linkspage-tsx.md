---
target: links
total_score: 30
p0_count: 0
p1_count: 3
timestamp: 2026-06-28T02-56-53Z
slug: pages-linkspage-tsx
---
# Critique — Página de Links na Bio (`/links`)

## Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|-----------|-------|----------------|
| 1 | Visibilidade do status | 3 | Sem affordance de "abre WhatsApp/nova aba"; resto ok (focus ring, active:scale) |
| 2 | Match com o mundo real | 4 | PT-BR claro, ordem quente→frio, ícone do WhatsApp reconhecível |
| 3 | Controle e liberdade | 3 | Lista de links, baixo risco; externos abrem em nova aba |
| 4 | Consistência e padrões | 2 | Ícones desalinhados (label em x=109–163px), alturas mistas (56/72px), não usa hard-shadow/press-down do sistema |
| 5 | Prevenção de erro | 3 | n/a — sem formulários |
| 6 | Reconhecer vs. lembrar | 4 | Tudo visível e rotulado, zero carga de memória |
| 7 | Flexibilidade/eficiência | 3 | Ação primária a 1 toque; sem aceleradores (não precisa) |
| 8 | Estético e minimalista | 2 | 12 botões brancos idênticos empilhados; banner disputa com o CTA; dois amarelos; FABs cobrindo conteúdo |
| 9 | Recuperação de erro | 3 | n/a |
| 10 | Ajuda e documentação | 3 | A própria página é um hub de navegação; selos dão reforço |
| **Total** | | **30/40** | **Bom — base sólida, mas fora do sistema e com falhas de polimento** |

## Anti-Patterns Verdict

**Parece feito por IA?** Em parte, sim — pelo *template*, não pelos detalhes.

**Avaliação LLM:** a página é uma pilha vertical de ~12 cartões brancos arredondados idênticos sobre gradiente azul. Isso é literalmente o visual padrão do Linktree — exatamente o que o DESIGN.md bane ("cards idênticos em grade repetida") e o que a marca lista como anti-referência ("grades de cards idênticos, frieza transacional"). A identidade "O Diário de Bordo" (peso físico, hard-shadow, press-down tipo carimbo) está **ausente**: os botões usam `shadow-sm` + `active:scale`, genérico. A paleta está certa; o *sistema* não foi aplicado.

**Scan determinístico:** `detect.mjs` rodou em `LinksPage.tsx`, `LinkButton.tsx`, `TrustSeals.tsx` → **0 achados** (exit 0). Nenhum dos tells automatizados (gradient text, side-stripe, eyebrow) está presente. Os problemas aqui são de sistema/composição/contraste, que o detector não pega.

**Evidência de browser:** renderizado em viewport mobile (375×812), rota `/links` confirmada, 12 botões, altura total 1308px. Medições reais: gradiente `#003B8E → #0ea5e9`; sublabels em `#003B8E` a 70% opacidade; selos do rodapé em branco a 80% sobre a base clara do gradiente (`#0ea5e9`).

## Overall Impression

Funciona e está na cor da marca, mas se entrega como Linktree, não como Anhangá. O maior ganho não é corrigir bugs — é **fazer a página parecer da marca**: trazer o peso tátil (hard-shadow/press-down) e quebrar a monotonia dos 12 cartões iguais. Em segundo lugar, dois bugs reais: contraste do rodapé reprova AA e o AIChat aparece numa página que o spec definiu como standalone sem ele.

## What's Working

- **Ordem de prioridade e hierarquia de intenção:** quente→frio (WhatsApp → quiz → site → landings) é a decisão certa para tráfego de bio. WhatsApp em destaque amarelo no topo é o instinto correto.
- **Tokens e copy on-brand:** `anhanga-*` canônico, Poppins, PT-BR caloroso e direto ("Atendimento humano e rápido"), selos de confiança (Cadastur/ABAV/Google) — reforço real para um público que decide por confiança.
- **Acessibilidade de base:** `focus-visible:ring`, `aria-label` na nav, ícones `aria-hidden`, touch targets generosos (56–72px). O alicerce está lá.

## Priority Issues

- **[P1] Cara de Linktree, não de Anhangá.** Pilha de 12 cartões brancos idênticos; o sistema tátil "Diário de Bordo" (hard-shadow, press-down de carimbo, âmbar como assinatura de press) não foi aplicado. *Por que importa:* a marca se define por "não parecer OTA/template frio"; a primeira impressão da bio é justamente o lugar onde a promessa precisa aparecer. *Fix:* aplicar `shadow-hard`/`shadow-hard-yellow` e a sequência rest→hover→active nos botões; variar peso/dimensão para que a pilha não seja uniforme (o WhatsApp e o quiz merecem mais peso que "Lollapalooza"). *Comando:* `/impeccable bolder` (depois `/impeccable delight`).

- **[P1] Rodapé reprova contraste WCAG AA.** Selos (Cadastur, Membro ABAV, Nota 5.0, "ANHANGA TURISMO LTDA") em branco a 80% sobre a base clara do gradiente (`#0ea5e9`) → ~2.8:1, abaixo do piso de 4.5:1 para texto pequeno. *Por que importa:* informação legal/confiança ilegível, e o PRODUCT.md fixa AA como piso. *Fix:* escurecer o fim do gradiente, colocar o rodapé sobre faixa escura, ou usar texto em `anhanga-darkBlue`. *Comando:* `/impeccable colorize` ou `/impeccable audit`.

- **[P1] Ícones e rótulos desalinhados.** Com `justify-center` + `gap-3`, a borda esquerda dos rótulos varia muito (medido: 109, 117, 163, 155, 136px) e as alturas alternam 56/72px. *Por que importa:* leitura em ziguezague, ritmo quebrado, reforça o ar de "montado às pressas". *Fix:* ancorar ícone à esquerda com largura fixa e alinhar rótulos a uma coluna comum (ou centralizar tudo de forma consistente); padronizar altura mínima. *Comando:* `/impeccable layout`.

- **[P2] Dois amarelos competindo.** O CTA do banner ("Fazer o quiz", pílula amarela) e o botão WhatsApp (preenchido amarelo) aparecem na mesma dobra, violando a "Regra do Âmbar" (máx. 1 por tela) e dividindo o foco primário. *Por que importa:* o sistema reserva o âmbar para 1 ação dominante; dois neutralizam o sinal. *Fix:* escolher um dono do amarelo (o WhatsApp, ação de maior valor) e rebaixar o CTA do banner para variante secundária. *Comando:* `/impeccable distill`.

- **[P2] AIChat + BackToTop flutuam numa página standalone.** O spec define `/links` "sem Header, Footer, AIChat", mas `ClientFeatures` (AIChat, ContactModal, BackToTop) renderiza no `AppLayout` para todas as rotas — o FAB "Abrir assistente virtual" e o "Voltar ao topo" aparecem no canto inferior direito e **cobrem o último botão (Lollapalooza) e os selos**. *Por que importa:* adiciona um CTA concorrente numa página cujo trabalho é encaminhar para 1 dos destinos listados, e oculta conteúdo/confiança. *Fix:* condicionar `ClientFeatures` (ou só o AIChat) a não renderizar em `/links`, ou reposicionar os FABs. *Comando:* `/impeccable harden`.

## Persona Red Flags

**Casey (mobile distraído, polegar):** os destinos primários (WhatsApp, quiz) estão no topo, longe da zona do polegar; o FAB de chat sobreposto compete justamente na zona alcançável. Os 12 botões exigem scroll longo (1308px) sem agrupamento — "landings" e "utilidades" (seguro, chip) misturados.

**Jordan (primeira vez):** links externos (Seguro = afiliado; Site; ABAV) não sinalizam que abrem em nova aba/saem do site — pode achar que "saiu" da Anhangá. "Chip / eSIM internacional" não deixa claro que leva ao WhatsApp (o sublabel ajuda, mas o ícone de SIM sugere página própria).

**Dona Marisa (melhor idade, celular à noite — persona do projeto):** o contraste fraco do rodapé e os sublabels a 70% de opacidade penalizam exatamente quem o PRODUCT.md prioriza (leitura noturna, baixa carga). Botões grandes ajudam; o texto secundário, não.

## Minor Observations

- Sublabels em `text-xs` (12px) a `opacity-70` sobre branco ≈ 3.7:1 — abaixo de AA para texto pequeno. Subir para ~85% ou usar `anhanga-action`/`darkBlue` cheio.
- Sem agrupamento: utilidades (seguro, chip) e landings de destino estão na mesma lista contínua; um divisor sutil ou eyebrow único separaria intenções.
- Links externos sem indicador visual de "↗ nova aba".
- Criei `.claude/launch.json` (config `av-site-dev`, porta 3000) para renderizar/inspecionar a página; mantive porque habilita futuros `preview`/`critique`. Remova se não quiser versioná-lo.

## Questions to Consider

- E se a pilha não fosse uniforme — WhatsApp e quiz com peso físico (hard-shadow) e os destinos como uma lista mais leve abaixo? Isso comunicaria curadoria em vez de catálogo.
- Os 12 links precisam estar todos visíveis de uma vez, ou "Destinos" poderia ser um grupo recolhido depois das 3 ações principais?
- Como seria a versão *confiante* desta página — uma que ninguém confundiria com um Linktree genérico?
