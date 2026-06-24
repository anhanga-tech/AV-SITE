<!--
Preencha cada seção com informação real — não deixe placeholders nem texto genérico.
Esta regra vale também para PRs abertos por agentes/LLMs.
Marque [x] apenas o que de fato foi feito; deixe desmarcado o que não se aplica e explique.
Padrões de engenharia: docs/standards/ (code-style, testing, api-conventions, security).
-->

## Resumo

- **O que muda:**
- **Por quê:**
- **Impacto para o usuário:**
- **Nível de risco:** <!-- baixo / médio / alto -->

## Issue relacionada

<!-- Ex.: Closes #123. Se não houver issue, explique o motivo. -->

## Tipo de mudança

- [ ] 🐛 Bug fix
- [ ] ✨ Feature
- [ ] ♻️ Refatoração (sem mudança de comportamento)
- [ ] ⚙️ Infra / CI
- [ ] 📚 Documentação
- [ ] 🔍 SEO / GEO
- [ ] ⚡ Performance

## Testes

<!-- Toda mudança de comportamento exige teste novo/atualizado. Docs-only é exceção. -->

- [ ] Testes automatizados adicionados/atualizados (ou mudança é docs-only)
- [ ] Menor camada de teste correta foi usada (node:test antes de E2E quando possível)

Comandos executados:

```text
<cole aqui os comandos realmente rodados — ex.: pnpm typecheck, pnpm test:regression, pnpm test:e2e>
```

## API & Segurança

<!-- Marque "Não se aplica" se o PR não toca handlers de api/ nem fluxos com input externo. -->

- [ ] Não se aplica
- [ ] Inputs validados/sanitizados na borda, antes de side effects ou chamadas a providers
- [ ] Respostas e códigos de erro permanecem estruturados; helpers compartilhados (`lib/network`, `lib/rate-limit`, `lib/schemas`) reutilizados
- [ ] Sem secrets ou PII bruta em logs
- [ ] `dangerouslySetInnerHTML` não foi introduzido sem fonte controlada e justificativa

## Checklist final

- [ ] Segue os padrões em `docs/standards/`
- [ ] Conventional commit no título (`feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `test:`, `refactor:`)
- [ ] Desvios intencionais de regra registrados abaixo

## Exceções / observações para o revisor

<!-- Regra, motivo, escopo e follow-up de qualquer desvio consciente. -->
