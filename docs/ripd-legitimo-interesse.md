# Relatório de Impacto à Proteção de Dados Pessoais (RIPD)
**Base legal:** Legítimo Interesse — Art. 7º, IX da Lei nº 13.709/2018 (LGPD)

---

| Campo | Informação |
|---|---|
| **Controlador** | Anhangá Turismo Ltda. — CNPJ 37.036.732/0001-41 |
| **Endereço** | Av. Dom Pedro I, 773, Vila Monumento, São Paulo-SP, CEP 01552-001 |
| **Encarregado (DPO)** | Felipe William Rodrigues Silva |
| **E-mail DPO** | privacidade@anhanga.tur.br |
| **Versão** | 1.1 |
| **Data de elaboração** | 02/06/2026 |
| **Próxima revisão** | 02/06/2027 |
| **Status** | Rascunho — pendente de revisão jurídica e aprovação do DPO |

---

## 1. Finalidade e escopo

Este relatório documenta a avaliação de impacto sobre as atividades de tratamento de dados pessoais realizadas pela **Anhangá Turismo Ltda.** com fundamento em **legítimo interesse** (Art. 7º, IX da LGPD), conforme exigido pelo Art. 38 da mesma Lei e pelas orientações da Autoridade Nacional de Proteção de Dados (ANPD).

O relatório cobre **três atividades de tratamento** identificadas:

1. Análise comportamental agregada via Google Analytics 4 (GA4)
2. Atribuição UTM e click IDs para mensuração de campanhas de tráfego pago
3. Armazenamento de histórico de qualificação BANT no CRM para atendimento ao cliente

**Decisão arquitetural relevante (v1.1):** A Anhangá Turismo adotou o **Stape.io** como plataforma de server-side tagging (sGTM gerenciado, servidores EU). Todo o rastreamento de analytics e conversões passa pelo container server-side antes de chegar às plataformas de terceiros (Google, Meta). Essa decisão fortalece materialmente o balancing test das Atividades 1 e 2, pois os dados são anonimizados e filtrados antes de qualquer repasse externo.

Atividades baseadas em **consentimento** (Art. 7º, I) — como cookies de publicidade cross-site, remarketing avançado, Mautic e HubSpot tracking passivo — são geridas pelo mecanismo de consentimento de cookies e **não estão no escopo deste RIPD**.

---

## 2. Atividade 1 — Análise comportamental via GA4

### 2.1 Descrição do tratamento

| Campo | Detalhe |
|---|---|
| **Dados tratados** | Pageviews, eventos de clique, tempo de sessão, scroll depth, origem do tráfego, tipo de dispositivo/navegador; GA4 Client ID anonimizado |
| **Titulares** | Visitantes do site `www.anhanga.tur.br` |
| **Operadores** | Stape OÜ (server-side tagging, EU) → Google LLC (Google Analytics 4, EUA) |
| **Arquitetura** | Browser → sGTM Stape (EU) com IP stripping e PII scrubbing → GA4 (Google, EUA) |
| **Retenção** | 14 meses (configuração a aplicar no painel GA4) |
| **Transferência internacional** | Sim — dados chegam ao Google LLC já anonimizados pelo sGTM Stape; coberta por DPA Stape + DPA Google |

### 2.2 Interesse legítimo identificado

A Anhangá Turismo opera com orçamento limitado de mídia paga. A análise comportamental agregada permite:

- Identificar quais páginas convertem visitantes em leads e quais apresentam alta taxa de abandono
- Otimizar o funil de conversão do chatbot de IA, reduzindo o custo por lead
- Decidir quais formatos de conteúdo do blog geram mais engajamento e justificam produção contínua
- Comparar performance de landing pages de diferentes destinos (Orlando, Beto Carrero, Lollapalooza, Melhor Idade)

Sem essa análise, decisões de investimento em tráfego pago seriam baseadas em suposição, aumentando o desperdício de orçamento e, indiretamente, o custo do serviço para o consumidor final.

### 2.3 Teste de necessidade e proporcionalidade

**É necessário?** Sim. Não existe alternativa igualmente eficaz que não envolva algum nível de coleta de dados de navegação.

**É proporcional?** Sim. Com a adoção do sGTM Stape, o IP e eventuais PII são removidos **antes** do dado chegar ao Google. O GA4 recebe apenas eventos comportamentais anonimizados, sem identificador pessoal direto.

**Poderia ser alcançado de forma menos invasiva?** A retenção foi reduzida de 26 para **14 meses**, suficiente para análises de tendência anuais sem manter dados além do necessário.

### 2.4 Balancing test — interesses da empresa vs. direitos do titular

| Fator | Avaliação |
|---|---|
| Natureza dos dados | Comportamental, não sensível, sem identificação direta |
| Expectativa razoável do titular | Visitar um site institucional implica algum nível de análise de tráfego — expectativa razoável |
| Impacto sobre o titular | Baixo — dados não são usados para decisões individuais nem para discriminação |
| Relação entre controlador e titular | Potencial cliente que acessou o site voluntariamente |
| Salvaguardas implementadas | IP stripping via sGTM Stape (EU); PII scrubbing antes do repasse ao Google; opt-out via banner de cookies; dados não vinculados a identidade real |

**Conclusão:** O interesse legítimo da empresa prevalece com folga. Com o sGTM intermediando e anonimizando os dados, o impacto sobre o titular é **mínimo** — o Google não recebe dados identificáveis. A expectativa de tratamento é razoável e as salvaguardas são robustas.

### 2.5 Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Re-identificação via cruzamento de dados | Muito Baixa | Baixo | IP e PII removidos pelo sGTM antes de chegar ao Google; sem vinculação a identidade |
| Falha de segurança na Stape OÜ | Baixa | Médio | DPA com Stape; Stape é ISO 27001; dados em trânsito apenas, sem armazenamento no sGTM |
| Falha de segurança na Google LLC | Baixa | Baixo | Dados chegam já anonimizados; DPA com Google; monitorar comunicados de incidente |
| Uso de dados pelo Google para fins próprios | Baixa | Mínimo para o titular | sGTM impede repasse de User-Agent completo e IPs reais; dados já sem valor de re-identificação |
| Configuração incorreta do sGTM (PII vazando) | Média (durante implantação) | Médio | Testes de validação obrigatórios antes de ativar em produção; monitorar request logs do sGTM |

### 2.6 Salvaguardas implementadas

- [x] IP stripping configurado no sGTM Stape antes do repasse ao GA4
- [x] PII scrubbing ativo no sGTM (e-mails, telefones removidos de event params)
- [x] Opt-out disponível via banner de consentimento de cookies (issue #782)
- [x] Retenção de 14 meses configurada no painel GA4
- [x] DPA assinado com Google LLC
- [x] DPA assinado com Stape OÜ (disponível no painel Stape)
- [ ] **Pendente:** validar ausência de PII nos request logs do sGTM após implantação
- [ ] **Pendente:** configurar User-Agent redaction na tag Meta CAPI do sGTM

---

## 3. Atividade 2 — Atribuição UTM e rastreamento de origem de campanhas

### 3.1 Descrição do tratamento

| Campo | Detalhe |
|---|---|
| **Dados tratados** | Parâmetros UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`), GA4 Client ID/Session ID; click IDs (`gclid`, `fbclid`, `msclkid`, `ttclid`) armazenados em cookie first-party `tracking_data` (30 dias) e `sessionStorage` |
| **Titulares** | Visitantes do site que chegam via campanhas de mídia paga ou orgânica |
| **Operadores** | Anhangá Turismo (armazenamento first-party); Stape OÜ/sGTM (repasse server-side de conversões ao Google Ads e Meta CAPI) |
| **Retenção** | 30 dias (cookie `tracking_data`); duração da sessão (`sessionStorage`) |
| **Transferência internacional** | Click IDs são enviados ao Google Ads e Meta via sGTM Stape (EU) com hashing de dados pessoais e remoção de IP antes do repasse |

> **Mudança arquitetural (v1.1):** Com o sGTM Stape, os click IDs (`gclid`, `fbclid`) não são mais transmitidos em chamadas browser-side para Google/Meta. O repasse de conversões ocorre server-side via **Enhanced Conversions** (Google) e **Conversions API / CAPI** (Meta), com dados pessoais hasheados (SHA-256) quando aplicável. Isso reduz materialmente o perfil de rastreamento no navegador do usuário.

### 3.2 Interesse legítimo identificado

A atribuição de origem é indispensável para:

- Medir o retorno sobre investimento (ROI) de campanhas de Google Ads, Meta Ads e outras fontes pagas
- Identificar qual campanha, anúncio ou palavra-chave gerou cada lead e venda
- Tomar decisões de alocação de orçamento baseadas em dados (ex.: aumentar investimento no canal com menor custo por lead)
- Comprovar performance para justificar orçamento de marketing perante gestão

Sem atribuição, é impossível saber se R$ 10.000 gastos em tráfego pago geraram R$ 1.000 ou R$ 100.000 em receita.

### 3.3 Teste de necessidade e proporcionalidade

**É necessário?** Sim. Não há alternativa que permita atribuição de conversão sem algum identificador persistente entre a visita e a conversão.

**É proporcional?** Sim. O cookie é first-party, limitado a 30 dias, e não é compartilhado com terceiros para fins de publicidade.

**Poderia ser menos invasivo?** A retenção de 30 dias é padrão de mercado para janelas de atribuição de campanhas. Reduzir prejudicaria a medição de conversões com ciclo de decisão mais longo (comum em viagens).

### 3.4 Balancing test

| Fator | Avaliação |
|---|---|
| Natureza dos dados | Técnico/comportamental; não sensível; não identifica diretamente o indivíduo |
| Expectativa razoável do titular | Usuários que clicam em anúncios pagos têm expectativa razoável de que o anunciante mede o resultado |
| Impacto sobre o titular | Mínimo — dados não saem do navegador do usuário neste fluxo |
| Salvaguardas | Cookie first-party; expiração 30 dias; opt-out via banner; nenhuma re-identificação |

**Conclusão:** Interesse legítimo prevalece com clareza. O impacto sobre o titular é mínimo e a expectativa de rastreamento de conversão é padrão em qualquer site comercial.

### 3.5 Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Acesso não autorizado ao cookie `tracking_data` | Baixa | Baixo | Dados não sensíveis; cookie first-party; sem credenciais ou PII direto |
| Coleta de click IDs antes do consentimento (client-side) | Baixa (pós issue #782) | Baixo | `initializeTracking()` opera sob legítimo interesse (RIPD Atividade 2); repasse de conversões é integralmente server-side via Stape sGTM, sem cookie de terceiros no browser; titular pode exercer direito de oposição via `privacidade@anhanga.tur.br` |
| Hashing incorreto no sGTM (dados pessoais não hasheados) | Média (durante implantação) | Médio | Testes de validação obrigatórios; revisar payload das tags Enhanced Conversions e CAPI no sGTM |

### 3.6 Salvaguardas implementadas

- [x] Cookie first-party com expiração de 30 dias
- [x] Conversões enviadas server-side via sGTM Stape (EU) — sem pixel JS de terceiros no browser
- [x] Dados pessoais hasheados (SHA-256) antes do repasse ao Google Ads e Meta CAPI
- [x] Opt-out disponível via banner (issue #782)
- [x] DPA assinado com Stape OÜ
- [x] **Implementado (issue #782):** `initializeTracking()` opera sob legítimo interesse; banner de cookies bloqueia Mautic e HubSpot; direito de oposição ao tratamento por interesse legítimo disponível via `privacidade@anhanga.tur.br` e documentado em `/politica-privacidade#cookies`
- [ ] **Pendente:** validar hashing de e-mail/telefone nas tags Enhanced Conversions e CAPI no sGTM

---

## 4. Atividade 3 — Armazenamento de histórico BANT no CRM

### 4.1 Descrição do tratamento

| Campo | Detalhe |
|---|---|
| **Dados tratados** | Nome, sobrenome, e-mail, WhatsApp, destino de viagem, resumo BANT (Budget/Autoridade/Necessidade/Timeline fornecidos voluntariamente no chatbot) |
| **Titulares** | Usuários que completam o fluxo de qualificação no chatbot e submetem o formulário de lead |
| **Operadores** | n8n GmbH (automação), HubSpot, Inc. (CRM), Salesforce, Inc. (CRM secundário) |
| **Retenção** | 5 anos após última interação (conforme Política de Privacidade seção 7.1) |
| **Transferência internacional** | Sim — EUA (HubSpot, Salesforce, n8n; cobertos por cláusulas contratuais padrão) |

### 4.2 Interesse legítimo identificado

O histórico BANT no CRM permite:

- Retomar atendimentos interrompidos sem que o cliente precise repetir todas as informações
- Personalizar a proposta comercial com base no contexto já fornecido (destino, datas, orçamento, composição do grupo)
- Reduzir o tempo médio de atendimento — vantagem direta para o cliente
- Manter continuidade caso o atendimento mude de consultor

O titular que chegou até o ponto de submeter o formulário de lead **iniciou ativamente o contato** com a agência — a expectativa de ser contactado e de que a agência guarde os dados fornecidos é razoável e alinhada com a relação comercial.

### 4.3 Teste de necessidade e proporcionalidade

**É necessário?** Sim. Sem persistência no CRM, cada atendimento recomeça do zero, prejudicando tanto a experiência do cliente quanto a eficiência operacional.

**É proporcional?** Sim. Apenas dados fornecidos voluntariamente pelo próprio titular são armazenados. Não há coleta inferida ou cruzamento com fontes externas sem consentimento.

**Poderia ser menos invasivo?** A retenção de 5 anos é adequada para o setor de turismo (janelas de viagem podem ser longas; clientes voltam após anos). Retenção mais curta prejudicaria o relacionamento com clientes recorrentes.

### 4.4 Balancing test

| Fator | Avaliação |
|---|---|
| Natureza dos dados | Dados de contato e preferências de viagem; não sensíveis conforme Art. 5º, II da LGPD |
| Expectativa razoável do titular | Quem submete um formulário de lead esperando ser contactado tem expectativa clara de que os dados serão guardados |
| Impacto sobre o titular | Baixo a moderado — dados ficam no CRM de uma empresa contratada; risco de vazamento existente mas mitigado |
| Iniciativa do titular | Alta — o titular tomou a ação ativa de preencher o formulário |
| Salvaguardas | Consentimento LGPD no formulário de lead; direito de exclusão operacional; mascaramento nos logs |

**Conclusão:** Interesse legítimo prevalece. O titular iniciou o contato, os dados são limitados ao necessário para o atendimento e há salvaguardas adequadas.

### 4.5 Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Vazamento de dados no CRM | Baixa | Alto | DPA com HubSpot e Salesforce; senhas fortes; 2FA habilitado |
| bantSummary contendo dados sensíveis (ex.: necessidades de saúde) | Média | Médio | Instruir o chatbot a não coletar dados de saúde; prompt de sistema já bloqueia esse escopo |
| Retenção além do necessário | Baixa | Médio | Processo anual de revisão e limpeza de leads inativos há mais de 5 anos |

### 4.6 Salvaguardas implementadas

- [x] Consentimento explícito no formulário `ChatLeadForm` (checkbox LGPD)
- [x] `bantSummary` omitido dos logs de infraestrutura (`api/submit-lead.ts:297`)
- [x] PII mascarada nos logs (`maskEmail`, `maskPhone`, `maskName`)
- [x] Direito de exclusão operacional documentado e canal funcional (`privacidade@anhanga.tur.br`)
- [x] Opt-out de comunicações de marketing disponível
- [ ] **Pendente:** DPA formal assinado com Salesforce, Inc.
- [ ] **Pendente:** Processo documentado de revisão anual e limpeza de leads inativos

---

## 5. Conclusão geral e aprovação

As três atividades de tratamento avaliadas são:

1. **Proporcionais** — limitadas ao mínimo necessário para as finalidades declaradas
2. **Necessárias** — não há alternativas igualmente eficazes com menor impacto
3. **Balanceadas** — o impacto sobre os titulares é baixo ou moderado, com salvaguardas adequadas e opt-out disponível

O balancing test favorece o legítimo interesse da Anhangá Turismo em todas as três atividades.

### Pendências antes da vigência do RIPD

| # | Ação | Responsável | Prazo sugerido |
|---|---|---|---|
| 1 | Implantar e configurar Stape.io (sGTM EU) com IP stripping, PII scrubbing e User-Agent redaction | Dev | 30 dias |
| 2 | Validar ausência de PII nos request logs do sGTM após implantação | Dev + Felipe (DPO) | 30 dias |
| 3 | Reduzir retenção GA4 para 14 meses no painel | Felipe (DPO) | 30 dias |
| 4 | Assinar DPA com Stape OÜ no painel Stape | Felipe (DPO) | 30 dias |
| 5 | Implementar banner de cookies condicionando `initializeTracking()` | Dev | Issue #782 |
| 6 | Assinar DPA com Salesforce, Inc. | Gestão / Jurídico | 60 dias |
| 7 | Documentar processo de limpeza anual de leads inativos | Felipe (DPO) | 60 dias |
| 8 | Concluir capacitação DPO (Felipe) | Felipe | 90 dias |
| 9 | Adicionar Stape OÜ à seção 6.1 da Política de Privacidade | Dev | Issue #784 |

### Assinaturas

| Papel | Nome | Data | Assinatura |
|---|---|---|---|
| Encarregado (DPO) | Felipe William Rodrigues Silva | ___/___/______ | ____________ |
| Responsável pela empresa | ___________________ | ___/___/______ | ____________ |

---

## 6. Histórico de versões

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | 02/06/2026 | Versão inicial — rascunho para revisão |
| 1.1 | 02/06/2026 | Incorporada decisão de adoção do Stape.io (sGTM EU); atualização das Atividades 1 e 2 com nova arquitetura server-side, operadores, riscos e salvaguardas; Stape OÜ adicionado como subprocessador |
| 1.2 | 2026-06-03 | Revisão pós issue #782: atualização de §3.5 e §3.6 da Atividade 2; `initializeTracking()` mantido sob legítimo interesse; canal de oposição documentado |

---

*Este documento é confidencial e deve ser disponibilizado à ANPD mediante solicitação formal, conforme Art. 38 da LGPD. Não publicar externamente sem revisão jurídica.*
