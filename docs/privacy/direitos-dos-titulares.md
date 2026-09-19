# Procedimento operacional para direitos dos titulares

**Controladora:** Anhangá Turismo Ltda. — CNPJ 37.036.732/0001-41
**Encarregado:** Felipe William Rodrigues Silva — privacidade@anhanga.tur.br
**Versão:** 0.1 — pronta para aprovação do Encarregado
**Data:** 19/09/2026
**Issue:** [#1546](https://github.com/anhanga-tech/AV-SITE/issues/1546)
**Canal oficial:** privacidade@anhanga.tur.br
**Política pública:** [/politica-privacidade/](https://www.anhanga.tur.br/politica-privacidade/)

> Este documento é um procedimento interno. Não guardar pedidos, documentos de identidade, exportações ou evidências com dados pessoais neste repositório público. O registro operacional deve ficar em repositório restrito, com acesso apenas às pessoas designadas pelo Encarregado.

## 1. Objetivo e status

Este procedimento transforma o canal público de privacidade em um fluxo comprovável para receber, verificar, pesquisar, decidir, responder e encerrar pedidos de titulares. Ele cobre os direitos do art. 18 da LGPD e o direito relacionado de revisão de decisões unicamente automatizadas do art. 20.

O procedimento está **pronto para aprovação**, mas não se deve marcar a aprovação como concluída sem o registro do Encarregado na seção [12. Aprovação e revisão](#12-aprovação-e-revisão). A execução real em consoles de operadores, contas de e-mail e backups também precisa ser registrada nos casos correspondentes; a matriz abaixo não é prova de que uma busca externa já foi feita.

### 1.1 Direitos cobertos

| Código | Direito | Resultado esperado |
|---|---|---|
| CONF | Confirmação da existência de tratamento | Declaração simplificada imediata ou resposta completa com origem, finalidade e critérios aplicáveis. |
| ACE | Acesso | Cópia ou consulta segura dos dados do titular, sem dados de terceiros ou segredos protegidos. |
| COR | Correção | Atualização nos sistemas controlados e comunicação aos destinatários do compartilhamento quando aplicável. |
| BLO | Anonimização, bloqueio ou eliminação por excesso, desnecessidade ou desconformidade | Medida proporcional, com justificativa e propagação aos destinatários quando aplicável. |
| POR | Portabilidade | Tratamento da requisição conforme regulamentação da ANPD, formato disponível e segredos comercial/industrial. |
| SHA | Informação sobre compartilhamentos | Lista dos destinatários identificados, finalidade e limitações de controle sobre terceiros independentes. |
| REV | Revogação do consentimento | Interrupção da finalidade baseada em consentimento, sem invalidar tratamentos com outra base legal. |
| OPO | Oposição | Avaliação do tratamento sem consentimento e interrupção quando cabível, especialmente para analytics e marketing. |
| DEC | Revisão de decisão automatizada | Encaminhamento ao Encarregado; o site não deve declarar que uma decisão foi automatizada sem evidência. |

**Eliminação** pode aparecer como `BLO` quando o fundamento for excesso/desconformidade e como `REV`/`ACE` quando o pedido se referir a dados tratados com consentimento. Registrar o enquadramento exato no caso.

## 2. Papéis e responsabilidades

| Papel | Responsabilidades mínimas |
|---|---|
| Encarregado | Aprovar este procedimento; decidir casos controversos, exceções, pedidos de representante, portabilidade e oposição complexa; revisar amostra mensal; aprovar retenções e encerramentos pendentes. |
| Dono do caso | Criar o protocolo, classificar o pedido, controlar prazo, coordenar as buscas, consolidar evidências e preparar a resposta. Não pode aprovar sozinho uma exceção que impeça o atendimento. |
| Responsável pelo sistema | Executar busca/exportação/alteração/eliminação no sistema designado; devolver resultado, escopo, data, operador que executou e evidência mínima. Nunca enviar uma base inteira por e-mail. |
| Atendimento | Encaminhar mensagens recebidas em WhatsApp, telefone, redes sociais ou formulário ao canal oficial sem pedir dados adicionais no canal informal. Não confirmar existência de cadastro. |
| Segurança/infraestrutura | Apoiar logs, R2, backups, controles de acesso, Sentry, Cloudflare e evidências de eliminação; preservar evidências de incidente sem ampliar a cópia de dados. |
| Jurídico/gestão, quando acionado | Apoiar retenção legal, segredo comercial, exercício regular de direitos, ordem judicial, dados de terceiros e conflito com contrato. |

### 2.1 Regra de separação de funções

Quem executou a alteração ou eliminação deve ser diferente, sempre que viável, de quem encerra o caso. Em operações pequenas, o Encarregado faz a revisão posterior e registra a justificativa da exceção.

## 3. Protocolo de ponta a ponta

Cada pedido recebe um identificador no formato `DT-AAAA-NNNN` (por exemplo, `DT-2026-0001`). O identificador não deve conter nome, e-mail, telefone, CPF, endereço ou qualquer outro dado do titular.

### Etapa 0 — Receber e preservar

1. Monitorar `privacidade@anhanga.tur.br` em dias úteis.
2. Criar o protocolo no registro restrito no mesmo dia, copiando somente o mínimo necessário.
3. Guardar a mensagem original no repositório restrito; não replicar seu conteúdo em comentários, GitHub, Slack ou planilhas públicas.
4. Se o pedido chegar por outro canal, responder apenas com o canal oficial e encaminhar a mensagem sem discutir o cadastro.
5. Se houver indício de incidente, fraude ou exposição de dados, marcar `INCIDENTE-POTENCIAL`, preservar a evidência e envolver Segurança e o Encarregado imediatamente. Não esperar o prazo do pedido para tratar o incidente.

### Etapa 1 — Classificar

Registrar um ou mais códigos da tabela de direitos. Se o texto for ambíguo, pedir esclarecimento sem exigir uma formulação jurídica. Identificar também:

- identificadores fornecidos pelo titular (e-mail, telefone, nome, ID de atendimento, URL de review ou outro identificador);
- categorias de dados possivelmente envolvidas;
- sistemas e operadores potencialmente envolvidos;
- se há dados de criança/adolescente, dados sensíveis, representante legal, terceiro ou pedido coletivo;
- se o pedido é de confirmação/acesso, que possui o prazo legal específico do art. 19.

### Etapa 2 — Verificar identidade de forma proporcional

O objetivo é evitar entregar ou apagar dados da pessoa errada sem coletar uma nova quantidade excessiva de dados.

| Risco do pedido | Verificação padrão | Salvaguarda |
|---|---|---|
| Nenhum registro localizado ou pedido informativo sem acesso a dados | Responder pelo canal fornecido, sem confirmar mais do que o necessário. | Não revelar se existe cadastro quando isso puder expor dados de outra pessoa. |
| Confirmação, correção ou oposição de baixo impacto | Confirmar posse do canal já associado ao registro, preferencialmente com código de uso único ou resposta ao mesmo endereço. | Não aceitar apenas um nome informado no corpo do e-mail. |
| Acesso, portabilidade, eliminação ou revogação com alteração relevante | Código de uso único para canal já cadastrado e conferência de dois atributos não sensíveis já conhecidos; escalar divergência ao Encarregado. | Não pedir senha, cartão completo, biometria ou documento integral por e-mail. |
| Ausência de canal confiável, alto risco ou representante | O Encarregado define verificação adicional e o meio seguro. Para representante, exigir prova de poderes limitada ao necessário. | Se documento for indispensável, pedir versão com campos desnecessários ocultados, restringir acesso e apagar a cópia após a decisão documentada. |

Se a verificação falhar, usar o [template de verificação](#9-2-template-de-verificação) e não confirmar a existência, ausência ou conteúdo de dados além do indispensável para explicar o próximo passo.

### Etapa 3 — Pesquisar

1. Pesquisar primeiro os sistemas próprios e depois os operadores, usando todas as variantes de identificador disponíveis.
2. Pesquisar dados ativos, registros temporários, mídia, exports, filas, logs e integrações — não apenas o CRM.
3. Abrir uma tarefa para cada operador que possa ter recebido o dado; registrar `não aplicável`, `não localizado`, `localizado`, `aguardando operador` ou `impossível` com motivo.
4. Verificar backups conforme a seção [7. Backups e retenções](#7-backups-e-retenções). Não restaurar uma cópia de produção em ambiente aberto apenas para procurar um titular.
5. Para dados publicados por terceiros, distinguir: (a) dado sob controle da Anhangá; (b) cópia pública publicada pela Anhangá; (c) registro do terceiro independente. Não prometer exclusão que a Anhangá não controla.

### Etapa 4 — Decidir e executar

O dono do caso consolida o resultado e o Encarregado revisa quando houver:

- negativa total ou parcial;
- retenção por obrigação legal, exercício regular de direitos ou outra hipótese do art. 16;
- dado de terceiro, criança/adolescente ou dado sensível;
- portabilidade;
- pedido de oposição a tratamento baseado em legítimo interesse;
- impossibilidade técnica de eliminar histórico, backup, log ou registro público;
- divergência entre titular, operador ou sistema.

Ao corrigir, anonimizar, bloquear ou eliminar dados que tenham sido compartilhados, informar imediatamente os agentes de tratamento destinatários, salvo impossibilidade comprovada ou esforço desproporcional (art. 18, § 6º). Registrar destinatário, data, conteúdo mínimo da comunicação e resultado.

### Etapa 5 — Responder com segurança

- Enviar a resposta somente depois da verificação aprovada.
- Usar link autenticado ou arquivo criptografado com expiração; enviar a senha por canal separado. Quando o titular pedir papel, combinar entrega e identificação de forma segura.
- Nunca incluir no e-mail dados de outro titular, lista de clientes, tokens, credenciais, segredos comerciais ou conteúdo integral de logs sem necessidade.
- Explicar o que foi encontrado, o que foi feito, o que não foi feito, a base da retenção e os próximos passos.
- Se um operador ainda estiver pendente, informar essa pendência e a data de acompanhamento; não encerrar o caso como concluído.

### Etapa 6 — Encerrar e monitorar

1. Registrar entrega, falha de entrega, destinatários notificados, evidências e aprovação.
2. Confirmar que as tarefas do caso estão fechadas ou justificadamente pendentes.
3. Fazer segunda conferência para correção, bloqueio, revogação ou eliminação.
4. Encerrar o protocolo e preservar a trilha no repositório restrito.
5. Revisar mensalmente prazos vencidos, pedidos reabertos, negativas, falhas de verificação e solicitações a operadores ainda pendentes.

## 4. Prazos e controle de prazo

Os prazos abaixo são a regra operacional até revisão do Encarregado ou nova regulamentação da ANPD. Não se deve apresentar o prazo interno como se fosse um novo prazo legal.

| Marco | Prazo operacional | Ação e evidência |
|---|---:|---|
| Registro e protocolo | Mesmo dia útil | `received_at`, `case_id`, canal e classificação. |
| Pedido de esclarecimento/verificação | Até 2 dias úteis | Template enviado e data de retorno controlada. |
| Acionamento dos sistemas/operadores | Até 2 dias úteis após verificação suficiente | Uma tarefa por sistema, com responsável e vencimento. |
| Confirmação/acesso em formato simplificado | Imediato, quando possível | Registrar a resposta e o meio seguro. |
| Confirmação/acesso em declaração completa | Até 15 dias corridos contados do requerimento | `due_at` = data do requerimento + 15 dias; resposta completa ou justificativa. |
| Demais direitos | Atendimento imediato quando possível; alvo interno de até 15 dias corridos | Se não for possível, responder com a razão e o plano; não aguardar em silêncio. |
| Cobrança de operador sem retorno | 2 dias úteis antes do vencimento do caso | Escalar ao Encarregado e ao responsável pelo fornecedor. |
| Encerramento | Até 2 dias úteis após a resposta | Segunda conferência, protocolo de entrega e aprovação. |

O registro deve calcular e exibir pelo menos `received_at`, `verified_at`, `due_at`, `responded_at`, `closed_at`, `status` e `owner`. A fila deve ter alerta em `due_at - 5 dias corridos`, `due_at - 2 dias corridos` e no vencimento.

Se o pedido chegar incompleto, registrar a data original, a lacuna e a data da solicitação de esclarecimento. A comunicação não pode ser usada para reiniciar artificialmente o prazo; o Encarregado decide como tratar o impacto da informação faltante.

## 5. Matriz sistema × ação

Legenda: **S** = executar/consultar; **C** = condicional, depende de escopo, base legal ou capacidade do fornecedor; **I** = informar/encaminhar, sem controle direto; **N** = não se aplica ao fluxo conhecido; **P** = pendência que precisa de confirmação externa. Cada célula deve gerar tarefa ou justificativa no caso.

| Sistema, operador ou repositório | CONF/ACE | COR | BLO/eliminação | POR | SHA | OPO | REV | Evidência mínima |
|---|---|---|---|---|---|---|---|---|
| Site, Pages/Functions e formulários | S | S | C | C | S | S | S | Consulta por identificadores, resultado de cada endpoint e confirmação de filas/logs. |
| Odoo CRM (`res.partner`/`crm.lead`) | S | S | S/C | C | S | S | S | IDs de parceiro/lead, campos tratados, alteração/eliminação e data. Reter só exceções justificadas. |
| Cloudflare Pages, Functions, R2 e logs | S | C | S/C | N | S | C | N | Busca em logs/R2; para fotos de reviews, registrar objeto e resultado. Região/retenção conforme evidência disponível. |
| Cloudflare Zaraz, Web Analytics e Traks | C | N | C | N | S | S | C | Consulta/solicitação no painel; registrar ausência de identificador, opt-out e operador acionado. |
| Google GA4/Ads e identificadores (`client_id`, `anhanga_ga_cid`) | C | N | C | N | S | S | C | Solicitação e resposta do painel/fornecedor; separar o cookie próprio do identificador do Zaraz. |
| Google Gemini / AI Gateway | C | N | C | N | S | C | N | Verificar se prompt/resposta foram persistidos; não presumir retenção quando o gateway estiver sem log de payload. |
| Meta CAPI / TikTok Events API | C | N | C | N | S | S | C | Identificar eventos enviados e ticket de exclusão/opt-out, inclusive fluxo Odoo → conversão se estiver ativo. |
| Upstash Redis | C | N | S por TTL/C | N | S | C | N | Chaves derivadas, TTL, exclusão da chave e justificativa de hashes que não permitem correção. |
| Sentry | C | N | C | N | S | C | N | Busca por evento/atributo, solicitação de remoção e retenção da organização; não copiar stack trace para o caso. |
| Cal.com | S | C | C | C | S | S | C | Booking, notas e metadados de atribuição; confirmação do mecanismo do fornecedor. |
| WhatsApp/Meta e handoff | I/C | C | C | N | S | S | S/C | Identificar campos encaminhados e orientar ação na conta; registrar limite de controle sobre mensagens já recebidas. |
| GitHub e histórico público de reviews | S | C | C/P | N | S | C | N | Review/commit/artefato e limitação de remoção do histórico; escalar decisão ao Encarregado. |
| Outscraper | C | N | C | N | S | C | N | Solicitação ao fornecedor e confirmação da retenção da coleta. |
| OpenStreetMap, Iconify, Spotify e unpkg | I | N | I | N | S | C | N | Registrar que são destinatários independentes e indicar mitigação; não prometer ação em conta da Anhangá. |
| Stape, GTM, Mautic, Salesforce, HubSpot e n8n aposentados | C/P | N | P | N | S | C | C | Acionar somente para localizar histórico e confirmar exclusão/retention após cut-over. |
| Backups, exports e cópias manuais | S | C | C | N | S | C | C | Inventário de cópia, data, dono, imutabilidade, prazo de expiração e plano de eliminação. |

### 5.1 Dados usados na busca

Usar apenas os identificadores necessários e normalizar antes da consulta:

- e-mail e telefone (formatos usados nos formulários e no Odoo);
- nome e sobrenome, destino, ID de lead/parceiro, ID de atendimento e `event_id`;
- `anhanga_ga_cid`, `client_id`, UTMs/click IDs e outros identificadores de atribuição, quando o titular os fornecer ou quando forem encontrados no CRM;
- JTI do convite NPS, ID do review, URL da foto no R2, hash/lock do Upstash e identificadores de ticket do operador;
- datas aproximadas, origem do canal e página/formulário usados, quando necessários para reduzir falso positivo.

Não fazer busca ampla por nome em sistemas de terceiros sem definir o escopo e a autorização do Encarregado.

## 6. Checklist de busca, propagação e retenção

Copiar esta lista para cada caso e marcar `feito`, `não localizado`, `não aplicável`, `aguardando` ou `não possível — motivo`.

### 6.1 Sistemas próprios

- [ ] E-mail/caixa de privacidade e anexos do pedido.
- [ ] Formulários de lead, contato, quiz, corporativo, waitlist, NPS e chatbot.
- [ ] Odoo: parceiro, lead, notas, BANT, consentimento, NPS, UTMs e `x_ga_client_id`.
- [ ] Cloudflare Pages/Functions: dados transitórios, filas, logs de acesso e logs de erro.
- [ ] R2: mídia, especialmente fotos de reviews e objetos derivados.
- [ ] Cookies/identificadores first-party, apenas quando o pedido fornecer o identificador ou houver vínculo documentado.
- [ ] GitHub: arquivo atual, artefatos de workflow e histórico público quando o pedido envolver review publicado.
- [ ] Exports, planilhas, downloads locais, caixas compartilhadas e cópias manuais autorizadas.

### 6.2 Operadores ativos

- [ ] Cloudflare (Pages, Functions, R2, Zaraz, Web Analytics, AI Gateway e Traks).
- [ ] Odoo.
- [ ] Google (Gemini, GA4, Ads quando aplicável e Fonts quando o pedido envolver o destinatário independente).
- [ ] Meta/WhatsApp e TikTok.
- [ ] Upstash, Sentry e Cal.com.
- [ ] GitHub e Outscraper.
- [ ] Conteúdo de terceiros: OpenStreetMap, Iconify, Spotify e unpkg, apenas para informação/limite de controle.

### 6.3 Operadores aposentados e backups

- [ ] Stape e Google Tag Manager.
- [ ] Mautic.
- [ ] Salesforce e HubSpot.
- [ ] n8n, se houver histórico fora do webhook atual.
- [ ] Backups do site, CRM, R2, operadores e caixas de e-mail.
- [ ] Cópias imutáveis: registrar a data de expiração e a eliminação no ciclo normal; não restaurar nem manter uma cópia extra para atender ao pedido.

### 6.4 Retenções justificadas

| Categoria | Referência atual | Tratamento do pedido |
|---|---|---|
| Dados de contato/relacionamento no CRM | 5 anos após a última interação, conforme política pública | Eliminar quando não houver exceção; registrar obrigação, processo ou outra hipótese que justifique conservar. |
| Analytics GA4 | Até 14 meses | Solicitar remoção/limitação no fornecedor quando identificável; registrar o que não é tecnicamente vinculável. |
| `anhanga_ga_cid` | Até 2 anos | Remover cookie sob controle próprio e vínculo no CRM; tratar separadamente o `client_id` do Zaraz. |
| Rate limit/segurança | Até 10 minutos | Normalmente expira; preservar apenas evidência de incidente autorizada pelo Encarregado. |
| Convite NPS | Até 30 dias | Confirmar TTL; não confundir JTI com dados cadastrais. |
| Cookie de campanha | Até 30 dias | Remover sob controle próprio quando aplicável. |
| Sentry, Cal.com, Traks, Web Analytics, backups e outros | Prazo ainda `a confirmar` na matriz de operadores | Não inventar prazo; pedir confirmação ao fornecedor e registrar a pendência. |
| Registro do próprio pedido | Proposta: 5 anos após encerramento, com acesso restrito, ou prazo legal/ordem de preservação maior | Aprovação do Encarregado pendente; anonimizar relatórios e exercícios antes de publicar. |

Uma retenção não é uma resposta suficiente por si só. A resposta deve dizer a categoria retida, a finalidade/base que sustenta a retenção, o sistema, o prazo ou evento de término e como o restante foi tratado.

## 7. Backups e retenções

1. O responsável pelo sistema mantém o inventário de backups e exportações em local restrito, separado do registro de pedidos.
2. Para uma exclusão, corrigir primeiro a fonte ativa e registrar o tratamento das cópias.
3. Se o backup for editável, executar a mesma ação com validação independente.
4. Se for imutável, não restaurar em produção; registrar `aguarda expiração`, a data de expiração e os controles que impedem o uso operacional da cópia.
5. Se uma restauração ocorrer por desastre antes da expiração, reabrir os pedidos afetados e reaplicar as ações antes de liberar o ambiente.
6. Não criar um novo export para “provar” uma exclusão sem autorização do Encarregado; a prova deve registrar metadados mínimos, não uma nova cópia de dados.

## 8. Registro e trilha de auditoria

O registro operacional restrito deve ter estes campos. Valores pessoais ficam no sistema protegido; os relatórios de gestão usam apenas `case_id`, datas, códigos e status.

| Campo | Obrigatório | Regra |
|---|---:|---|
| `case_id` | Sim | `DT-AAAA-NNNN`, imutável. |
| `received_at` / canal | Sim | Data/hora e origem; guardar a mensagem original em local restrito. |
| `rights` / escopo | Sim | Códigos `CONF`, `ACE`, `COR`, `BLO`, `POR`, `SHA`, `OPO`, `REV`, `DEC`. |
| `identity_status` / método | Sim | Pendente, aprovado ou recusado; método proporcional, sem guardar documento integral. |
| `owner` / revisor | Sim | Responsável pelo caso e quem revisou a decisão. |
| `due_at` / alertas | Sim | Prazo legal ou alvo interno, com histórico de alertas. |
| `systems_checked` | Sim | Cada sistema/operador da matriz e resultado. |
| `actions` / `operator_tickets` | Sim | Alteração, exclusão, opt-out, ticket, executor e horário. |
| `retention_decision` | Condicional | Categoria retida, motivo, base/obrigação, prazo/evento e aprovador. |
| `shared_recipients_notified` | Condicional | Destinatário, data, medida, resultado e motivo se impossível/desproporcional. |
| `response_sent_at` / meio seguro | Sim | Entrega, expiração do link e falha/reenvio. |
| `closure_reason` / `closed_at` | Sim | Concluído, parcialmente atendido, não localizado, recusado com fundamento ou pendente escalado. |
| `evidence_refs` | Sim | Caminhos/tickets sem anexar dados no repositório público. |

### 8.1 Integridade da trilha

- O registro deve ser append-only para eventos: correções geram novo evento, não apagam o histórico.
- Acesso por menor privilégio; revisão mensal de acessos pelo Encarregado ou delegado.
- Não colocar nomes, e-mails, telefones, tokens, documentos ou exportações no GitHub, no título de issue ou em logs de aplicação.
- Para relatórios e exercícios, substituir identificadores por `CASE-A`, `CASE-B` e datas deslocadas quando necessário.
- A eliminação da cópia de trabalho deve gerar evento de eliminação, sem eliminar o registro mínimo necessário para demonstrar o atendimento.

## 9. Templates

### 9.1 Template de recebimento

**Assunto:** Protocolo `DT-AAAA-NNNN` — recebimento da sua solicitação

Olá, [nome, se já confirmado].

Recebemos sua solicitação em [data] e registramos o protocolo `DT-AAAA-NNNN`. Entendemos que você solicitou: [direito(s) em linguagem simples].

Para proteger seus dados, ainda precisamos [confirmar sua identidade / esclarecer o escopo / nenhuma ação adicional]. Enviaremos as instruções mínimas pelo canal seguro. Não envie senha, cartão completo, biometria ou documento integral por e-mail.

O canal oficial para acompanhamento é `privacidade@anhanga.tur.br`. Pedidos de confirmação e acesso terão resposta imediata em formato simplificado quando possível ou em declaração completa em até 15 dias corridos contados do requerimento. Para os demais pedidos, adotaremos providência imediata quando possível e informaremos qualquer impedimento ou pendência.

Atenciosamente,
[responsável pelo caso]
Encarregado — Anhangá Turismo

### 9.2 Template de verificação

**Assunto:** Protocolo `DT-AAAA-NNNN` — confirmação necessária

Para evitar que os dados sejam enviados ou alterados para a pessoa errada, precisamos concluir uma verificação proporcional ao seu pedido. Use [código/link de uso único], válido até [data/hora], ou responda pelo canal já associado ao atendimento conforme as instruções seguras.

Não envie senha, cartão completo, biometria ou documento integral. Se a verificação não for possível, informe isso; o Encarregado avaliará um meio alternativo e proporcional.

### 9.3 Template de resposta

**Assunto:** Protocolo `DT-AAAA-NNNN` — resultado da solicitação

Olá, [nome].

Sobre o pedido de [direito], concluímos:

- **Resultado:** [atendido / parcialmente atendido / não localizado / não atendido com justificativa].
- **Sistemas consultados:** [lista ou referência segura].
- **Dados e finalidades encontradas:** [descrição mínima, sem dados de terceiros].
- **Medidas executadas:** [correção, eliminação, bloqueio, oposição, revogação, informação ou nenhuma].
- **Destinatários notificados:** [lista, quando aplicável], em [data].
- **Retenção:** [não há / categoria, finalidade, base ou obrigação, prazo/evento de término].
- **Limitações:** [operador pendente, backup imutável, terceiro independente, histórico público ou outra razão].

Quando houver dados para acesso, eles estão disponíveis em [link seguro], que expira em [data/hora]. A senha, se necessária, foi encaminhada por canal separado.

Para dúvidas, responda a este e-mail citando `DT-AAAA-NNNN`.

Atenciosamente,
[responsável/revisor]

### 9.4 Template de encerramento interno

**Protocolo:** `DT-AAAA-NNNN`
**Resultado:** [concluído / parcial / não localizado / recusado fundamentadamente]
**Direitos:** [códigos]
**Identidade:** [método e data, sem documento integral]
**Sistemas e operadores:** [status de cada tarefa]
**Retenções:** [categoria, razão, prazo/evento]
**Compartilhamentos comunicados:** [destinatário/data/resultado]
**Resposta:** [data, meio seguro, entrega/falha]
**Segunda conferência:** [nome do revisor e data]
**Evidências:** [referências restritas]
**Aprovação do Encarregado:** [nome/data ou “não exigida por regra aprovada”]
**Encerrado em:** [data]

## 10. Exercício de mesa e teste ponta a ponta

O exercício anonimizado e sem efeitos em produção está arquivado em [`exercicio-mesa-direitos-dos-titulares-2026-09.md`](./exercicio-mesa-direitos-dos-titulares-2026-09.md). Ele percorre cinco cenários: acesso, correção, oposição, revogação e exclusão.

O exercício de mesa valida o protocolo, a matriz, os templates e o controle de prazo. Ele **não substitui** a execução ponta a ponta com contas de teste dos operadores. Os testes externos devem usar titular sintético, endereço `example.invalid` ou sandbox equivalente e nenhuma pessoa real.

### 10.1 Critérios de aprovação do teste externo

- [ ] O pedido chega ao canal oficial e gera protocolo no mesmo dia.
- [ ] A verificação proporcional impede resposta a pessoa não autorizada.
- [ ] A busca encontra ou declara não localizado em todos os sistemas aplicáveis.
- [ ] O prazo aparece no registro e dispara os alertas configurados.
- [ ] A correção no Odoo é propagada aos destinatários aplicáveis.
- [ ] Oposição e revogação interrompem a finalidade correspondente sem apagar tratamento sustentado por outra base legal.
- [ ] A exclusão remove dados ativos e registra o tratamento de logs, R2, Git, backups e operadores.
- [ ] A resposta é entregue por meio seguro e não contém dados de terceiros.
- [ ] O encerramento tem segunda conferência e trilha append-only.

## 11. Critérios de aceite e pendências externas

| Critério da issue | Evidência neste PR | Estado |
|---|---|---|
| Procedimento aprovado pelo Encarregado | Seção 12, aguardando registro da aprovação | Pendente externo |
| Templates de recebimento, verificação, resposta e encerramento | Seção 9 | Pronto |
| Matriz sistema × ação | Seção 5 | Pronto; confirmar fornecedores na execução |
| Controle de prazo e trilha de auditoria | Seções 4 e 8 | Pronto como processo; ferramenta/repositório restrito precisa ser provisionado |
| Testes de acesso, correção, oposição, revogação e exclusão | Exercício anonimizado na seção 10 e arquivo relacionado | Mesa pronta; ponta a ponta externo pendente |
| Evidência anonimizada do exercício arquivada | `exercicio-mesa-direitos-dos-titulares-2026-09.md` | Pronto |

Pendências que não podem ser concluídas apenas no repositório: aprovação formal do DPO; provisionamento do registro restrito e alertas; acesso a consoles/contratos dos operadores; confirmação das retenções pendentes da matriz de transferências; execução do teste com contas sintéticas; e arquivo das respostas reais dos operadores sem dados pessoais no Git.

## 12. Aprovação e revisão

| Campo | Registro |
|---|---|
| Aprovador (Encarregado) | _A preencher_ |
| Data da aprovação | _A preencher_ |
| Versão aprovada | _A preencher_ |
| Observações/condições | _A preencher_ |
| Próxima revisão | 90 dias após aprovação ou imediatamente após mudança de operador, canal, prazo ou regulamentação da ANPD |

## Referências normativas e internas

- [LGPD — Lei nº 13.709/2018, texto compilado no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), especialmente arts. 18, 19, 20 e 46.
- [ANPD — Perguntas frequentes, item 5.9 sobre prazo de atendimento](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes).
- [ANPD — Titular de dados e petição/denúncia](https://www.gov.br/anpd/pt-br/canais_atendimento/cidadao-titular-de-dados/denuncia-peticao-de-titular-referente-lgpd).
- [`docs/compliance/transferencias-internacionais.md`](../compliance/transferencias-internacionais.md) — matriz técnica de operadores, transferências e fornecedores aposentados.
- [`components/privacy/PrivacySection8DireitosTitulares.tsx`](../../components/privacy/PrivacySection8DireitosTitulares.tsx) — direitos e canal atualmente publicados.
- [`docs/compliance/ripd-legitimo-interesse.md`](../compliance/ripd-legitimo-interesse.md) — bases, retenções e salvaguardas documentadas.
