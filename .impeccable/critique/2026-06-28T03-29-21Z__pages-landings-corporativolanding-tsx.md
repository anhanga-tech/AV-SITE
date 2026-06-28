---
target: a página corporativo
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-06-28T03-29-21Z
slug: pages-landings-corporativolanding-tsx
---
## Design Health Score — /corporativo (pós-polish)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Form cobre submitting/success/error; globo sem loading state |
| 2 | Match System / Real World | 4 | PT-BR claro, sem jargão |
| 3 | User Control and Freedom | 3 | Dois caminhos (WhatsApp/form); globo auto-rotaciona sem controle |
| 4 | Consistency and Standards | 3 | Botões coesos; ainda 4 eyebrows + acentos pastel azul/sky/âmbar |
| 5 | Error Prevention | 3 | Validação + LGPD obrigatório |
| 6 | Recognition Rather Than Recall | 4 | Fluxo simples |
| 7 | Flexibility and Efficiency | 3 | Atalho WhatsApp + form |
| 8 | Aesthetic and Minimalist Design | 3 | Hero disciplinado agora; resta ruído (noise+dot-grid+2 widgets fixos) |
| 9 | Error Recovery | 3 | Mensagens presentes, genéricas |
| 10 | Help and Documentation | 3 | Contato visível; launcher global |
| **Total** | | **32/40** | **Bom — hero resolvido, teto agora em consistência de cor + a11y de motion** |

## Anti-Patterns Verdict

**Não parece "feito por IA".** Identidade própria e comprometida: botões neo-brutalistas com sombra dura, eyebrow do hero agora em pill de vidro com avião âmbar (sem o oliva anterior), globo com arcos amarelo/ciano legíveis (brilho reduzido para 1.45), pilares scrapbook (fita washi + rotação + ordinal atrás) e processo numerado real (01/02/03 = sequência genuína, não andaime).

**Scan determinístico (detect.mjs):** 1 ocorrência — `LandingPillars.tsx:29`, cor `#94a3b8` não documentada no DESIGN.md (cor dos pontos do fundo). Nenhum gradient-text, side-stripe, glassmorphism decorativo ou hero-metric.

**Evidência de browser:** screenshots desktop (1440×900) e mobile (390px) de todas as seções, com banner de cookies dispensado e reveals disparados via scroll. Hero, pilares, processo, banda e contato renderizam sem overflow.

## Overall Impression

O polish resolveu o que travava a página: o hero agora respira (CTAs na dobra, globo contido com cor de marca, eyebrow limpo). Subiu de 31→32. O teto restante não é mais cosmético de hero — é **disciplina de cor** (pastéis azul/sky/âmbar diluindo o navy+amarelo) e **acessibilidade de motion** (zero guard de `prefers-reduced-motion` num projeto cujo PRODUCT.md diz que isso "não é opcional").

## What's Working

1. **Hero coeso e disciplinado.** Eyebrow de vidro unificado com os badges, CTA âmbar como único grito, globo com arcos amarelo/ciano contando "conectamos sua empresa a destinos". A primeira ação cabe na dobra em desktop e mobile.
2. **Sistema de botão neo-brutalista.** Sombra dura com press-down consistente em nav, hero, banda e form. Assinatura, não enfeite.
3. **Processo numerado legítimo.** "Como funciona em 3 passos" usa 01/02/03 porque É uma sequência ordenada — números carregam informação, não são scaffolding.

## Priority Issues

### [P2] Sem guard de prefers-reduced-motion
- **O que:** Globo `controls.autoRotate = true` incondicional (`CorpGlobe.tsx:76`) e animações de entrada framer (`fadeUp`, springs dos pilares) rodam sempre. Nenhum `useReducedMotion`/`MotionConfig`/media query em toda a landing.
- **Por que importa:** PRODUCT.md: "Reduced motion não é opcional." Usuários com vestibular disorder recebem rotação contínua + reveals sem alternativa.
- **Fix:** `MotionConfig reducedMotion="user"` no wrapper da landing e desligar `autoRotate` quando `useReducedMotion()` for true.
- **Comando sugerido:** `/impeccable harden`

### [P2] Pastéis azul/sky/âmbar diluem o navy+amarelo
- **O que:** Pilares e processo usam `blue-100/sky-100/amber-100` por item; a identidade forte é navy + amarelo + ciano.
- **Por que importa:** O acúmulo de pastéis "amigáveis" puxa para o genérico-SaaS-simpático e enfraquece a voz que o hero estabelece.
- **Fix:** Restringir a 2–3 cores próprias (navy/ciano/amarelo) ou um único acento por seção.
- **Comando sugerido:** `/impeccable colorize`

### [P2] Conteúdo escondido atrás de whileInView (risco prerender/no-JS)
- **O que:** Pilares e processo usam `initial="hidden"` (opacity 0) + `whileInView`. Em render real com scroll funciona; mas o HTML prerenderizado sai com `opacity:0` e, sem JS, as seções ficam invisíveis.
- **Por que importa:** O guia: "reveals devem enriquecer um default já visível." Afeta SEO/no-JS e mora em `components/landings/shared/` (4 landings).
- **Fix:** Default visível + animar só com JS ativo (ou via IntersectionObserver com fallback).
- **Comando sugerido:** `/impeccable harden`

### [P3] Eyebrow ainda como cadência de seção
- **O que:** Hero, pilares, banda e contato abrem com o mesmo micro-label skewed (4×). Processo já entra direto pelo H2 — bom.
- **Por que importa:** 4 em sequência ainda lê como andaime; o guia trata eyebrow recorrente como gramática de IA.
- **Fix:** Manter o eyebrow só onde carrega informação (hero, contato); pilares/banda entram pelo H2.
- **Comando sugerido:** `/impeccable distill`

### [P3] Cor #94a3b8 fora do DESIGN.md + globo via CDN de terceiros
- **O que:** Detector aponta `#94a3b8` (pontos do fundo dos pilares) não documentada. Globo carrega textura de `//unpkg.com` (dependência externa no caminho do hero).
- **Por que importa:** Higiene de token e resiliência. Baixo impacto direto no usuário.
- **Fix:** Tokenizar a cor dos pontos; hospedar `earth-night.jpg` no R2 próprio.
- **Comando sugerido:** `/impeccable polish`

## Persona Red Flags

**Sam (acessibilidade, reduced motion):** o globo gira sem parar e os reveals disparam mesmo com "reduzir movimento" ativo no SO — desconforto real, sem alternativa. Pior red flag atual.

**Jordan (primeira vez, desktop):** experiência clara — headline, dois CTAs visíveis, badges de prova. Sem fricção. O launcher global "Roteiro IA" no canto soma uma 3ª chamada de ação, mas não confunde.

**Casey (mobile, com pressa):** hero encaixa, CTAs grandes no polegar, form com autocomplete e labels. Único ruído: launcher de chat + seta voltar-ao-topo sobrepõem o canto inferior.

## Minor Observations

- Dois widgets fixos globais (launcher "Roteiro IA" + back-to-top) competem visualmente com os CTAs da página e usam z-index arbitrário; idealmente escala semântica de z-index.
- Texto de corpo cinza (`zinc-500`) sobre a superfície quente `#fffdf5` está no limite do 4.5:1 — vale conferir o contraste nas descrições de pilares/processo.
- Banda WhatsApp: "Chama no WhatsApp" em ciano sobre navy fica vivo e legível — bom uso da cor de marca.

## Questions to Consider

- A página tem 3–4 canais de ação (WhatsApp no nav, hero, "ser contatado", launcher global). Qual deve converter 80% — e os outros estão ajudando ou competindo?
- O globo precisa girar sempre, ou poderia pausar em reduced-motion e no hover, ganhando acessibilidade sem perder o efeito?
- Se pilares e processo usassem só navy/ciano/amarelo, a página ganharia foco ou perderia o tom "amigável"?
