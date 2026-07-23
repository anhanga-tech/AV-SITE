# Relatório de Impacto à Proteção de Dados Pessoais (RIPD)
**Base legal:** Legítimo Interesse — Art. 7º, IX da Lei nº 13.709/2018 (LGPD)

---

| Campo | Informação |
|---|---|
| **Controlador** | Anhangá Turismo Ltda. — CNPJ 37.036.732/0001-41 |
| **Endereço** | Av. Dom Pedro I, 773, Vila Monumento, São Paulo-SP, CEP 01552-001 |
| **Encarregado (DPO)** | Felipe William Rodrigues Silva |
| **E-mail DPO** | privacidade@anhanga.tur.br |
| **Versão** | 1.6 |
| **Data de elaboração** | 02/06/2026 |
| **Última revisão** | 23/07/2026 |
| **Próxima revisão** | 03/06/2027 |
| **Status** | Rascunho — pendente de revisão jurídica e aprovação do DPO |

---

## 1. Finalidade e escopo

Este relatório documenta a avaliação de impacto sobre as atividades de tratamento de dados pessoais realizadas pela **Anhangá Turismo Ltda.** com fundamento em **legítimo interesse** (Art. 7º, IX da LGPD), conforme exigido pelo Art. 38 da mesma Lei e pelas orientações da Autoridade Nacional de Proteção de Dados (ANPD).

O relatório cobre **quatro atividades de tratamento** identificadas:

1. Análise comportamental agregada via Google Analytics 4 (GA4)
2. Atribuição UTM e click IDs para mensuração de campanhas de tráfego pago
3. Armazenamento de histórico de qualificação BANT no CRM para atendimento ao cliente
4. Customer Match — criação de públicos personalizados no Google Ads e Meta Ads

**Decisão arquitetural relevante (v1.1):** A Anhangá Turismo adotou o **Stape.io** como plataforma de server-side tagging (sGTM gerenciado, servidores hospedados no Brasil). Todo o rastreamento de analytics e conversões passa pelo container server-side antes de chegar às plataformas de terceiros (Google, Meta). Essa decisão fortalece materialmente o balancing test das Atividades 1 e 2, pois os dados são anonimizados e filtrados antes de qualquer repasse externo.

**Nota sobre a Atividade 4 (v1.3):** O Customer Match tem base legal em **consentimento** (Art. 7º, I), e não em legítimo interesse. É incluído neste RIPD porque envolve compartilhamento de dados pessoais (ainda que hasheados) com plataformas internacionais para finalidade de perfilamento — perfil de alto risco que a ANPD pode exigir documentação de impacto independentemente da base legal (Art. 38).

Atividades baseadas em **consentimento** de baixo risco — como cookies de publicidade cross-site, remarketing avançado, Mautic e HubSpot tracking passivo — são geridas pelo mecanismo de consentimento de cookies e **não estão no escopo deste RIPD**.

**Nota sobre o registro do consentimento de cookies (v1.5):** A escolha do titular no banner de cookies é registrada exclusivamente no navegador do próprio titular (`localStorage`, chave `anhanga_cookie_consent_meta`, com data/hora e versão do schema do registro). O texto do aviso não é versionado no registro em si; como a copy do banner é versionada em código, o texto vigente em qualquer data é reconstituível pelo histórico do repositório a partir do timestamp gravado. Não há registro server-side dessa escolha — se o titular limpar o armazenamento local ou trocar de dispositivo, o controlador não dispõe de prova individual do aceite (Art. 8º, §2º). **Risco aceito** pela seguinte ponderação: (i) o consentimento de cookies rege apenas o carregamento de scripts de marketing no navegador, sem tratamento server-side associado; (ii) a arquitetura *fail-closed* — sem registro local, os scripts de marketing simplesmente não carregam — faz com que a ausência de prova coincida com a ausência de tratamento; (iii) registrar cada escolha em servidor criaria novo tratamento de dados (IP/identificador + escolha) desproporcional à finalidade. Consentimentos com efeito server-side (opt-in de marketing nos formulários) **são** registrados no CRM Odoo (campo `x_lgpd_consent`).

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
| **Operadores** | Anhangá Turismo (armazenamento first-party); Stape OÜ/sGTM (repasse de conversões ao Google Ads, Meta CAPI e TikTok Events API; destinos de marketing somente após consentimento) |
| **Retenção** | 30 dias (cookie `tracking_data`); duração da sessão (`sessionStorage`) |
| **Transferência internacional** | Click IDs permanecem first-party antes do consentimento. Após opt-in de marketing, sinais necessários podem ser enviados ao Google, Meta e TikTok pelo sGTM e pelos pixels consentidos, conforme a finalidade de atribuição/conversão. |

> **Arquitetura híbrida (issue #1261):** UTMs e click IDs são armazenados first-party para atribuição. GA4 continua via sGTM sob a premissa de legítimo interesse do projeto. Meta e TikTok permanecem bloqueados antes do consentimento e após recusa; depois do opt-in, os pixels podem medir PageView/Lead no navegador e as conversões server-side seguem por Meta CAPI e TikTok Events API.

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
| Impacto sobre o titular | Antes do opt-in, os identificadores permanecem first-party e não há script/beacon Meta ou TikTok. Após consentimento, pixels e APIs recebem somente os sinais necessários às finalidades informadas. |
| Salvaguardas | Cookie first-party; expiração de 30 dias; opt-in para marketing; gates no GTM web e server; nenhuma re-identificação fora das plataformas autorizadas. |

**Conclusão:** Interesse legítimo prevalece com clareza. O impacto sobre o titular é mínimo e a expectativa de rastreamento de conversão é padrão em qualquer site comercial.

### 3.5 Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Acesso não autorizado ao cookie `tracking_data` | Baixa | Baixo | Dados não sensíveis; cookie first-party; sem credenciais ou PII direto |
| Coleta de click IDs antes do consentimento (client-side) | Baixa (pós issues #782/#1261) | Baixo | `initializeTracking()` armazena atribuição first-party sob a premissa documentada de legítimo interesse; GTM web e sGTM bloqueiam Meta/TikTok até `ad_storage=granted`; titular pode exercer oposição via `privacidade@anhanga.tur.br` |
| Hashing incorreto no sGTM (dados pessoais não hasheados) | Média (durante implantação) | Médio | Testes de validação obrigatórios; revisar payload das tags Enhanced Conversions e CAPI no sGTM |

### 3.6 Salvaguardas implementadas

- [x] Cookie first-party com expiração de 30 dias
- [x] Conversões enviadas server-side via sGTM Stape; pixels Meta/TikTok só carregam após opt-in de marketing
- [x] Antes do consentimento e após recusa, Meta/TikTok não carregam script, criam cookie ou emitem beacon
- [x] Dados pessoais usados para matching são hasheados (SHA-256) antes do repasse ao Google Ads e Meta CAPI; a TikTok Events API não recebe e-mail ou telefone nesta fase
- [x] Opt-out disponível via banner (issue #782)
- [x] DPA assinado com Stape OÜ
- [x] **Implementado (issue #782):** `initializeTracking()` opera sob legítimo interesse; banner de cookies bloqueia Mautic e HubSpot; direito de oposição ao tratamento por interesse legítimo disponível via `privacidade@anhanga.tur.br` e documentado em `/politica-privacidade#cookies`
- [ ] **Pendente:** validar hashing de e-mail/telefone nas tags Enhanced Conversions e Meta CAPI no sGTM

---

## 4. Atividade 3 — Armazenamento de histórico BANT no CRM

### 4.1 Descrição do tratamento

| Campo | Detalhe |
|---|---|
| **Dados tratados** | Nome, sobrenome, e-mail, WhatsApp, destino de viagem, resumo BANT (Budget/Autoridade/Necessidade/Timeline fornecidos voluntariamente no chatbot) |
| **Titulares** | Usuários que completam o fluxo de qualificação no chatbot e submetem o formulário de lead |
| **Operadores** | Odoo S.A. (CRM ativo — `res.partner` + `crm.lead` via JSON-RPC, cut-over concluído em jun/2026). HubSpot, Inc. permanece apenas como destino do webhook legado de deals Closed-Won (não recebe mais os dados deste formulário). Salesforce, Inc. foi aposentado — não processa mais dados de leads. |
| **Retenção** | 5 anos após última interação (conforme Política de Privacidade seção 7.1) |
| **Transferência internacional** | A confirmar com o DPO — depende da região de hospedagem da instância Odoo Online contratada; verificar em Configurações → Informações técnicas antes de atualizar este RIPD |

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
| Vazamento de dados no CRM | Baixa | Alto | DPA com Odoo S.A.; senhas fortes; 2FA habilitado |
| bantSummary contendo dados sensíveis (ex.: necessidades de saúde) | Média | Médio | Instruir o chatbot a não coletar dados de saúde; prompt de sistema já bloqueia esse escopo |
| Retenção além do necessário | Baixa | Médio | Processo anual de revisão e limpeza de leads inativos há mais de 5 anos |

### 4.6 Salvaguardas implementadas

- [x] Consentimento explícito no formulário `ChatLeadForm` (checkbox LGPD)
- [x] `bantSummary` omitido dos logs de infraestrutura (`api/submit-lead.ts:297`)
- [x] PII mascarada nos logs (`maskEmail`, `maskPhone`, `maskName`)
- [x] Direito de exclusão operacional documentado e canal funcional (`privacidade@anhanga.tur.br`)
- [x] Opt-out de comunicações de marketing disponível
- [ ] **Pendente:** DPA formal assinado com Odoo S.A. (substitui o item antigo de DPA com Salesforce, Inc. — CRM aposentado)
- [ ] **Pendente:** Processo documentado de revisão anual e limpeza de leads inativos

---

## 5. Atividade 4 — Customer Match e Públicos Personalizados

### 5.1 Descrição do tratamento

| Campo | Detalhe |
|---|---|
| **Dados tratados** | E-mail e telefone pseudonimizados por hash unidirecional (SHA-256) de contatos do CRM com `newsletterOptIn: true` |
| **Titulares** | Contatos do CRM que consentiram explicitamente com comunicações de marketing |
| **Operadores** | Stape OÜ (intermediação server-side, servidores BR) → Google LLC (Google Ads Customer Match) + Meta Platforms, Inc. (Meta Custom Audiences / CAPI) |
| **Arquitetura** | CRM (segmento opt-in) → export com hash SHA-256 → upload via Stape sGTM → Google Ads / Meta Ads |
| **Retenção** | Até revogação do consentimento ou exclusão do contato do CRM |
| **Transferência internacional** | Sim — EUA (Google LLC, Meta Platforms), via Stape OÜ (Estônia / servidores BR) |

### 5.2 Base legal

**Art. 7º, I LGPD — Consentimento específico do titular.**

O consentimento é coletado no momento do cadastro no quiz ou nos formulários de captura de lead, por meio de checkbox de opt-in explícito com texto: *"Quero receber novidades, ofertas e dicas de viagem da Anhangá Viagens."* Apenas contatos com `newsletterOptIn: true` no Mautic são elegíveis para inclusão em listas de customer match.

Contatos com `newsletterOptIn: false` ou com flag "Do Not Contact" no Mautic **não entram nas listas de customer match**.

### 5.3 Finalidade e necessidade

**Finalidade principal:** Exibir anúncios relevantes para clientes existentes que já demonstraram interesse em viagens, aumentando a eficiência do investimento em mídia paga.

**Finalidade secundária:** Excluir clientes ativos de campanhas de prospecção (exclusion lists), evitando desperdício de verba e redundância de contatos.

**É necessário?** Sim. Sem customer match, todos os anúncios são exibidos para públicos frios — o custo por conversão é sistematicamente mais alto, e clientes já ativos são impactados por campanhas de aquisição desnecessariamente.

**Poderia ser menos invasivo?** O dado transferido é apenas o hash SHA-256 do e-mail/telefone — o dado original não é transmitido às plataformas. As plataformas usam o hash apenas para correspondência interna e não armazenam nem utilizam para outros fins (conforme ToS Google Ads e Meta Ads).

### 5.4 Avaliação de impacto

| Fator | Avaliação |
|---|---|
| Natureza dos dados | Hash unidirecional — matematicamente irreversível sem o dado original; não permite re-identificação por terceiros |
| Titulares afetados | Exclusivamente contatos com consentimento explícito de marketing |
| Impacto sobre o titular | Baixo — o titular consente com comunicações de marketing; ver anúncios da empresa é consequência natural e esperada desse consentimento |
| Risco de finalidade incompatível | Baixo — Google e Meta são obrigados contratualmente a usar os dados apenas para correspondência de audiência |
| Direito de oposição | Garantido — titular pode revogar consentimento a qualquer momento via `privacidade@anhanga.tur.br` ou descadastrando-se das comunicações de marketing |

### 5.5 Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Upload acidental de contatos sem opt-in | Média | Alto | Segmentação obrigatória no Mautic antes do export — filtro `newsletterOptIn: true`; auditoria do segmento antes de cada upload |
| Hash SHA-256 invertido por força bruta (e-mails comuns) | Baixa | Médio | Adicionar salt ou substituir por hash com pepper antes do upload (melhoria futura); concentração de risco nas plataformas (Google/Meta), não na Stape |
| Plataforma usa hash para fins além do matching | Muito Baixa | Médio | Coberto pelos ToS do Google Customer Match e Meta Custom Audiences; revisão anual dos termos |
| Envio antes da notificação LGPD aos titulares | Alta (se não observada a sequência) | Alto | Ordem obrigatória: merge #784 → e-mail notificação → aguardar 15 dias → primeiro upload |

### 5.6 Salvaguardas implementadas

- [x] Consentimento explícito coletado via checkbox de opt-in nos formulários
- [x] Segmento Mautic `newsletterOptIn: true` como pré-requisito para qualquer export
- [x] Dados transmitidos exclusivamente em formato SHA-256 via Stape sGTM
- [x] Política de Privacidade atualizada com seção 5.5 e 6.1 documentando customer match (PR #803)
- [x] Canal de revogação de consentimento disponível (`privacidade@anhanga.tur.br`)
- [x] **Concluído (04/06/2026):** e-mail de notificação LGPD enviado à base `[S] Base Email Ativa` via Mautic (e-mail ID 24, agendado 10h00 de 04/06/2026) — janela de 15 dias de opt-out iniciada
- [ ] **Pendente:** primeiro upload de customer match (só após 19/06/2026)
- [ ] **Pendente:** processo documentado de auditoria pré-upload (checklist de segmentação)

---

## 6. Conclusão geral e aprovação

As quatro atividades de tratamento avaliadas são:

1. **Proporcionais** — limitadas ao mínimo necessário para as finalidades declaradas
2. **Necessárias** — não há alternativas igualmente eficazes com menor impacto
3. **Balanceadas / Consentidas** — o impacto sobre os titulares é baixo ou moderado, com salvaguardas adequadas e opt-out disponível

O balancing test favorece o legítimo interesse nas Atividades 1, 2 e 3. A Atividade 4 é baseada em consentimento específico do titular com segmentação obrigatória de opt-in antes de qualquer upload.

### Pendências antes da vigência do RIPD

| # | Ação | Responsável | Prazo sugerido | Status |
|---|---|---|---|---|
| 1 | Implantar e configurar Stape.io (sGTM) com IP stripping, PII scrubbing e User-Agent redaction | Dev | 30 dias | Pendente |
| 2 | Validar ausência de PII nos request logs do sGTM após implantação | Dev + Felipe (DPO) | 30 dias | Pendente |
| 3 | Reduzir retenção GA4 para 14 meses no painel | Felipe (DPO) | 30 dias | Pendente |
| 4 | Assinar DPA com Stape OÜ no painel Stape | Felipe (DPO) | 30 dias | Pendente |
| 5 | Implementar banner de cookies condicionando `initializeTracking()` | Dev | Issue #782 | ✅ Concluído |
| 6 | Assinar DPA com Odoo S.A. (item atualizado — CRM ativo desde o cut-over de jun/2026; Salesforce foi aposentado) | Gestão / Jurídico | 60 dias | Pendente |
| 7 | Documentar processo de limpeza anual de leads inativos | Felipe (DPO) | 60 dias | Pendente |
| 8 | Concluir capacitação DPO (Felipe) | Felipe | 90 dias | Pendente |
| 9 | Adicionar Stape OÜ e customer match à Política de Privacidade | Dev | Issue #784 | ✅ PR #803 aberto |
| 10 | Enviar e-mail de notificação LGPD aos titulares | Felipe (DPO) | Após merge #803 | ✅ Enviado 04/06/2026 (Mautic ID 24) |
| 11 | Documentar checklist de auditoria pré-upload de customer match | Felipe (DPO) | Antes do 1º upload | Pendente |
| 12 | Realizar primeiro upload de customer match (após janela de 15 dias) | Felipe (DPO) | A partir de 19/06/2026 | Pendente |

### Assinaturas

| Papel | Nome | Data | Assinatura |
|---|---|---|---|
| Encarregado (DPO) | Felipe William Rodrigues Silva | ___/___/______ | ____________ |
| Responsável pela empresa | ___________________ | ___/___/______ | ____________ |

---

## 7. Histórico de versões

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | 02/06/2026 | Versão inicial — rascunho para revisão |
| 1.1 | 02/06/2026 | Incorporada decisão de adoção do Stape.io (sGTM); atualização das Atividades 1 e 2 com nova arquitetura server-side, operadores, riscos e salvaguardas; Stape OÜ adicionado como subprocessador |
| 1.2 | 03/06/2026 | Revisão pós issue #782: atualização de §3.5 e §3.6 da Atividade 2; `initializeTracking()` mantido sob legítimo interesse; canal de oposição documentado |
| 1.3 | 03/06/2026 | Atividade 4 adicionada (Customer Match — base legal consentimento Art. 7º, I); n8n GmbH removido como operador da Atividade 3 (self-hosted); tabela de pendências atualizada com itens 10-12; Política de Privacidade PR #803 registrado como pendência concluída (#9) |
| 1.4 | 04/06/2026 | Pendência #10 concluída: e-mail de notificação LGPD enviado à base via Mautic (ID 24, 04/06/2026 10h00); janela de 15 dias iniciada; primeiro upload de customer match liberado a partir de 19/06/2026 |
| 1.5 | 07/07/2026 | Auditoria do banner de cookies: nota sobre registro client-side do consentimento (risco aceito, §1); `<noscript>` do GTM removido do site (furava o Consent Mode para usuários sem JS) |
| 1.6 | 23/07/2026 | Atividade 2 alinhada à arquitetura híbrida consent-gated: Meta/TikTok bloqueados antes do opt-in; destinos server-side e salvaguardas de matching atualizados; base legal e conclusão preservadas |

---

*Este documento é confidencial e deve ser disponibilizado à ANPD mediante solicitação formal, conforme Art. 38 da LGPD. Não publicar externamente sem revisão jurídica.*
