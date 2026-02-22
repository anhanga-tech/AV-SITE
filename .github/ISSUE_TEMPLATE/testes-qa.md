---
name: Testes / QA
about: Criar ou ajustar testes, casos de regressão e checks de CI
title: "[TEST] "
labels: tests
assignees: ''
---

## Objetivo
<!-- Que cobertura de teste/validação está faltando? -->

## Contexto
<!-- Bug/feature que motivou isso. Linke issue/PR se existir. -->

## Criterios de Aceitacao
- [ ] Teste(s) novo(s) cobrindo o cenário
- [ ] Testes passam no CI/local
- [ ] (Opcional) Caso de regressão documentado

## Cenarios a cobrir
- [ ] Caminho feliz (happy path)
- [ ] Erros/edge cases
- [ ] Regressão específica: ___

## Onde adicionar
- **Unit:**
- **Integration:**
- **E2E (se existir):**

## Como rodar
<!-- Preencha com comandos reais do repo -->
- `npm test` / `npm run test` / `npm run test:regression`

## Evidencias
<!-- Logs, prints do CI, links de runs -->

---
> **Para o Codex:** Priorize testes determinísticos (sem flakiness). Evite mocks excessivos e prefira validar comportamento.
