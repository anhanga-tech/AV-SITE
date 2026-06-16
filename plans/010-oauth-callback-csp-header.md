# Plan 010: Adicionar header CSP à resposta HTML do callback OAuth do Decap

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 68eecf6..HEAD -- api/auth/callback.ts tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: MED (pode quebrar o handshake OAuth do CMS se a CSP for restritiva
  demais — teste com cuidado)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `68eecf6`, 2026-06-12

## Why this matters

`api/auth/callback.ts` retorna uma página HTML com **JavaScript inline** que faz
o handshake `postMessage` com a janela do Decap CMS (`/admin`). A resposta hoje
não envia `Content-Security-Policy`. Como a página contém script inline e embute
um `allowedOrigin` no script, uma CSP — mesmo permitindo `'unsafe-inline'` para
o script próprio — limita o dano caso surja qualquer injeção: bloqueia
`default-src`, restringe para onde o `postMessage`/conexões podem ir, e impede
carregamento de recursos externos não previstos. É hardening de camada-2; a
validação de input (state, origin) já é forte. O custo é um header; o risco é a
CSP ser restritiva demais e quebrar o handshake — por isso o teste manual do
fluxo `/admin` é obrigatório.

## Current state

`api/auth/callback.ts`:

- A função que monta o HTML do handshake (`buildPostMessageHtml` ou similar —
  confirme o nome) embute script inline com `window.opener.postMessage(handshake,
  allowedOrigin)` (visível em `:102`) e um `handshakeTimeout` (`:96`).
- `:108-114` — a resposta:
  ```ts
  return new Response(html, {
      status: httpStatus,
      headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': 'oauth_state=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax; Secure',
      },
  });
  ```
  → não há `Content-Security-Policy`.
- O `allowedOrigin` é validado contra
  `/^https:\/\/(?:[a-zA-Z0-9-]+\.)*anhanga\.tur\.br$/` (visto perto de `:79`) com
  fallback para `process.env.ALLOWED_ORIGIN`. **Leia o arquivo para confirmar o
  valor final de `allowedOrigin`** — ele é necessário na diretiva CSP
  `frame-ancestors`/`form-action` se aplicável, e para garantir que o
  `postMessage` de destino é coberto.
- O handler também pode retornar respostas de erro HTML em outros pontos —
  procure todos os `new Response(` que servem `text/html` neste arquivo
  (`grep -n "text/html" api/auth/callback.ts`) para aplicar a CSP de forma
  consistente.

Convenções (`.claude/rules/security.md`): usar `dangerouslySetInnerHTML`/HTML
inline só para conteúdo controlado (este é repo-managed, aceitável); adicionar
hardening sem quebrar funcionalidade.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Achar respostas HTML | `grep -n "text/html" api/auth/callback.ts` | lista os pontos |
| Typecheck | `pnpm typecheck` | exit 0 |
| E2E Decap admin | `pnpm test:e2e tests/e2e/decap-admin.spec.ts` | passa |
| Suíte regressão | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `api/auth/callback.ts` — adicionar header `Content-Security-Policy` às
  respostas HTML (sucesso e erro).
- Teste de regressão do header (ver "Test plan").

**Out of scope** (NÃO tocar):
- A lógica de validação de state/origin (já correta).
- `api/auth.ts` (início do fluxo, redirect — não serve HTML inline com script).
- Outros handlers — CSP em handlers de API JSON é assunto separado; aqui o foco
  é só a página HTML do callback.

## Git workflow

- Branch: `fix/010-oauth-callback-csp`
- Commit convencional, ex.: `fix(security): adicionar CSP à página de callback OAuth do Decap`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Definir a diretiva CSP

A página precisa: executar seu próprio script inline; fazer `postMessage` para
`window.opener` (não é controlado por CSP, mas a origem-alvo é o `allowedOrigin`);
não carregar nenhum recurso externo (sem CSS/img/fetch externos). Uma CSP
adequada:

```
default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

- `default-src 'none'` bloqueia tudo por padrão.
- `script-src 'unsafe-inline'` permite o script de handshake (sem `'unsafe-inline'`
  ele não roda — não há build/nonce nesse HTML gerado em runtime). Não inclua
  `'unsafe-eval'`.
- `style-src 'unsafe-inline'` apenas se o HTML usar estilos inline; se não usar,
  pode omitir. Confirme lendo o template HTML.
- `frame-ancestors 'none'` impede a página de ser enquadrada (clickjacking).

**Não** adicione `connect-src` para o `postMessage` — `postMessage` não é
coberto por `connect-src`. Se o script fizer algum `fetch`, aí sim ajuste.

**Verify**: ler o template HTML e confirmar que nenhuma diretiva acima bloqueia
um recurso realmente usado.

### Step 2: Aplicar o header em todas as respostas HTML do callback

Para cada `new Response(html, { headers: { 'Content-Type': 'text/html...' } })`
no arquivo (sucesso e erro), adicionar a chave
`'Content-Security-Policy': '<diretiva do Step 1>'`. Considere extrair a string
da CSP para uma constante local no topo do módulo para evitar divergência entre
os pontos.

**Verify**: `pnpm typecheck` → exit 0;
`grep -c "Content-Security-Policy" api/auth/callback.ts` ≥ número de respostas HTML.

### Step 3: Validar o fluxo OAuth de ponta a ponta

Ver "Test plan". O teste manual do `/admin` é **obrigatório** porque uma CSP
restritiva demais quebra silenciosamente o handshake (a janela do CMS nunca
recebe o token).

**Verify**: `pnpm test:e2e tests/e2e/decap-admin.spec.ts` passa;
`pnpm test:regression` exit 0.

## Test plan

- **Regressão (node:test)**: se houver um teste do callback (procure
  `grep -rln "auth/callback\|callback" tests/`), estenda-o; senão crie
  `tests/auth-callback-csp.test.ts` que invoca o handler com um request mockado
  de sucesso e asserta que a resposta inclui o header `Content-Security-Policy`
  com `default-src 'none'` e `script-src 'unsafe-inline'`. Modele o mock em
  `tests/auth-callback-schema.test.ts` (já existe e exercita esse handler).
- **E2E (Playwright)**: `tests/e2e/decap-admin.spec.ts` cobre o admin — confirme
  que continua passando (o handshake não pode quebrar).
- **Manual obrigatório**: `pnpm dev` + `pnpm cms:proxy`, acessar `/admin`,
  fazer login via GitHub OAuth, confirmar que o login completa (token chega ao
  CMS). Verificar no DevTools → Console que não há violações de CSP.

## Done criteria

- [ ] Todas as respostas HTML do callback incluem `Content-Security-Policy`
- [ ] CSP usa `default-src 'none'` + `script-src 'unsafe-inline'` (sem `unsafe-eval`)
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:e2e tests/e2e/decap-admin.spec.ts` passa
- [ ] `pnpm test:regression` exit 0 (incluindo o novo teste do header)
- [ ] Login `/admin` validado manualmente sem violações de CSP no console
- [ ] `git status` mostra apenas arquivos in-scope
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se o login do `/admin` parar de funcionar com a CSP aplicada (handshake não
  completa, ou o console mostra violação), PARE — afrouxe a diretiva mínima
  necessária (ex.: o template pode usar `style-src` inline ou um recurso que
  você não previu) e documente o porquê. **Não** remova a CSP inteira para
  "fazer funcionar".
- Se o handshake depender de carregar algo de um domínio externo (improvável,
  mas confirme lendo o HTML), PARE e ajuste a CSP com a origem específica —
  nunca com `*`.
- Se os excertos de "Current state" não baterem, PARE (drift).

## Maintenance notes

- Se o template HTML do callback ganhar recursos externos no futuro (fonte, CSS,
  imagem), a CSP precisará da origem específica — mantenha `default-src 'none'`
  e adicione apenas o necessário, por diretiva.
- Considere, em follow-up separado, estender CSP às demais respostas HTML do
  app (prerender/SSR) — fora do escopo deste plano, que cobre só o callback.
