# Plan 001: Atualizar documentação para refletir Cloudflare Pages e Salesforce (pós-migração)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d27f8b0..HEAD -- .claude/CLAUDE.md README.md .env.example docs/ops/deploy.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `d27f8b0`, 2026-06-12

## Why this matters

O deploy primário migrou de Vercel para **Cloudflare Pages** em maio/2026, e o CRM migrou de HubSpot para **Salesforce** (leads ainda fluem via n8n; HubSpot permanece apenas para eventos legados de deal Closed-Won). Porém `.claude/CLAUDE.md`, `README.md`, `.env.example` e `docs/ops/deploy.md` ainda descrevem Vercel como plataforma primária e HubSpot como CRM obrigatório. Como o `CLAUDE.md` é carregado em toda sessão de agente de IA, cada sessão parte de premissas erradas sobre a arquitetura — este plano corrige a fonte de orientação de todos os outros trabalhos.

## Current state

- `.claude/CLAUDE.md:9` — `**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Vercel Edge Functions` (errado: deploy é Cloudflare Pages; os handlers em `api/` são adaptados por wrappers em `functions/`).
- `.claude/CLAUDE.md:47-50` — bloco de env vars lista `HUBSPOT_TOKEN`, `HUBSPOT_DEAL_PIPELINE_ID`, `HUBSPOT_DEAL_STAGE_ID` como "HubSpot CRM (required)".
- `.claude/CLAUDE.md:90` — `/api          Vercel Edge Functions (15 handlers)`.
- `.claude/CLAUDE.md:149` — "n8n creates/updates the HubSpot contact and deal via `HUBSPOT_TOKEN`" (o CRM de destino hoje é Salesforce; ver `services/salesforce.ts`, `api/submit-lead-sf.ts` e PR #854 que espelhou formulários no Salesforce web-to-lead).
- `.claude/CLAUDE.md` seção "Deployment" — lista "**Vercel** (primary)".
- `.env.example:37` — `HUBSPOT_TOKEN=seu_token_do_app_privado` marcado como obrigatório.
- `README.md:13,33-34` — lista "HubSpot CRM" e "Vercel Analytics" como features.
- `docs/ops/deploy.md` — instruções de deploy lideram com Vercel.
- Evidência da realidade atual: `wrangler.toml` na raiz (`pages_build_output_dir = "dist"`), diretório `functions/` (Pages Functions, incl. `functions/_middleware.ts`), Node pinado em 24 via `.node-version`.
- O que **continua verdadeiro** (não remova): `api/hubspot-webhook.ts`, `services/hubspot.ts` e `lib/hubspot-validation.ts` ainda existem e processam eventos legados de deal Closed-Won — documente-os como legado, não como fluxo primário.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 |
| Testes de regressão | `pnpm test:regression` | todos passam |
| Conferir refs residuais | `grep -rn "Vercel Edge Functions" .claude/CLAUDE.md README.md` | sem matches |

## Scope

**In scope** (únicos arquivos a modificar):
- `.claude/CLAUDE.md`
- `README.md`
- `.env.example`
- `docs/ops/deploy.md`

**Out of scope** (NÃO tocar):
- Qualquer código em `api/`, `functions/`, `lib/`, `services/` — este plano é só de docs.
- `vercel.json` e `netlify.toml` — os arquivos de config permanecem (deploys secundários); apenas a documentação muda.
- Remoção de código HubSpot — coberta por decisão futura separada (ver plans/README.md, achado DEPS-02).

## Git workflow

- Branch: `docs/001-update-post-migration-docs`
- Commit convencional, ex.: `docs: atualizar CLAUDE.md e README para Cloudflare Pages + Salesforce`
- Nunca commitar direto na `main`; abrir PR com squash merge (convenção do repo). NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Atualizar `.claude/CLAUDE.md`

1. Linha 9: trocar "Vercel Edge Functions" por "Cloudflare Pages Functions (handlers edge-style em `api/`, adaptados em `functions/`)".
2. Seção de env vars: mover o bloco HubSpot de "(required)" para um grupo "Legacy (somente webhook de deals Closed-Won)"; adicionar nota de que o CRM ativo é Salesforce via n8n e `api/submit-lead-sf.ts` (web-to-lead).
3. Linha ~90: trocar "Vercel Edge Functions (15 handlers)" por "Handlers edge-style (executados como Cloudflare Pages Functions via `functions/`)".
4. Seção "Lead Capture Flow" (linha ~149): reescrever o passo 5 para "n8n cria/atualiza o lead no Salesforce (CRM ativo); o caminho HubSpot é legado".
5. Seção "Deployment": liderar com "**Cloudflare Pages** (primário) — `wrangler.toml`, `functions/`, Node 24 via `.node-version`"; rebaixar Vercel e Netlify para "configs legadas/secundárias mantidas no repo".

**Verify**: `grep -cn "Vercel" .claude/CLAUDE.md` → as menções restantes devem ser apenas históricas/legadas (leia cada match e confirme contexto).

### Step 2: Atualizar `README.md`

Trocar a feature "HubSpot CRM" pela descrição real (Salesforce via n8n) e remover/ajustar "Vercel Analytics" se não estiver mais ativo (confira `package.json` por `@vercel/analytics`; se o pacote não existir nas deps, remova a menção).

**Verify**: `grep -n "HubSpot" README.md` → sem matches (ou só em contexto "legado").

### Step 3: Atualizar `.env.example`

Mover as variáveis `HUBSPOT_*` para uma seção comentada `# --- Legado (webhook de deals HubSpot) ---` e garantir que as variáveis Salesforce/n8n usadas pelos handlers atuais estejam presentes. Para descobrir as atuais: `grep -rhn "process.env\." api/ lib/ services/ | grep -o "process\.env\.[A-Z_]*" | sort -u` e compare com o `.env.example`.

**Verify**: toda variável retornada pelo grep acima existe no `.env.example` (vars `VITE_*` ficam fora — são build-time) → liste as ausentes; deve ser vazio.

### Step 4: Atualizar `docs/ops/deploy.md`

Reestruturar para liderar com Cloudflare Pages (build `pnpm build`, output `dist`, functions em `functions/`, secrets no dashboard do Pages). Mover instruções Vercel para seção final "Legado".

**Verify**: primeira seção de plataforma do arquivo menciona Cloudflare Pages.

## Test plan

Mudança somente de documentação — sem testes novos (isento pela regra do repo em `.claude/rules/testing.md`). Rode `pnpm test:regression` mesmo assim para garantir que nada foi tocado por engano.

## Done criteria

- [ ] `grep -rn "Vercel Edge Functions" .claude/CLAUDE.md README.md` → sem matches
- [ ] `grep -n "required" .claude/CLAUDE.md | grep -i hubspot` → sem matches
- [ ] `pnpm test:regression` exit 0
- [ ] `git status` mostra somente os 4 arquivos in-scope modificados
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se descobrir que algum fluxo de produção ainda escreve leads novos no HubSpot (procure chamadas ativas a `services/hubspot.ts` fora do caminho de webhook), PARE e reporte — a premissa "Salesforce é o CRM ativo" estaria errada.
- Se `.env.example` contiver valores que pareçam segredos reais (não placeholders), PARE e reporte o `file:line` sem copiar o valor.

## Maintenance notes

- Quando a limpeza do código HubSpot acontecer (achado DEPS-02 no índice), revisitar estes docs para remover a seção "legado".
- Revisor deve conferir que nenhuma instrução de deploy Cloudflare contradiz `docs/ops/cloudflare-rules.md`.
