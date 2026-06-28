# /corporativo — follow-up do critique (impeccable)

Handoff para continuar a melhoria da landing `/corporativo` em outra sessão.

- **Critique completo (snapshot):** `.impeccable/critique/2026-06-28T03-29-21Z__pages-landings-corporativolanding-tsx.md`
- **Nota atual:** 32/40 (sem P0/P1). Trend: 31 → 32.
- **Como retomar:** rode `/impeccable polish corporativo` (lê o snapshot como backlog) ou os comandos abaixo direto.

## Já feito

- **Polish** (PR #961, mergeado): eyebrow do hero (oliva → vidro com âmbar) e brilho do globo (`brightness` 2 → 1.45, arcos amarelo/ciano legíveis).
- **Harden** (PR #963): a11y de motion (`MotionConfig reducedMotion="user"` + globo respeita `prefers-reduced-motion` + helper `prefersReducedMotion()`) e visibilidade sem JS (`<noscript>` para o `opacity:0` que o framer serializa no prerender). Cobertura: unit + e2e reduced-motion.
- **Colorize**: rampa oceânica navy→sky→ciano nos pilares e no processo. 3º card/passo (`amber` → `cyan`) e fita washi (`emerald` → `cyan`); âmbar agora exclusivo dos CTAs (Regra do Âmbar). Dot-grids tintados para sapphire (sai o `#94a3b8` indocumentado) e corpo `text-sm` `zinc-500` → `zinc-600` (contraste ~7.5:1 sobre o creme). `text-emerald-500` mantido só no ícone de sucesso do form (verde = semântica de sucesso).
- **Distill**: removidos os eyebrows de seção de pilares (`O Jeito Anhangá`) e banda (`Bate-papo rápido`) — ambas entram pelo H2. Resta só o eyebrow do hero (`Viagens para Empresas`), que identifica a página. Eyebrow virou prop opcional em `LandingPillars` (`eyebrow`, default preserva consumidores) e `subtitle` opcional em `LandingWhatsAppBand`. O header `✈ Contato / Corporativo` do form foi mantido (device de bilhete de embarque, não eyebrow).
- **Polish**: foco visível de 2 sinais (`focus-visible:outline-2 outline-offset-2 outline-anhanga-action`, padrão do `components/ui/Button.tsx`) em todos os interativos que não tinham — nav (logo + botão), CTAs do hero, banda (`outline-white` sobre o navy), submit do form, links de contato/sociais, link do success e nav inferior "Conheça também". Antes só os campos do form tinham foco; os CTAs (caminho de conversão) dependiam do outline default do browser, violando o piso WCAG AA do PRODUCT.md.

## Pendências (em ordem de impacto)

### 1. Globo via CDN de terceiros — `/impeccable polish` · P3
- `CorpGlobe.tsx` carrega `earth-night.jpg` de `//unpkg.com` (dependência externa no caminho do hero) — hospedar no R2 próprio. Tarefa de infra (upload no R2), fora do alcance de uma mudança só de código.

## Observações menores (do critique)

- Dois widgets fixos globais (launcher "Roteiro IA" + back-to-top) competem com os CTAs e usam z-index arbitrário.
- Globo sem loading state.

Após as pendências, re-rodar `/impeccable critique corporativo` para confirmar a nota subindo.
