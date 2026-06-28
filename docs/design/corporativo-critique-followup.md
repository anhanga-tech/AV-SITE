# /corporativo — follow-up do critique (impeccable)

Handoff para continuar a melhoria da landing `/corporativo` em outra sessão.

- **Critique completo (snapshot):** `.impeccable/critique/2026-06-28T03-29-21Z__pages-landings-corporativolanding-tsx.md`
- **Nota atual:** 32/40 (sem P0/P1). Trend: 31 → 32.
- **Como retomar:** rode `/impeccable polish corporativo` (lê o snapshot como backlog) ou os comandos abaixo direto.

## Já feito

- **Polish** (PR #961, mergeado): eyebrow do hero (oliva → vidro com âmbar) e brilho do globo (`brightness` 2 → 1.45, arcos amarelo/ciano legíveis).
- **Harden** (PR #963): a11y de motion (`MotionConfig reducedMotion="user"` + globo respeita `prefers-reduced-motion` + helper `prefersReducedMotion()`) e visibilidade sem JS (`<noscript>` para o `opacity:0` que o framer serializa no prerender). Cobertura: unit + e2e reduced-motion.
- **Colorize**: rampa oceânica navy→sky→ciano nos pilares e no processo. 3º card/passo (`amber` → `cyan`) e fita washi (`emerald` → `cyan`); âmbar agora exclusivo dos CTAs (Regra do Âmbar). Dot-grids tintados para sapphire (sai o `#94a3b8` indocumentado) e corpo `text-sm` `zinc-500` → `zinc-600` (contraste ~7.5:1 sobre o creme). `text-emerald-500` mantido só no ícone de sucesso do form (verde = semântica de sucesso).

## Pendências (em ordem de impacto)

### 1. Cadência de eyebrow — `/impeccable distill corporativo` · P3
4 eyebrows skewed em sequência (hero, pilares, banda, contato) lê como andaime. O processo já entra direto pelo H2 — bom.
- **Fix:** manter o eyebrow só no hero e no contato; pilares e banda entram pelo H2.

### 2. Higiene final — `/impeccable polish corporativo` · P3
- Globo carrega `earth-night.jpg` de `//unpkg.com` (`CorpGlobe.tsx`) — hospedar no R2 próprio.
- (resolvido no colorize: `#94a3b8` dos dots tintado para sapphire; contraste do corpo `zinc-500` → `zinc-600`.)

## Observações menores (do critique)

- Dois widgets fixos globais (launcher "Roteiro IA" + back-to-top) competem com os CTAs e usam z-index arbitrário.
- Globo sem loading state.

Após as pendências, re-rodar `/impeccable critique corporativo` para confirmar a nota subindo.
