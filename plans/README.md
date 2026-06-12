# Implementation Plans

Gerados pela skill improve em 2026-06-12, contra o commit `d27f8b0`. Execute na
ordem abaixo, salvo dependências. Cada executor: leia o plano inteiro antes de
começar, honre as STOP conditions e atualize sua linha ao terminar.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001 | Atualizar docs pós-migração (Cloudflare Pages + Salesforce) | P1 | S | — | DONE |
| 002 | Remover lockfile npm fantasma + mesclar testes lead-logic | P2 | S | — | DONE |
| 003 | Hardening: HTTPS nos webhooks n8n + validar ALLOWED_ORIGIN | P2 | S | — | DONE |
| 004 | Links internos absolutos → navegação SPA nas landings | P2 | M | — | DONE |
| 005 | Rejeitar markdown/URL em campos de destino do handoff IA | P3 | M | — | DONE |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (com motivo) | REJECTED (com justificativa)

## Dependency notes

- Sem dependências rígidas. Recomenda-se 001 primeiro porque executores dos
  demais planos leem o `.claude/CLAUDE.md` (hoje desatualizado) como contexto.

## Findings considered and rejected

- Inconsistência de timing-safe compare entre handlers: código atual é seguro
  (HMAC via crypto.subtle); risco apenas de padrão futuro — não vale plano.
- Edge cases do rate limiter (`lib/rate-limit.ts` TTL/in-memory dev): comportamento
  correto; footgun só em dev.
- Race de state OAuth multi-tab no Decap CMS (`api/auth.ts`/`callback.ts`): fricção
  rara de UX, validação de state continua correta; custo (M) > benefício.
- Validação de formato de click IDs em `api/purchase-dispatch.ts`: falha
  silenciosa no provedor, sem impacto de segurança.
- Cast/`JSON.parse` em `api/hubspot-webhook.ts`: seguro hoje (try-catch cobre);
  módulo é legado.
- `console.error` em `api/auth/callback.ts:85`: vazamento de informação já
  semi-pública; trocar por logger quando o arquivo for tocado por outro motivo.
- Refactor do `SearchForm.tsx` (1005 linhas): debt real, mas L de esforço com
  risco MED e sem bug ativo — não priorizado nesta rodada.
- Limpeza dos 7 arquivos HubSpot-only (`api/hubspot-webhook.ts`,
  `services/hubspot.ts`, `lib/hubspot-validation.ts` + 4 testes): depende de
  decisão de negócio (deals Closed-Won ainda passam por lá); planejar quando a
  migração de tracking de deals para Salesforce for confirmada.
- Footer Orlando com ano hardcoded: cosmético; corrigir quando tocar no arquivo.
- Script `verify` unificado / cache de Chrome no CI / `dev:cms` com concurrently:
  ganhos pequenos de DX; fazer oportunisticamente.

## Audit gaps

- A categoria **performance** não foi auditada adequadamente nesta rodada (o
  agente retornou vazio). Reauditar em sessão futura se houver interesse.
