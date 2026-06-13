# Plano de Marketing 360 — Anhangá Viagens

**Versão:** 1.2 — 13/06/2026
**Horizonte:** Julho–Setembro 2026 (90 dias) + gatilhos para expansão
**Status:** Aprovado — decisões da seção 3 respondidas pelo Felipe em 11/06; Paid adiado em 13/06 (ver seção 5)

> **Mudança 1.1 → 1.2 (13/06/2026):** o `GOOGLE-ADS-REPORT.md` foi refeito com dados
> reais da API (12/06) e derrubou a narrativa anterior de "tCPA gerou conversões 40×
> mais baratas" — **nunca houve tCPA na conta**; 93% das "conversões" eram cliques no
> botão de WhatsApp, não leads. Consequência: o "CPL validado" que justificava
> Meta-primeiro era a mesma miragem. Decisão do Felipe (13/06): **pausar todo o Paid
> até o tracking estar 100% resolvido** (gatilhos de saída na seção 5). Seções 1, 2, 5,
> 6 e 8 reescritas.

> **Privacidade:** este doc contém estratégia ativa de campanha. Recomendado adicionar
> `marketing-plan-*.md` ao `.gitignore` antes de commitar qualquer alteração. Números
> sensíveis (contas de ads, spend) ficam nos relatórios locais, não aqui.

---

## 0. Como usar este documento

Este é o documento-mãe. Ele não substitui os planos por canal que já existem — ele os
unifica e diz qual o papel de cada um. Ordem de leitura: diagnóstico (1–2) → decisões
pendentes (3) → estratégia (4–5) → calendário unificado (6) → KPIs e governança (7–8).

---

## 1. Inventário — o que já existe (e está bom)

A maior descoberta do diagnóstico: **~60% do trabalho de fundação já foi feito.** O
problema não é falta de material, é falta de unificação e de execução contínua.

| Asset | Onde | Estado |
|---|---|---|
| Brand profile (ads dna) | `docs/marketing/brand-profile.json` | ✅ Completo (voz, cores, tipografia, imagery) |
| Plano de conteúdo blog + newsletter | `docs/marketing/content-calendar-2026.md` | ✅ Excelente — 4 pilares, calendário jun–set, segmentação por perfil do quiz, **em execução e em dia** |
| Auditoria SEO/GEO | `docs/seo/seo-geo-audit-2026-06.md` | ✅ Site tecnicamente saudável; fixes aplicados em jun |
| Audit Google Ads | `GOOGLE-ADS-REPORT.md` (local) | ✅ Refeito 12/06 com dados reais da API (score **32/100**, F). Conta ENABLED mas **sem veiculação** ~141 dias |
| Audit Meta Ads | `docs/marketing/meta-ads-report.md` (local) | ✅ Feito (score 49/100, conta pausada) |
| Blog | `content/blog/` | ✅ 24 posts, cadência semanal ativa, posts agendados até ago |
| Quiz (lead magnet) | `/quiz` | ✅ No ar, alimenta segmentação |
| Landing pages de produto | `/orlando`, `/beto-carrero`, `/lollapalooza`, `/melhor-idade`, `/corporativo`, `/consultoria-de-viagem`, `/curadoria-cruzeiros-brasil` | ✅ No ar |
| Chatbot BANT + handoff WhatsApp | Site (Gemini) | ✅ No ar, qualificação automática |
| Stack de automação | Salesforce (CRM) + Mautic + n8n + Chatwoot | ✅ Operacional (workflows INT-06, POS-01/03/04/05); n8n com referências HubSpot residuais a limpar (seção 9) |
| Infra GEO | llms.txt, RSS, /api/markdown, schemas JSON-LD | ✅ Acima da média do mercado |

**O que NÃO existe ou está quebrado:**

| Gap | Evidência | Gravidade |
|---|---|---|
| Tracking de conversão (Google e Meta) | Meta: `Lead` browser ✅ validado e2e em 12/06 (Pixel via GTM tag 50); **CAPI server via sGTM pendente** — teste e2e entregou WEB_ONLY=1, SERVER_ONLY=0; revalidar quando a Meta estabilizar (issues [#861](https://github.com/felipewilliam2/AV-SITE/issues/861)/[#863](https://github.com/felipewilliam2/AV-SITE/issues/863)). Google: conversão primária ainda é clique de WhatsApp (`generate_lead` real está HIDDEN); precisa virar primária + limpar 48 ações + conta voltar a veicular | 🔴 **Revisado 13/06: bloqueia Paid.** Sem conversão primária correta no Google e CAPI Meta revalidado, religar paga = repetir o erro (otimizar para clique, não lead) |
| Números de negócio definidos (meta de leads, budget, CAC aceitável) | Não documentados em lugar nenhum | 🔴 Bloqueia o plano |
| Diagnóstico do Instagram | Não existe; canal delegado à gerente desde mai/2026 | 🟡 Input pendente |
| Estado real do funil Mautic | Sequências desenhadas no calendário; execução parcial (Mautic ID 31 enviado). Sem doc do que está ativo | 🟡 Auditoria rápida |
| Google Business Profile / reviews | Nunca mencionado em nenhum plano | 🟡 Canal grátis ignorado |
| Medição do WhatsApp como canal | UTMs chegam ao WhatsApp, mas conversão lead→venda não fecha o ciclo nos ads | 🟡 Resolve com OCI |
| ~~Posicionamento divergente em material antigo~~ | ✅ Resolvido 11/06: direção "transformacional/retiros" arquivada; termo "boutique" também descontinuado (já bloqueado no site por `tests/site-positioning.test.ts`; remover dos docs: `CLAUDE.md`, `docs/product/product.md`, `docs/design/design-context.md`) | ✅ |

---

## 2. Diagnóstico por canal (consolidado dos audits)

**Site/SEO/GEO — o canal mais maduro.** 39 páginas indexáveis, prerender ok, schema
rico, llms.txt + RSS + markdown API. Causa-raiz de meta tags resolvida em março, issues
do Ahrefs reduzidos em junho. Pendências: IndexNow no Cloudflare, recrawl, GSC re-submit.

**Blog + Newsletter — o canal mais bem planejado e o único em execução consistente.**
4 pilares corretos (Planejamento & Custos → conversão; Destinos → awareness; Personas →
long-tail; Sazonal → picos). Funil quiz → newsletter segmentada → chatbot é desenho
acima da média. Risco: tudo depende de uma pessoa manter a cadência.

**Email/Mautic — desenhado, parcialmente executado.** Sequência de boas-vindas por
perfil especificada no calendário; confirmação de envio apenas pontual. Falta: auditoria
de 1h do que está ativo, e decisão sobre papel Mautic vs Salesforce (hoje há sobreposição
conceitual: nurture no Mautic, CRM/deals no Salesforce — funciona, mas precisa estar escrito
para não duplicar envios).

**Instagram — caixa-preta.** Delegado à gerente. Sem diagnóstico, sem cadência
documentada, sem amarração com os pilares do blog. O material de calendário antigo
(mar/2026) usava outro posicionamento de marca — não usar como base sem revisão.

**Google Ads — sem veiculação há ~141 dias, e o histórico que parecia bom era miragem.**
A revisão com dados reais da API (12/06) desmentiu a leitura anterior: **nunca houve tCPA
na conta**, e as "conversões baratas" não eram leads — **93% (69 de 74) foram cliques no
botão de WhatsApp**. O Smart Bidding (Maximize Conversions) otimizou a conta inteira para
gerar cliques de WhatsApp, com o `generate_lead` real marcado como HIDDEN. CPA real por
lead de formulário verificável: **R$ 350–1.057**. Causa-raiz combinada: (1) conversão
primária errada, (2) Broad sem lista de negativos, (3) geo Brasil inteiro em vez de SP,
(4) Display ligado em campanhas Search. A conta está ENABLED mas com **R$0/30 dias** —
verificar faturamento/aprovação antes de qualquer spend. Plano de relançamento em 3 fases
existe no report, mas a Fase 0 (corrigir conversão + negativos + geo + voltar a veicular)
é **pré-requisito**, não item paralelo.

**Meta Ads — pausado, um template validado.** Lolla: 67 registros a R$ 4,22, CTR 2,13%.
Anti-padrões identificados (otimizar para evento que não dispara; orçamento pulverizado;
lookalike sobre base de ~20 pessoas). Plano de relançamento no report local.

**WhatsApp — o canal onde a venda acontece, e o único sem medição de ponta a ponta.**
Tudo converge para ele (chatbot, CTAs, ads) mas o fechamento não retorna aos ads (OCI)
nem ao dashboard.

---

## 3. Decisões de negócio (aprovadas pelo Felipe em 11/06/2026)

1. **Meta de negócio: 8–10 leads qualificados/mês.** Racional: atendimento personalizado
   limita a capacidade — o gargalo é o atendimento, não a geração. Implicação importante:
   o plano otimiza para **qualidade de lead, não volume**. Se a geração passar de 10
   qualificados/mês, reduzir spend ou apertar a qualificação — não escalar atendimento às
   pressas.
2. **Budget de marketing: R$ 1.000/mês.**
3. **CAC-teto provisório: R$ 30–50/lead qualificado**, calibrar com dados em 60 dias.

**Benchmark de mercado (pesquisado em 11/06/2026):** não existe benchmark público
confiável de CAC para agências de viagens brasileiras do nosso porte. O que existe:
agências de viagem personalizada/luxo internacionais pagam US$ 80–200 por inquiry e
corporativo US$ 50–150 ([CausalFunnel 2025](https://www.causalfunnel.com/blog/what-is-cost-per-lead-cpl-for-travel-businesses-complete-2025-guide/));
social ads no setor ficam em US$ 10–80/lead, com paid search 30–60% mais barato que
social; e o CAC do setor de viagens subiu ~35% entre 2022–2025 enquanto o LTV cresceu só
4,5% (estudo Adobe/Incisiv/Publicis, via [PhocusWire](https://www.phocuswire.com/addressing-rising-customer-acquisition-costs-travel)).
Conclusão prática: nosso melhor benchmark é interno — R$ 4,22/lead bruto (Lolla, Meta).
**Sanidade da matemática:** R$ 1.000 ÷ 8–10 leads = teto absoluto de R$ 100–125/lead
qualificado se paid fosse a única fonte. O teto de R$ 30–50 é portanto conservador e
saudável; como orgânico (blog/quiz/SEO) também gera, há folga real.

---

## 4. Estratégia 360 — papel de cada canal no funil

Posicionamento (confirmado 11/06): **agência de viagens personalizadas em São Paulo —
roteiro sob medida, atendimento humano, zero estresse.** Sem o termo "boutique" (decisão
de marca; teste de regressão já bloqueia no site). Nichos onde a concorrência não está:
família/parques, melhor idade, lua de mel, corporativo PME. Material antigo de "turismo
transformacional" arquivado.

```
            AWARENESS              CONSIDERATION            DECISION           PÓS-VENDA
Blog/SEO    Destinos, sazonal  →   Comparações, custos  →   Agência vs OTA
Instagram   Reels descoberta   →   Carrosséis de valor  →   Prova social
Google Ads                         Demanda existente    →   Brand + non-brand
Meta Ads    Demanda latente    →   Retargeting          →   Lead (form/WhatsApp)
Email                              Nurture por perfil   →   CTA consultora     → NPS, reativação
WhatsApp                                                →   BANT + venda       → Indicação
GBP/Reviews                        Validação local      →   Confiança          → Pedir review
```

Regra de ouro do 360: **todos os canais giram em torno do mesmo tema semanal** (seção 6).
O blog já define o tema; os outros canais derivam dele. Um tema, cinco formatos — em vez
de cinco canais inventando pauta.

**Pilares unificados** (estendem os 4 do blog para todos os canais):
P1 Planejamento & Custos · P2 Destinos · P3 Personas · P4 Sazonal/Eventos ·
**P5 Bastidores & Prova Social** (novo — só para Instagram/email: cliente embarcando,
review, bastidor da consultoria; o pilar que blog não cobre e rede social exige).

---

## 5. Sequência de implantação

**Fase 0 — Fundações (semanas de 15/06 e 22/06, sem spend):**
tracking Meta (issue #861) + conversão primária Google corrigida + Enhanced Conversions;
respostas das 3 decisões da seção 3; auditoria de 1h do Mautic (o que está ativo);
briefing da gerente de marketing: diagnóstico Instagram + adoção dos pilares;
criar/reivindicar Google Business Profile e processo de pedir review pós-viagem (amarrar
ao NPS existente — quem dá 9–10 recebe link do GBP).

**Fase 1 — Orgânico unificado (a partir de 29/06):**
calendário da seção 6 rodando: blog (já roda) + Instagram derivado + newsletter (já roda).

**Fase 2 — Paid: PAUSADO até o tracking estar 100% resolvido (decisão 13/06).**
A justificativa anterior — "Meta primeiro porque tem o CPL validado de R$ 4,22" — caiu:
os dados reais do Google mostraram que esse tipo de número (evento de contato, não lead)
é uma miragem, e o R$ 4,22 do Meta é o mesmo padrão. Religar paga agora, com a conversão
errada ainda no comando do lance, só queimaria os R$ 1.000/mês otimizando para clique de
WhatsApp de novo. Portanto, **nenhum spend em julho** — o budget de paid fica retido e
julho roda 100% orgânico (Fase 1).

**Gatilhos de saída da pausa (todos obrigatórios antes de QUALQUER spend):**

| # | Gatilho | Fonte de verificação | Status |
|---|---|---|---|
| G1 | Conta Google volta a veicular (resolver R$0/30d — faturamento/aprovação) | Painel Google Ads | ⬜ |
| G2 | Conversão primária Google = submit de lead real (`generate_lead`); WhatsApp/call = secundárias | Painel — Conversões | ⬜ |
| G3 | 48 ações de conversão limpas para ~5 (1 primária + secundárias) | Painel — Conversões | ⬜ |
| G4 | Shared Negative List criada (≥30 termos: concorrentes, informacional, fora-de-geo, job/grátis) | Painel — Biblioteca | ⬜ |
| G5 | Geo = São Paulo PRESENCE; Display OFF nas Search | Painel — Configurações | ⬜ |
| G6 | CAPI Meta revalidado (SERVER_ONLY ≥ 1 com Preview sGTM aberto) | Events Manager + sGTM (issue #863) | ⬜ |

**Quando G1–G6 estiverem ✅ (alvo realista: fim de julho / início de agosto):** religar com
**concentração, não pulverização** — R$ 1.000/mês não comporta dois canais full. Religar
**apenas o Google**, e **só com a campanha Brand** (`[anhangá viagens]` exact, ~R$ 7/dia):
é a defesa de marca mais barata e o sinal mais limpo para validar que a nova conversão
primária dispara de verdade. Meta entra depois, **somente após o CAPI provar dedup/EMQ
saudável** e o Google brand confirmar que leads reais estão sendo contabilizados. A
decisão Meta-vs-Google-non-brand para o restante do budget fica para **setembro, com dados
reais de lead** — não com proxies de evento. Meta de aprendizado em qualquer canal:
acumular **15–30 leads de formulário reais** (não cliques) antes de ligar Smart Bidding.

**Fase 3 — Escala e expansão (set+):** ver gatilhos na seção 7.

---

## 6. Calendário unificado 90 dias (jul–set 2026)

Estrutura semanal fixa (o "ritmo da casa"):

| Dia | Canal | O quê | Dono |
|---|---|---|---|
| Seg | Blog | Post novo (já agendado no content-calendar-2026) | Felipe |
| Ter | Email | Newsletter do post, segmentada (já agendado) | Felipe |
| Qua | Instagram | Reel derivado do tema da semana | Gerente |
| Qui | Instagram | Carrossel de valor (resumo visual do post) | Gerente |
| Sex | Ads | Revisão semanal: spend, CPL, search terms (30 min) | Felipe |
| Sáb | Instagram | Prova social / bastidor (P5) | Gerente |
| Quinzenal (qui) | Blog | Atualização de post antigo (já agendado) | Felipe |

Temas por semana (herdados do content-calendar-2026 — coluna nova = derivação IG/Ads):

> **Nota 13/06:** a coluna "Ads amplifica" está **suspensa até os gatilhos G1–G6 (seção 5)**.
> As marcações ✅ abaixo descrevem o *plano de amplificação quando o paid religar* — não
> são para executar em julho. Quando o Google brand voltar (alvo ~ago), começar amplificando
> só o tema do mês vigente, um canal por vez.

| Semana | Tema (post de seg) | Pilar | Instagram deriva | Ads amplifica |
|---|---|---|---|---|
| 29/06 | Documentos p/ viajar com criança | P1 | Reel "3 erros de documento que cancelam embarque" + carrossel checklist | — (fase 0/1) |
| 07/07 | Quanto custa Disney 2026 (planilha real) | P2 | Reel "Disney custa X — fizemos as contas" + carrossel da planilha | ✅ Meta Leads tema família + Google non-brand "pacote disney" → `/orlando` |
| 14/07 | Disney vs Beto Carrero | P3 | Reel comparativo + enquete stories | ✅ continua família (Beto entra como variação de criativo) |
| 21/07 | Roteiro Bonito MS | P2 | Reel cenário + carrossel roteiro 5 dias | Google: manter; Meta: testar criativo Bonito no mesmo ad set |
| 28/07 | Quanto investir na viagem (ponte chatbot) | P1 | Carrossel "como calcular" + reel CTA chatbot | ✅ retargeting visitantes blog → chatbot |
| 04/08 | Cancún vs Punta Cana vs Aruba (lua de mel) | P2 | Reel comparativo + prova social casal | Tema do mês vira lua de mel |
| 11/08 | Cruzeiros Costa 2026/27 | P2 | Reel rotas + carrossel datas/preços | Meta: criativo cruzeiros → `/curadoria-cruzeiros-brasil` |
| 18/08 | Jalapão em julho | P2 | Reel fervedouros | — |
| 25/08 | Disney vs Universal | P2 | Reel + enquete | Família continua se CPL ok |
| 01/09 | Roteiro Disney 5 dias c/ crianças | P2 | Série stories "1 dia por story" | ✅ |
| 08/09 | Primeira viagem 60+ | P3 | Reel + depoimento melhor idade | Meta: testar criativo melhor idade → `/melhor-idade` |
| 15/09 | Lua de mel Europa: Lisboa vs Paris | P2 | Reel + carrossel | Lua de mel continua se CPL ok |
| 22/09 | Viagem corporativa PME | P3 | Carrossel LinkedIn-ready (preparação p/ fase B2B) | — (gatilho LinkedIn, seção 7) |
| 29/09 | Cruzeiro fluvial vs terrestre 60+ | P3 | Reel | — |

Revisão mensal (1ª sexta do mês): o que rodou vs planejado, KPIs da seção 8, decisão de
verba do mês seguinte. Output: 10 linhas no Slack, não relatório.

---

## 7. TikTok e LinkedIn — gatilhos, não datas

| Canal | Entra quando | Por quê |
|---|---|---|
| **LinkedIn Ads** | Prospecção corporativa iniciar E houver ≥3 conteúdos B2B publicados (E3 + 2 casos) | Ads B2B sem conteúdo de suporte queima verba; CPL LinkedIn é 5–10× Meta |
| **LinkedIn orgânico** | Já em set/2026 — perfil do Felipe publicando o conteúdo E3 reformatado | Custo zero, prepara o terreno |
| **TikTok Ads** | Capacidade real de produzir ≥2 vídeos nativos/semana por 8 semanas | TikTok pune conteúdo reciclado; sem produção não há canal |
| **TikTok orgânico** | Gerente validar reciclagem dos Reels (teste 30 dias, sem meta) | Teste barato antes de investir |

---

## 8. KPIs (baselines reais, não aspiracionais)

| Canal | KPI | Baseline atual | Meta 90 dias |
|---|---|---|---|
| Blog/SEO | Cliques orgânicos/mês (GSC) | registrar na fase 0 | +50% sobre baseline |
| Blog | Cadência | 1/semana ✅ | manter 100% |
| Newsletter | Open rate / CTR por segmento | registrar (Mautic) | >35% / >3% |
| Quiz | Leads/mês com opt-in | registrar | 2× baseline |
| Instagram | A definir pela gerente no diagnóstico | — | — |
| Google Ads | CPL (lead de formulário **real**, pós-fix) | sem baseline confiável (histórico era clique de WhatsApp) | religar só após G1–G6; acumular 15–30 leads reais antes de Smart Bidding |
| Meta Ads | CPL evento `Lead` (browser **+ CAPI**) | ~~R$ 4,22~~ descartado (era evento de contato, não lead qualificado) | definir baseline real só após CAPI revalidado (G6) |
| WhatsApp | Lead → conversa qualificada (BANT) | registrar via Salesforce | >40% |
| Pipeline | Leads qualificados/mês (todos os canais) | registrar | 8–10 (teto de capacidade — seção 3) |
| Paid | CAC por lead qualificado | sem baseline confiável | ≤ R$ 30–50 |
| GBP | Reviews | registrar | +2/mês via fluxo NPS |

---

## 9. Stack — atualizado 11/06 (decisões do Felipe)

**Duas mudanças estruturais decididas:**

1. **Pipeline de conversões → sGTM (Stape).** O caminho n8n/HTTP request para eventos
   Meta foi descontinuado. Evento canônico: `generate_lead` (dataLayer) → GTM web →
   sGTM; eventos de funil sairão do Salesforce → Stape. Escopo e desativações na
   [issue #863](https://github.com/felipewilliam2/AV-SITE/issues/863).

   **Status do tracking Meta (teste e2e de 12/06/2026):**
   - ✅ Browser: Pixel `Lead` (GTM tag 50) validado em produção — disparou, sobreviveu
     ao redirect do WhatsApp e registrou no pixel (WEB_ONLY = 1). `fbp`/`cid` viajando
     no payload do lead.
   - ❌ Server: tag CAPI do sGTM (tag 14) não entregou (SERVER_ONLY = 0). Suspeitos,
     em ordem: instabilidade da Meta em 12/06 (sGTM não faz retry); access token
     reinserido no painel (erro 190 silencioso); hit não chegou ao sGTM (corrida com
     o redirect).
   - 🔜 Revalidação quando a Meta estabilizar: novo submit com **Preview do sGTM
     aberto** (mostra o hit chegando + response code da Graph API) e re-consulta do
     SERVER_ONLY via API.
   - Emissores fantasmas: todos neutralizados (workflow legado n8n off, token Meta
     removido do Cloudflare via #864, tag 31 pausada, testEventCodes limpos).
   - Lead de teste a apagar do CRM: "Teste Tracking Ignorar"
     (`teste-tracking-e2e@anhanga.tur.br`).
2. **Salesforce é o CRM principal — migração do HubSpot JÁ CONCLUÍDA** (confirmado
   11/06; o commit #855 já removeu o HubSpot até das páginas legais/LGPD).

**Pendência de limpeza (não de migração):** workflows ativos no n8n ainda referenciam
HubSpot — INT-02 (Mautic→HubSpot MQL), INT-09 (Closed Lost), SLK-CRM, e a descrição do
"Lead Site" ainda menciona criação de contato no HubSpot. Auditar e desativar/reapontar
para Salesforce, junto com as desativações da issue #863. Todos os KPIs deste plano que
citavam HubSpot leem-se Salesforce.

Reavaliar em outubro: Mautic vs e-mail nativo do CRM; dashboard unificado se a revisão
mensal custar >2h.

---

## 10. Próximos passos imediatos

1. ~~Felipe responde as 3 decisões da seção 3~~ ✅ 11/06
2. **Google Ads — destravar os gatilhos G1–G6 (seção 5), nesta ordem de prioridade:**
   G1 (descobrir por que a conta não veicula — pode ser só faturamento) → G2 (conversão
   primária = lead real) → G3 (limpar 48 ações) → G4 (negative list) → G5 (geo SP + Display
   off). Estas são as Quick Wins 🔴 do `GOOGLE-ADS-REPORT.md`.
3. Issue #861/#863 (Meta) — revalidar CAPI com Preview sGTM aberto (gatilho G6)
4. Briefing da gerente: diagnóstico Instagram + ritmo qua/qui/sáb da seção 6
5. Auditoria 1h do Mautic + criar GBP
6. **Adicionar `marketing-plan-*.md` ao `.gitignore`** antes de commitar (recomendado no
   cabeçalho do doc, ainda não feito — este arquivo contém estratégia de campanha ativa)
7. Refazer a lista do Slack a partir deste doc (substituir a de 11/06) — destacar que
   **Paid está pausado**, julho é 100% orgânico
8. Remover "boutique" dos docs internos (`CLAUDE.md`, `docs/product/product.md`,
   `docs/design/design-context.md`) — o site já está protegido pelo teste de regressão
