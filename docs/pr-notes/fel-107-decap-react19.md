# FEL-107 — Validação do Decap CMS com React 19

## Summary

- Change: validação do Decap CMS em React 19 com fallback para CDN puro, rota `/admin` funcional em `vite dev`, smoke test automatizado e proxy local para testes manuais.
- User-facing impact: o painel `/admin` carrega localmente sem erro crítico de runtime de React 19 quando servido via CDN.
- Risk level: médio, porque o backend local (`local_fs`) não suporta `editorial_workflow` e ainda existe um follow-up para serialização de datas no manifesto do blog.

## Decision

- `decap-cms-app` via pacote npm foi descartado para esta etapa.
- `decap-cms` via CDN foi aprovado como fallback.

### Motivos

- A instalação do pacote npm trouxe vários warnings de peer dependency em dependências legadas da árvore do Decap.
- Durante os testes com bundle local houve warnings/runtime instáveis no console, inclusive avisos de prop validation em componentes internos e comportamento inconsistente no carregamento do painel.
- O carregamento via CDN (`https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js`) abriu o painel normalmente e não apresentou erro crítico de runtime associado ao React 19 durante os testes locais.

## Standards Reviewed

- [x] `docs/standards/code-style.md`
- [x] `docs/standards/testing.md`
- [x] `docs/standards/api-conventions.md`
- [x] `docs/standards/security.md`

## Validation Result

- `/admin` carregou localmente em `vite dev` e em `vite preview`.
- Fluxo de login com `local_backend: true` funcionou com `decap-server`.
- Criação de post funcionou sem crash:
  - preenchimento dos campos obrigatórios
  - upload e seleção de imagem
  - persistência do arquivo em `content/blog/`
- Edição de post existente funcionou sem crash:
  - atualização de resumo
  - atualização do conteúdo
  - persistência do arquivo editado em disco
- Não foram observados erros críticos de runtime relacionados ao React 19 no fluxo com CDN.

## Testing

- [x] Automated tests were added or updated for behavior changes.
- [x] The smallest correct test layer was used.
- [x] Relevant commands were run and recorded.

Verification run:

```text
pnpm typecheck
pnpm build
pnpm playwright test tests/e2e/decap-admin.spec.ts --project=chromium
```

Actual commands run:

```text
pnpm add -D decap-server@3.7.0
pnpm typecheck
pnpm build
pnpm playwright test tests/e2e/decap-admin.spec.ts --project=chromium
pnpm cms:proxy
pnpm preview
```

Manual validation:

```text
1. Abrir /admin
2. Fazer login pelo proxy local
3. Criar post de teste com imagem
4. Publicar o post
5. Reabrir o post salvo
6. Editar resumo e conteúdo
7. Confirmar persistência no filesystem
8. Remover artefatos de teste criados durante a validação
```

## Code Style

- [x] New or touched files follow the local naming and module-boundary rules.
- [x] Shared helpers were reused instead of duplicated.
- [x] Comments explain intent or constraints, not obvious code.
- [x] New complexity was isolated instead of pushed into unrelated files.

## API Conventions

- [x] Not applicable
- [ ] Inputs are validated before side effects.
- [ ] Response shapes and error codes stay structured.
- [ ] Shared CORS, rate-limit, or request-ID helpers were reused.
- [ ] Provider calls stay behind clear boundaries.

## Security

- [x] Inputs are sanitized or normalized at the boundary.
- [x] Secrets and raw PII are not logged.
- [x] Security-sensitive behavior has regression coverage.
- [x] `dangerouslySetInnerHTML` was not introduced without a controlled source and explicit justification.

## Findings / Follow-up

- O backend local do Decap registra no console:

```text
'editorial_workflow' is not supported by 'local_fs' backend, switching to 'simple'
```

- Isso significa que o fluxo de rascunho (`draft`) não pode ser validado integralmente no ambiente local com `decap-server`. O CRUD básico foi validado, mas o estado de rascunho precisa ser rechecado com o backend GitHub + OAuth.
- Durante a validação, um post salvo pelo Decap serializou `date` como YAML date e fez `pnpm generate:blog-manifest` falhar porque `lib/blog-manifest.ts` assume `string` e chama `localeCompare`. O artefato de teste foi removido para manter a branch estável, mas este ponto deve virar follow-up antes de produção do CMS.

## Exceptions

- Rule: validar `editorial_workflow` completo localmente.
- Reason: o backend `local_fs` do `decap-server` faz downgrade automático para `simple`.
- Scope: ambiente local de validação.
- Follow-up: revalidar criação de rascunho após FEL-108/CMS-3 com backend GitHub real.

- Rule: evitar código third-party vendorizado.
- Reason: foi necessário manter um shim local de `compute-scroll-into-view` para estabilizar o build do projeto durante a avaliação do Decap e preservar o comportamento atual do Keystatic no Vite/Rollup.
- Scope: `src/vendor/compute-scroll-into-view.ts` e alias em `vite.config.ts`.
- Follow-up: remover o shim quando a incompatibilidade de export na árvore atual de dependências deixar de ser necessária.
