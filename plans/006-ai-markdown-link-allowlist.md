# Plan 006: Restringir links do markdown da IA a uma allowlist no chat

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 68eecf6..HEAD -- components/AIChat.tsx lib/ai/ tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `68eecf6`, 2026-06-12

## Why this matters

O chat renderiza o texto do modelo Gemini como markdown bruto:
`<ReactMarkdown>{msg.text}</ReactMarkdown>` (`components/AIChat.tsx:543`). O
`react-markdown` v10 aplica um `urlTransform` padrão que bloqueia `javascript:`
e `data:`, mas **permite links http(s) para qualquer domínio**. Se o modelo
for confundido por input adversarial (prompt injection via mensagem do usuário)
ou jailbroken, ele pode emitir `[clique aqui](https://phishing.example)` que
renderiza como link clicável dentro da interface de marca da Anhangá — um vetor
de phishing. O repo já endurece o caminho de handoff (`stripUnsafeWhatsAppLinks`
e a rejeição de markdown/URL em campos de destino — PR #872), mas links
arbitrários **no corpo da resposta do chat** ainda passam.

Esta é uma guarda barata de defesa-em-profundidade: o texto legítimo do bot é
conselho de viagem em PT-BR e CTAs internos; ele não precisa renderizar links
para domínios externos arbitrários. A correção é uma allowlist de destinos de
link aplicada no ponto de renderização.

## Current state

- `components/AIChat.tsx:12` — `import ReactMarkdown from 'react-markdown';`
- `components/AIChat.tsx:541-544` — render da mensagem do modelo:
  ```tsx
  {msg.role === 'model' ? (
    <div className="prose prose-sm max-w-none prose-p:text-zinc-700 ...">
      <ReactMarkdown>{msg.text}</ReactMarkdown>
    </div>
  ) : (
  ```
- `react-markdown` está em `package.json` como dependência (v10.x). Suas APIs
  relevantes: a prop `urlTransform` (recebe `(url, key, node) => string` e o
  retorno é a URL final; retornar `''` neutraliza o href) e a prop `components`
  (override de elementos, ex.: `a`). Confirme a versão instalada com
  `grep -A1 '"react-markdown"' package.json` antes de codar.
- Convenções do repo (`.claude/rules/security.md`): sanitizar/constrain a saída
  da IA antes de transformá-la em links/ações; preferir allowlists a free-form;
  adicionar cobertura de regressão para correções de XSS/links inseguros.
- Não há helper de allowlist de URL hoje. O lugar natural para a lógica pura é
  `lib/ai/` (já contém `validation.ts`, `utils.ts`). A renderização fica no
  componente.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Versão react-markdown | `grep -A1 '"react-markdown"' package.json` | mostra a versão (esperado ^10) |
| Typecheck | `pnpm typecheck` | exit 0 |
| Teste isolado | `tsx --test tests/ai-markdown-links.test.ts` | todos passam |
| Suíte completa | `pnpm test:regression` | todos passam |

## Scope

**In scope**:
- `components/AIChat.tsx` — passar `urlTransform` (e/ou override do componente `a`).
- Um novo helper puro `lib/ai/safe-link.ts` (ou função adicionada a
  `lib/ai/utils.ts` se preferir manter o número de arquivos baixo) com a lógica
  de allowlist, **exportada e testável isoladamente**.
- `tests/ai-markdown-links.test.ts` (novo) — testa o helper puro.

**Out of scope** (NÃO tocar):
- `lib/ai/validation.ts`, `lib/ai/handoff.ts` — a sanitização server-side do
  handoff já existe (PR #872) e é independente da renderização cliente.
- `api/generate.ts` — não muda o contrato do servidor.
- A renderização de mensagens do usuário (`FormattedText`, linha 547) — input
  do usuário não é markdown e não é o vetor aqui.

## Git workflow

- Branch: `fix/006-ai-markdown-link-allowlist`
- Commit convencional, ex.: `fix(security): restringir links do markdown da IA a allowlist`
- PR com squash merge; NÃO fazer push sem instrução do operador.

## Steps

### Step 1: Criar o helper puro de allowlist

Crie `lib/ai/safe-link.ts` exportando `sanitizeAiLinkUrl(url: string): string`:

- Aceitar **links relativos internos**: qualquer string começando com `/`
  (ex.: `/blog`, `/consultoria-de-viagem`) e âncoras `#...` → retornar como está.
- Aceitar URLs absolutas **apenas** se, ao fazer `new URL(url)`, o hostname for
  exatamente `anhanga.tur.br` ou terminar em `.anhanga.tur.br`, **e** o
  `protocol` for `https:`. Nesse caso retornar a URL.
- Qualquer outra coisa (outro domínio, `http:`, `javascript:`, `data:`,
  `mailto:` não-anhanga, string que não parseia como URL) → retornar `''`
  (string vazia neutraliza o href no react-markdown).
- Usar early returns; sem regex frágil para parsing de URL — use `new URL` em
  try/catch.

Mantenha a função pura (sem acesso a DOM/window) para ser testável em `node:test`.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Aplicar no render do chat

Em `components/AIChat.tsx`:

- Importar `sanitizeAiLinkUrl` de `../lib/ai/safe-link`.
- Passar `urlTransform={sanitizeAiLinkUrl}` ao `<ReactMarkdown>` (linha 543).
- Adicionalmente, override do componente `a` para que links externos (mesmo os
  permitidos) abram com `rel="noopener noreferrer"`. Como após o Step 1 só
  restam links anhanga.tur.br e relativos, `target`/`rel` é higiene, não
  segurança crítica — mantenha simples:
  ```tsx
  <ReactMarkdown
    urlTransform={sanitizeAiLinkUrl}
    components={{
      a: ({ href, children, ...props }) =>
        href ? (
          <a href={href} rel="noopener noreferrer" {...props}>{children}</a>
        ) : (
          <span>{children}</span>
        ),
    }}
  >
    {msg.text}
  </ReactMarkdown>
  ```
  Quando `urlTransform` devolve `''`, o react-markdown remove o href; o override
  acima renderiza o texto sem link nesse caso.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Testes de regressão

Ver "Test plan". Rode a suíte completa ao final.

**Verify**: `pnpm test:regression` → exit 0.

## Test plan

Novo `tests/ai-markdown-links.test.ts` (`node:test` + `assert/strict`),
testando o helper puro `sanitizeAiLinkUrl`:

- `'/blog'` → `'/blog'` (relativo interno permitido).
- `'#secao'` → `'#secao'` (âncora permitida).
- `'https://www.anhanga.tur.br/consultoria'` → ecoa (subdomínio anhanga.tur.br).
- `'https://anhanga.tur.br/x'` → ecoa (apex permitido).
- `'https://phishing.example/login'` → `''` (domínio externo neutralizado).
- `'http://anhanga.tur.br'` → `''` (http não permitido, mesmo no domínio certo).
- `'javascript:alert(1)'` → `''`.
- `'data:text/html,...'` → `''`.
- `'https://anhanga.tur.br.evil.com'` → `''` (lookalike: hostname não bate nem
  por sufixo `.anhanga.tur.br` nem por igualdade).
- `'not a url'` → `''` (não parseia).

Opcional (se quiser cobertura de render): não é obrigatório um teste Playwright,
pois o helper puro cobre o contrato de segurança. Se adicionar, modele em
`tests/e2e/chatbot-lead-submit.spec.ts`, mas isso é nice-to-have.

## Done criteria

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:regression` exit 0, incluindo os ~10 testes novos
- [ ] `<ReactMarkdown>` em `AIChat.tsx` usa `urlTransform={sanitizeAiLinkUrl}`
- [ ] `git status` mostra apenas arquivos in-scope
- [ ] Linha do plano atualizada em `plans/README.md`

## STOP conditions

- Se a versão instalada de `react-markdown` for < 8 (sem prop `urlTransform`),
  PARE e reporte — a API difere e o plano precisa de ajuste (usar `transformLinkUri`).
- Se o bot legítimo hoje depender de renderizar links para domínios externos
  (ex.: parceiros de viagem, afiliados) — procure no prompt do sistema
  (`lib/ai/prompt.ts`) e nos testes por URLs externas esperadas — PARE e
  reporte: a allowlist precisaria incluí-los antes de bloquear tudo.
- Se os excertos de "Current state" não baterem com o código, PARE (drift).

## Maintenance notes

- Se a agência passar a usar links de afiliados/parceiros no chat, estenda
  `sanitizeAiLinkUrl` com uma allowlist explícita desses domínios — nunca
  reabra para `*`.
- Revisor: confirmar que `urlTransform` retornando `''` realmente neutraliza o
  href na versão instalada (a semântica é estável desde a v8, mas vale um teste
  manual rápido no `pnpm dev` com uma mensagem mockada contendo link externo).
