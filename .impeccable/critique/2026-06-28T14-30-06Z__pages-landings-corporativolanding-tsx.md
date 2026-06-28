---
target: a página corporativo
total_score: 34
p0_count: 0
p1_count: 0
timestamp: 2026-06-28T14-30-06Z
slug: pages-landings-corporativolanding-tsx
---
## Design Health Score — /corporativo (pós colorize + distill + polish)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Form cobre submitting/success/error; globo ainda sem loading state (Suspense fallback null) |
| 2 | Match System / Real World | 4 | PT-BR claro, metáforas reais (bilhete de embarque, diário) |
| 3 | User Control and Freedom | 3 | WhatsApp + form + âncora; globo auto-rotaciona mas respeita reduced-motion (sem pause-on-hover) |
| 4 | Consistency and Standards | 4 | Paleta unificada navy→ciano; foco visível canônico em todos os interativos; 1 eyebrow só |
| 5 | Error Prevention | 3 | Validação + LGPD obrigatório |
| 6 | Recognition Rather Than Recall | 4 | Fluxo simples, opções visíveis |
| 7 | Flexibility and Efficiency | 3 | Atalho WhatsApp + form; nav por teclado agora com foco visível |
| 8 | Aesthetic and Minimalist Design | 4 | Hero disciplinado, pastéis e eyebrows removidos; resta textura (noise+dot-grid) + 2 widgets fixos globais |
| 9 | Error Recovery | 3 | Mensagens presentes, genéricas |
| 10 | Help and Documentation | 3 | Contato visível; launcher global |
| **Total** | | **34/40** | **Bom — subiu em consistência e minimalismo; teto restante é infra (globo) + chrome global** |

## Anti-Patterns Verdict

**Não parece "feito por IA".** Identidade própria e comprometida, agora mais disciplinada: hero com globo de arcos amarelo/ciano, botões neo-brutalistas com sombra dura press-down, pilares scrapbook (fita washi + rotação + ordinal) e processo numerado legítimo (01/02/03 = sequência real). O colorize alinhou pilares e processo a uma rampa oceânica navy→sky→ciano (sem os pastéis azul/sky/âmbar genéricos e sem o emerald da fita); o âmbar virou exclusivo dos CTAs (Regra do Âmbar). O distill removeu a cadência de eyebrow — restou só o do hero, que identifica a página.

**Scan determinístico (detect.mjs):** `[]` — zero ocorrências. O único achado anterior (`#94a3b8` indocumentado em `LandingPillars.tsx:29`) foi tokenizado para sapphire. Nenhum gradient-text, side-stripe, glassmorphism decorativo ou hero-metric.

**Evidência de browser:** screenshots desktop (1280×900) e mobile (375px) de hero, pilares, processo, banda e contato, com reveals disparados via scroll. Sem overflow. CSS de foco confirmado ao vivo (`outline-color: #0ea5e9`, offset 2px). Foco por teclado não capturável em screenshot (`:focus-visible` exige eventos `isTrusted`).

## Overall Impression

A landing saiu de "boa com teto cosmético" para "sólida e disciplinada". Os três passos da sessão atacaram exatamente o que travava a nota: cor (rampa de marca em vez de pastel-rainbow), cadência (1 eyebrow em vez de 4) e acessibilidade (foco visível de 2 sinais em todo o caminho de conversão, que antes dependia do outline default do browser). 32 → 34. O teto restante não é mais do design da página em si — é o globo carregando textura de CDN de terceiros (infra) e os dois widgets fixos globais que competem com os CTAs.

## What's Working

1. **Disciplina cromática.** Pilares e processo num eixo navy→ciano coeso; o amarelo reservado ao grito de ação. A página tem 3 cores de marca com papéis claros, não 5 matizes diluídos.
2. **Cadência limpa.** Sem eyebrow em toda seção. Hero abre com kicker informativo; pilares, processo, banda e contato entram pelo H2. Menos andaime, mais respiro.
3. **Acessibilidade real.** Reduced-motion (harden) + foco visível canônico em nav, CTAs, form, links e social (polish). O caminho de conversão é navegável por teclado com sinal visível.

## Priority Issues

### [P3] Globo carrega textura de CDN de terceiros
- **O que:** `CorpGlobe.tsx` usa `//unpkg.com/three-globe/example/img/earth-night.jpg` no caminho do hero.
- **Por que importa:** Dependência externa e ponto único de falha visual (há fallback, mas o caminho feliz depende do unpkg). Resiliência e controle do asset.
- **Fix:** Hospedar `earth-night.jpg` no R2 próprio (`media.anhanga.tur.br`). Tarefa de infra (upload no R2), fora do alcance de mudança só de código.
- **Comando sugerido:** `/impeccable polish`

### [P3] Globo sem loading state
- **O que:** `Suspense fallback={null}` + import assíncrono de `globe.gl`; durante o load o lado direito do hero fica vazio.
- **Por que importa:** É decorativo e `aria-hidden`, então o impacto é baixo, mas um shimmer/placeholder sutil suavizaria a chegada.
- **Comando sugerido:** `/impeccable polish`

### [P3] Dois widgets fixos globais competem com os CTAs
- **O que:** Launcher "Roteiro IA" + back-to-top no canto inferior usam z-index arbitrário e somam chamadas de ação além dos CTAs da página.
- **Por que importa:** Concorrência visual com o CTA dominante; escala de z-index não semântica. É chrome global, não específico da landing.
- **Comando sugerido:** `/impeccable polish` (escopo global, fora da landing)

## Persona Red Flags

**Sam (acessibilidade):** principais red flags anteriores resolvidos — reduced-motion respeitado (globo para, reveals viram crossfade) e foco visível de 2 sinais em todo interativo. Restam: globo sem loading anunciado e contraste de alguns labels secundários `zinc-500` sobre creme no limite.

**Jordan (primeira vez, desktop):** experiência clara — headline, dois CTAs visíveis, badges de prova, fluxo de 3 passos numerado. Sem fricção. O launcher global soma uma 3ª chamada mas não confunde.

**Casey (mobile, com pressa):** hero encaixa na dobra, CTAs grandes no polegar, form com autocomplete e foco visível. Único ruído: launcher de chat + back-to-top sobrepõem o canto inferior.

## Minor Observations

- Labels secundários `text-zinc-500` sobre `#fffdf5` (ex.: "Nos siga nas redes") ficam no limite do 4.5:1 — corpo principal já foi para `zinc-600`.
- Globo depende de `globe.gl` + three.js no caminho do hero (peso de bundle no `leaflet-vendor`/chunk — verificar custo de LCP em conexões lentas).
- Os dois widgets fixos globais idealmente numa escala de z-index semântica (dropdown → sticky → modal → toast).

## Questions to Consider

- O globo precisa girar sempre, ou poderia pausar no hover além do reduced-motion, ganhando controle sem perder o efeito?
- Vale hospedar a textura do globo no R2 agora (resiliência) ou deixar como dívida conhecida até a próxima janela de infra?
- A página tem 3 canais de ação (WhatsApp no nav/hero, "ser contatado", launcher global). Qual deve converter 80% — e o launcher global ajuda ou compete?
