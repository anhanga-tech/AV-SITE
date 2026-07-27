# Remoção da automação social descontinuada

## Contexto

A divulgação de novos posts do blog passou a ser feita manualmente pelo
Postiz. O workflow do GitHub Actions que notificaria um webhook n8n nunca teve
o fluxo receptor implementado e, portanto, seus módulos, testes e runbook são
código morto.

## Escopo

Remover, na mesma mudança:

- `.github/workflows/notify-social-automation.yml`;
- `scripts/notify-blog-published.ts`;
- `lib/social-announcement.ts`;
- `docs/ops/social-automation.md`;
- `tests/notify-blog-published.test.ts`;
- `tests/social-announcement.test.ts`;
- `tests/notify-social-automation-workflow.test.ts`.

Atualizar `docs/ops/deploy.md` para não afirmar que `N8N_WEBHOOK_SECRET`
também atende ao anúncio social do blog. O uso ativo em `purchase-dispatch`
permanece documentado e não será alterado.

## Comportamento e limites

Não haverá automação substituta nem mudança no fluxo de publicação do blog.
A divulgação continuará manual no Postiz. Outros usos de n8n, especialmente
`purchase-dispatch`, ficam fora do escopo.

## Verificação

Antes da remoção, uma checagem de aceitação deve falhar ao encontrar os sete
artefatos e a referência obsoleta. Depois da remoção, a mesma checagem deve
confirmar que nenhum deles permanece. A suíte de regressão, o typecheck e o
build devem continuar passando.
