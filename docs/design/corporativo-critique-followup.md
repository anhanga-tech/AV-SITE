# /corporativo — follow-up do critique (impeccable)

Handoff para continuar a melhoria da landing `/corporativo` em outra sessão.

- **Critique completo (snapshot):** `.impeccable/critique/2026-06-28T03-29-21Z__pages-landings-corporativolanding-tsx.md`
- **Nota atual:** 32/40 (sem P0/P1). Trend: 31 → 32.
- **Como retomar:** rode `/impeccable polish corporativo` (lê o snapshot como backlog) ou os comandos abaixo direto.

## Já feito

- **Polish** (PR #961, mergeado): eyebrow do hero (oliva → vidro com âmbar) e brilho do globo (`brightness` 2 → 1.45, arcos amarelo/ciano legíveis).
- **Harden** (PR #963): a11y de motion (`MotionConfig reducedMotion="user"` + globo respeita `prefers-reduced-motion` + helper `prefersReducedMotion()`) e visibilidade sem JS (`<noscript>` para o `opacity:0` que o framer serializa no prerender). Cobertura: unit + e2e reduced-motion.

## Pendências (em ordem de impacto)

### 1. Cor — `/impeccable colorize corporativo` · P2 (maior ganho)
Pilares e processo usam `blue-100 / sky-100 / amber-100` por item, diluindo a identidade navy + ciano + amarelo para um genérico "SaaS simpático".
- **Onde:** `components/landings/corporativo/constants.ts` (PILLARS) e `components/landings/corporativo/CorpProcess.tsx` (STEPS); tape colors em `components/landings/shared/LandingPillars.tsx:21` (`bg-emerald-100/90` destoa do acento âmbar do 3º card).
- **Fix:** restringir a 2–3 cores da marca ou 1 acento por seção.

### 2. Cadência de eyebrow — `/impeccable distill corporativo` · P3
4 eyebrows skewed em sequência (hero, pilares, banda, contato) lê como andaime. O processo já entra direto pelo H2 — bom.
- **Fix:** manter o eyebrow só no hero e no contato; pilares e banda entram pelo H2.

### 3. Higiene final — `/impeccable polish corporativo` · P3
- Cor `#94a3b8` fora do DESIGN.md (único achado do `detect.mjs`) — pontos do fundo em `LandingPillars.tsx:29`. Tokenizar.
- Globo carrega `earth-night.jpg` de `//unpkg.com` (`CorpGlobe.tsx`) — hospedar no R2 próprio.
- Reconferir contraste do corpo `zinc-500` sobre `#fffdf5` (limite de 4.5:1).

## Observações menores (do critique)

- Dois widgets fixos globais (launcher "Roteiro IA" + back-to-top) competem com os CTAs e usam z-index arbitrário.
- Globo sem loading state.

Após as pendências, re-rodar `/impeccable critique corporativo` para confirmar a nota subindo.
