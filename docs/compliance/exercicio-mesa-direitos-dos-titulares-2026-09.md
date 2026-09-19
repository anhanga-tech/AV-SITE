# Exercício de mesa — direitos dos titulares

**Procedimento exercitado:** [`direitos-dos-titulares.md`](./direitos-dos-titulares.md)
**Protocolo:** issue [#1546](https://github.com/anhanga-tech/AV-SITE/issues/1546)
**Data do exercício documental:** 19/09/2026
**Dados reais usados:** nenhum
**Status:** evidência anonimizada do exercício de mesa; teste ponta a ponta com contas de operadores ainda pendente

Este registro usa somente IDs sintéticos. Não é uma confirmação de que qualquer alteração foi feita no Odoo, Cloudflare, Google, Meta, TikTok, Sentry, Cal.com, GitHub, WhatsApp ou outro operador.

## 1. Participantes e método

- **Facilitador:** papel de dono do caso.
- **Revisor:** papel do Encarregado.
- **Sistemas simulados:** site/formulários, Odoo, Cloudflare, analytics, operadores de conversão, Sentry, R2/GitHub e backups.
- **Método:** leitura guiada do procedimento, preenchimento de protocolo sintético, execução de decisões simuladas e conferência dos critérios de encerramento.
- **Regra de segurança:** nenhum dado pessoal real, credencial, ticket externo ou alteração de produção foi utilizado.
- **Teste ponta a ponta futuro:** usar uma caixa de e-mail controlada ou mail sandbox com envio e recebimento; `example.invalid` não serve para validar código de verificação ou resposta segura.

## 2. Casos simulados

| Caso | Pedido | Fluxo exercitado | Resultado da mesa |
|---|---|---|---|
| `CASE-A` | Acesso e confirmação | Recebimento → verificação por canal já conhecido → busca no CRM e operadores → resposta segura | **Passou**: prazo de 15 dias e entrega por link seguro foram registrados. |
| `CASE-B` | Correção de nome/telefone | Busca no Odoo → alteração na fonte → lista de destinatários compartilhados → segunda conferência | **Passou**: o caso exige propagação e evidência do antes/depois sem copiar o dado no Git. |
| `CASE-C` | Oposição a analytics | Classificação como oposição → consulta de identificadores → tarefa para Zaraz/GA4/Traks → resposta com limite técnico | **Passou com pendência operacional**: a matriz exige confirmação de opt-out persistente nos coletores. |
| `CASE-D` | Revogação de consentimento de marketing | Revogação → bloqueio da finalidade de marketing → separação de outras bases legais → resposta | **Passou**: revogação não foi tratada como eliminação automática de toda a relação comercial. |
| `CASE-E` | Exclusão | Busca em CRM, R2, GitHub, operadores aposentados e backups → eliminação/expiração → retenção justificada → encerramento | **Passou com escalonamento**: histórico público do Git e backups imutáveis exigem decisão do Encarregado. |

## 3. Linha do tempo sintética

| Marco | Valor de teste | Conferência |
|---|---|---|
| Recebimento | `2026-09-19T09:00Z` | Cada caso recebeu ID sem PII. |
| Verificação | `2026-09-19T10:00Z` | Pedidos de maior impacto exigiram verificação reforçada; nenhum documento real foi coletado. |
| Prazo de acesso | `2026-10-04T09:00Z` | 15 dias corridos registrados para `CASE-A`. |
| Acionamento | `2026-09-19T11:00Z` | A matriz foi copiada em tarefas por sistema, sem dados pessoais. |
| Resposta | Simulada | Template seguro, retenções e limitações foram incluídos. |
| Encerramento | Simulado | Segunda conferência e referências de evidência foram exigidas. |

## 4. Achados e ações

| Achado | Ação | Dono | Estado |
|---|---|---|---|
| Oposição depende de mecanismo durável nos coletores Traks/Zaraz | Executar [#1663](https://github.com/anhanga-tech/AV-SITE/issues/1663) e anexar resultado anonimizado ao procedimento | Segurança/infra | Pendente |
| Histórico público de reviews pode impedir exclusão integral | Executar [#1664](https://github.com/anhanga-tech/AV-SITE/issues/1664) e registrar decisão do DPO | Produto/infra | Pendente |
| Retenções e DPAs de vários operadores ainda são `a confirmar` | Concluir [#1667](https://github.com/anhanga-tech/AV-SITE/issues/1667) | Encarregado/gestão | Pendente |
| Registro restrito e alertas de prazo ainda precisam de provisionamento | Criar repositório controlado e rotina de alertas conforme seções 4 e 8 | Gestão/ops | Pendente |

## 5. Evidência anonimizada e conclusão

**Evidência arquivada:** este arquivo e o procedimento relacionado. Ambos contêm somente IDs sintéticos e resultados de mesa.

**Conclusão:** o fluxo documental atende aos cinco cenários e expõe os pontos em que a operação real depende de acesso externo. A issue não deve ser considerada integralmente encerrada com base apenas neste exercício: a aprovação do Encarregado, o provisionamento do registro controlado e os testes ponta a ponta com contas sintéticas continuam necessários.
