# Plano de Conteúdo Blog — Anhangá Viagens
**Período:** Junho – Setembro 2026
**Atualizado em:** 02/06/2026
**Estratégia:** 4 pilares + clusters de subtópicos + newsletter segmentada por perfil do quiz + cadência 1 post/semana

---

## Contexto Estratégico

**Meta principal:** construir autoridade orgânica em nichos onde a Adventure Club não compete (persona familiar, lua de mel, melhor idade, corporativo) e capturar leads em estágio de consideration/decision — não apenas awareness.

**Entry point da newsletter:** o quiz em `/quiz` é o lead magnet. Ele já captura email + perfil de viajante (Escapista, Bon Vivant, Viajante de Verdade, Desbravador, Nômade de Alma) + destinos preferidos + o que trava a viagem. Esses dados alimentam a segmentação da newsletter — cada perfil recebe conteúdo relevante, não email genérico.

**Funil com newsletter:**
```
Blog/Redes → Quiz → [aceite voluntário] → Newsletter segmentada por perfil → Nurture → Chatbot BANT → Venda
```

**Princípios:**
- Cada post pertence a um pilar. Posts órfãos não se publicam.
- Cada post tem tag de perfil(s) — define qual segmento de newsletter recebe o email.
- Todo post tem pelo menos 1 CTA interno para landing page de produto OU para o chatbot.
- Todo post de informação prática leva schema FAQPage com 3-5 perguntas reais.
- Cadência: 1 post novo/semana + 1 atualização de post antigo a cada 2 semanas.
- Nunca publicar mais de 1 post no mesmo dia.
- Newsletter sai na terça-feira após o post de segunda — nunca no mesmo dia.

---

## Perfis do Quiz → Segmentos de Newsletter

| Perfil | Descrição | Conteúdo prioritário | Bloqueio mais comum |
|--------|-----------|---------------------|-------------------|
| **Escapista** | Quer descanso total, resort, tudo incluído | Caribe (D3.1), cruzeiros (D5.1), seguro (P1.1) | Tempo / Budget |
| **Bon Vivant** | Luxo, gastronomia, hotel incrível | Europa lua de mel (D2.3), roteiro Europa (D2.2), agência vs OTA (P1.2) | Budget |
| **Viajante de Verdade** | Equilíbrio conforto + descoberta | Pilar 1 inteiro, comparações, ETIAS | Destino indefinido |
| **Desbravador** | Fora do mapa, trilhas, cultura local | Jalapão (D4.2), Bonito MS (D4.1), turismo regenerativo (E4) | Companhia / Tempo |
| **Nômade de Alma** | Destinos únicos, total liberdade | Ásia, África & Oriente (futuros), roteiros alternativos | Companhia |
| **Família** *(via companhia)* | Roteiros para todas as idades | Disney/Beto Carrero (E1), documentos criança (P1.3), Orlando (D1.x) | Budget / Planejamento |

> **Nota:** perfil "Família" não é um resultado do quiz mas é inferido via resposta "Família" na pergunta de companhia. O n8n deve criar uma tag separada para isso no HubSpot.

---

## Os 4 Pilares

| # | Pilar | Foco | Dominar em |
|---|-------|------|-----------|
| 1 | **Planejamento & Custos** | Consideration/Decision — desfaz objeção de preço e complexidade | Julho/2026 |
| 2 | **Destinos** | Awareness + Consideration — inspire e compare | Agosto/2026 |
| 3 | **Experiências por Persona** | Decision — persona-led, long-tail, baixa concorrência | Setembro/2026 |
| 4 | **Eventos & Sazonalidade** | Oportunismo temporal — tráfego de pico em janelas curtas | Contínuo |

---

## Pilar 1 — Planejamento & Custos

**Por que dominar primeiro:** menor concorrência na Adventure Club, maior conversão (quem busca "quanto custa" está perto de decidir), e alimenta diretamente o BANT do chatbot.

**Hub:** post pilar "Guia Completo de Planejamento de Viagem Internacional" (criar após os spokes)

### Cluster de Posts

| # | Título | Tipo | Stage | Keyword alvo | Perfis | Urgência |
|---|--------|------|-------|-------------|--------|---------|
| P1.1 | **Seguro viagem internacional: quando é obrigatório, quando vale a pena e quanto custa em 2026** | Informação prática | Decision | "seguro viagem 2026" | Todos | Alta — gap total no blog |
| P1.2 | **Quanto custa contratar uma agência de viagens? Agência boutique vs. OTA vs. montar sozinho** | Comparison | Decision | "agência de viagens vale a pena" | Todos | Alta — desfaz objeção central de vendas |
| P1.3 | **Documentos para viajar com criança: nacional, internacional e sem um dos pais (2026)** | Informação prática | Awareness/Decision | "documentos viajar com criança" | Família | Média |
| P1.4 | **ETIAS 2026: o que mudou para brasileiros na Europa (perguntas e respostas)** | FAQ | Awareness/Decision | "ETIAS brasileiros 2026" | Bon Vivant, Viajante de Verdade, Nômade de Alma | Alta — janela fim de 2026 |
| P1.5 | **Mala de mão internacional: regras atualizadas por companhia aérea (tabela 2026)** | Tabela comparativa | Awareness | "mala de mão regras 2026" | Todos | Média — atualizar post existente |
| P1.6 | **Como saber quanto investir na sua viagem dos sonhos (sem surpresas no cartão)** | Thought leadership | Consideration | "quanto investir viagem" | Viajante de Verdade, Bon Vivant | Média — alimenta chatbot BANT |

**Post de ponte para chatbot:** P1.6 — termina com CTA direto para o chat: "Quanto custaria a SUA viagem? Converse com nossa consultora."

---

## Pilar 2 — Destinos

**Por que:** tráfego de awareness + alimenta as landing pages de produto que hoje ficam órfãs. Hub/spoke por destino.

### Sub-clusters por destino

#### Orlando / Disney
| # | Título | Stage | Keyword alvo | Perfis |
|---|--------|-------|-------------|--------|
| D1.1 | **Quanto custa uma viagem para a Disney em 2026? Planilha real com preços de junho** | Decision | "quanto custa viagem disney 2026" | Família, Bon Vivant |
| D1.2 | **Disney vs Universal Studios: qual parque escolher para cada perfil de viajante** | Consideration | "disney ou universal orlando" | Família |
| D1.3 | **Roteiro Disney em 5 dias com crianças de 4 a 8 anos: o que vale e o que evitar** | Implementation | "roteiro disney com criança" | Família |

*Todos linkam para:* `/orlando`

#### Europa
| # | Título | Stage | Keyword alvo | Perfis |
|---|--------|-------|-------------|--------|
| D2.1 | **ETIAS 2026** *(ver P1.4 — post compartilhado entre pilares)* | | | |
| D2.2 | **Roteiro Europa 10 dias: Lisboa, Madrid ou Roma como base?** | Consideration | "roteiro europa 10 dias" | Bon Vivant, Viajante de Verdade |
| D2.3 | **Lua de mel na Europa: Lisboa vs Paris para quem não quer só museus** | Decision | "lua de mel europa" | Bon Vivant |

*Todos linkam para:* post pilar Europa já existente + chatbot

#### Caribe
| # | Título | Stage | Keyword alvo | Perfis |
|---|--------|-------|-------------|--------|
| D3.1 | **Cancún, Punta Cana ou Aruba para lua de mel? Comparação honesta** | Consideration | "cancun punta cana aruba lua de mel" | Escapista, Bon Vivant |

*Linka para:* chatbot + `/orlando` (para pacote Caribe+Disney combinado)

#### Brasil
| # | Título | Stage | Keyword alvo | Perfis |
|---|--------|-------|-------------|--------|
| D4.1 | **Roteiro Bonito MS em 5 dias: o que vale e o que NÃO vale (junho a setembro)** | Awareness | "roteiro bonito ms" | Desbravador, Viajante de Verdade |
| D4.2 | **Jalapão em julho: roteiro, custos e por que ir antes que vire mainstream** | Awareness | "jalapão julho" | Desbravador, Nômade de Alma |

#### Cruzeiros
| # | Título | Stage | Keyword alvo | Perfis |
|---|--------|-------|-------------|--------|
| D5.1 | **Cruzeiros Costa Brasileira 2026/2027: todas as rotas, datas e preços** | Awareness/Decision | "cruzeiros brasil 2027" | Escapista, Melhor Idade |
| D5.2 | **Cruzeiro fluvial vs. roteiro terrestre na Europa: qual escolher para melhor idade** | Consideration | "cruzeiro fluvial europa melhor idade" | Escapista, Melhor Idade |

*Linka para:* `/curadoria-cruzeiros-brasil/`

---

## Pilar 3 — Experiências por Persona

**Por que:** long-tail keywords com baixíssima concorrência. Adventure Club não tem esses personas. Conversão alta porque o leitor já sabe o que quer.

| # | Título | Persona | Stage | Keyword alvo | Perfis quiz | Urgência |
|---|--------|---------|-------|-------------|------------|---------|
| E1 | **Disney vs Beto Carrero: qual escolher para crianças de 4 a 10 anos?** | Família | Consideration | "disney ou beto carrero" | Família | Alta — alimenta 2 produtos |
| E2 | **Primeira viagem internacional após os 60: o que ninguém te conta** | Melhor Idade | Awareness | "viagem melhor idade europa" | Escapista, Viajante de Verdade | Média |
| E3 | **Viagem corporativa: incentivo, MICE e workation — guia completo para PMEs** | Corporativo | Awareness | "viagem corporativa incentivo PME" | Bon Vivant, Viajante de Verdade | Média |
| E4 | **Turismo regenerativo no Brasil: 5 experiências que valem em 2026** | Consciente | Awareness | "turismo regenerativo brasil" | Desbravador, Nômade de Alma | Baixa — tendência emergente |

---

## Pilar 4 — Eventos & Sazonalidade

**Por que:** tráfego de pico com janela curta. Alta urgência, baixa longevidade. Publicar ANTES do evento, não durante.

| # | Título | Evento | Janela | Status |
|---|--------|--------|--------|--------|
| S1 | **Copa do Mundo 2026: cidades-sede, logística e o que vale ir ver** | Copa 2026 | Jun/Jul 2026 | ✅ Publicado |
| S2 | **Férias de julho 2026: 10 destinos para reservar nos próximos 15 dias** | Férias escolares | Publicar até 07/06 | ⚡ URGENTE |
| S3 | **Lollapalooza Brasil 2027: quando comprar, onde ficar, como planejar** | Lolla 2027 | Out/Nov 2026 | Agendar |
| S4 | **Cruzeiros temporada 2026/2027: melhores rotas e quando reservar** | Temporada cruzeiros | Publicar ago/set | Ver D5.1 |

---

## Mapa de Clusters (Visão Geral)

```
PILAR 1: Planejamento & Custos
├── Seguro viagem (P1.1)
├── Agência vs OTA — objeção de preço (P1.2) ← consideration gap crítico
├── Documentos com criança (P1.3)
├── ETIAS 2026 (P1.4) ← compartilhado com Pilar 2 / Europa
├── Mala de mão — atualizar post existente (P1.5)
└── Quanto investir — ponte para chatbot (P1.6)

PILAR 2: Destinos
├── Orlando/Disney
│   ├── Quanto custa Disney 2026 (D1.1)
│   ├── Disney vs Universal (D1.2)
│   └── Roteiro 5 dias com crianças (D1.3)
├── Europa
│   ├── Roteiro 10 dias (D2.2)
│   └── Lua de mel Europa (D2.3)
├── Caribe
│   └── Cancún vs Punta Cana vs Aruba (D3.1)
├── Brasil
│   ├── Bonito MS (D4.1)
│   └── Jalapão julho (D4.2)
└── Cruzeiros
    ├── Costa Brasileira 2026/2027 (D5.1)
    └── Fluvial vs Terrestre Europa (D5.2)

PILAR 3: Experiências por Persona
├── Disney vs Beto Carrero — família (E1)
├── Melhor idade primeira viagem (E2)
├── Corporativo/MICE (E3)
└── Turismo regenerativo (E4)

PILAR 4: Eventos & Sazonalidade
├── Copa 2026 ✅
├── Férias julho ⚡
├── Lollapalooza 2027
└── Temporada cruzeiros
```

---

## Sequência de boas-vindas (por perfil)

Disparada automaticamente pelo n8n após envio do quiz com `newsletterOptIn: true`.
3 emails por perfil, intervalo sugerido: D+0, D+3, D+7.

### Estrutura comum aos 5 perfis

| Email | Assunto | Conteúdo |
|-------|---------|----------|
| **#1 (D+0)** | "Seu perfil [Nome do Perfil] está aqui — e seus destinos também" | Resultado do quiz + 3 destinos recomendados + CTA para chatbot |
| **#2 (D+3)** | Variável por perfil (ver abaixo) | Post mais relevante para o perfil + dica exclusiva de assinante |
| **#3 (D+7)** | "Sua próxima viagem começa com uma conversa" | CTA direto para consultora + "sem compromisso, sem roteiro pronto" |

### Email #2 por perfil

| Perfil | Assunto email #2 | Post vinculado |
|--------|-----------------|---------------|
| Escapista | "Resort ou cruzeiro? A escolha que vai definir suas férias" | D5.1 / D3.1 |
| Bon Vivant | "O segredo dos hotéis boutique que nenhuma OTA te mostra" | P1.2 / D2.3 |
| Viajante de Verdade | "Quanto custa realmente planejar uma viagem internacional sozinho?" | P1.2 / P1.6 |
| Desbravador | "Jalapão está lotando. Quando ir antes que vire selfie stick" | D4.2 |
| Nômade de Alma | "O destino que nenhum algoritmo vai te recomendar" | D4.2 / futuro |
| Família | "Disney ou Beto Carrero: qual faz mais sentido para os seus filhos?" | E1 |

---

## Calendário 90 dias (junho – setembro 2026)

> Cadência: 1 post novo/semana (segunda-feira). Newsletter na terça seguinte. Atualização de post antigo a cada 2 semanas (quinta-feira).
> Prioridade: Pilar 1 domina junho. Pilar 2 domina julho-agosto. Pilar 3 em setembro.

### Junho 2026

| Data | Ação | Post / Newsletter | Pilar | Segmento |
|------|------|-------------------|-------|----------|
| 02/06 (seg) | Novo post | **Férias de julho 2026: 10 destinos para reservar nos próximos 15 dias** | S2 — Sazonalidade | Todos |
| 03/06 (ter) | Newsletter | Assunto: "Julho chega em 4 semanas. Você já sabe pra onde vai?" | — | Todos |
| 09/06 (seg) | Novo post | **Seguro viagem: quando é obrigatório, quando vale a pena e quanto custa** | P1.1 — Planejamento | Todos |
| 10/06 (ter) | Newsletter | Assunto: "A pergunta que todo mundo esquece antes de embarcar" | — | Todos |
| 12/06 (qui) | Atualizar | Mala de mão — adicionar tabela 2026 por companhia + schema FAQ | P1.5 | — |
| 16/06 (seg) | Novo post | **Quanto custa contratar uma agência de viagens? Agência boutique vs OTA** | P1.2 — Planejamento | Todos |
| 17/06 (ter) | Newsletter | Assunto: "Por que nossos clientes param de usar sites de passagem depois da primeira viagem com a gente" | — | Viajante de Verdade, Bon Vivant |
| 23/06 (seg) | Novo post | **ETIAS 2026: o que mudou para brasileiros na Europa** | P1.4 — Planejamento | Bon Vivant, Nômade de Alma |
| 24/06 (ter) | Newsletter | Assunto: "Europa 2026: a novidade que pode travar sua viagem no aeroporto" | — | Bon Vivant, Viajante de Verdade, Nômade de Alma |
| 26/06 (qui) | Atualizar | Post Europa 2026 existente → linkar para ETIAS + atualizar data | — | — |
| 30/06 (seg) | Novo post | **Documentos para viajar com criança: nacional, internacional, sem um dos pais** | P1.3 — Planejamento | Família |

### Julho 2026

| Data | Ação | Post / Newsletter | Pilar | Segmento |
|------|------|-------------------|-------|----------|
| 01/07 (ter) | Newsletter | Assunto: "A lista que toda família precisa antes de embarcar" | — | Família |
| 07/07 (seg) | Novo post | **Quanto custa uma viagem para a Disney em 2026? Planilha real** | D1.1 — Destinos | Família, Bon Vivant |
| 08/07 (ter) | Newsletter | Assunto: "Fizemos as contas. Veja o que uma viagem para a Disney custa de verdade em 2026" | — | Família |
| 10/07 (qui) | Atualizar | Post Brasil/Destinos mais antigo — atualizar data + FAQ schema | — | — |
| 14/07 (seg) | Novo post | **Disney vs Beto Carrero: qual escolher para crianças de 4 a 10 anos?** | E1 — Persona | Família |
| 15/07 (ter) | Newsletter | Assunto: "A comparação que toda família precisa fazer antes de comprar o pacote" | — | Família |
| 21/07 (seg) | Novo post | **Roteiro Bonito MS em 5 dias: o que vale e o que NÃO vale** | D4.1 — Destinos | Desbravador, Viajante de Verdade |
| 22/07 (ter) | Newsletter | Assunto: "Bonito está na moda. Isso é bom e ruim ao mesmo tempo." | — | Desbravador |
| 24/07 (qui) | Atualizar | Post Cruzeiros existente → adicionar temporada 2026/2027 | — | — |
| 28/07 (seg) | Novo post | **Como saber quanto investir na sua viagem dos sonhos** | P1.6 — Planejamento | Viajante de Verdade, Bon Vivant |
| 29/07 (ter) | Newsletter | Assunto: "Quanto você deveria separar para uma viagem que realmente vale?" | — | Viajante de Verdade, Bon Vivant |

### Agosto 2026

| Data | Ação | Post / Newsletter | Pilar | Segmento |
|------|------|-------------------|-------|----------|
| 04/08 (seg) | Novo post | **Cancún, Punta Cana ou Aruba para lua de mel?** | D3.1 — Destinos | Escapista, Bon Vivant |
| 05/08 (ter) | Newsletter | Assunto: "Caribe para lua de mel: a comparação honesta que ninguém te faz" | — | Escapista, Bon Vivant |
| 07/08 (qui) | Atualizar | Post melhor destino verão/inverno — atualizar + FAQ | — | — |
| 11/08 (seg) | Novo post | **Cruzeiros Costa Brasileira 2026/2027: rotas, datas e preços** | D5.1 — Destinos | Escapista |
| 12/08 (ter) | Newsletter | Assunto: "A temporada de cruzeiros começa em novembro. Quem reserva agora paga menos." | — | Escapista |
| 18/08 (seg) | Novo post | **Jalapão em julho: roteiro, custos e por que ir antes que vire mainstream** | D4.2 — Destinos | Desbravador, Nômade de Alma |
| 19/08 (ter) | Newsletter | Assunto: "Jalapão: você tem até 2027 antes que isso vire selfie stick" | — | Desbravador, Nômade de Alma |
| 21/08 (qui) | Atualizar | Post Orlando existente → linkar para D1.1 e D1.3 | — | — |
| 25/08 (seg) | Novo post | **Disney vs Universal Studios: qual parque para cada perfil** | D1.2 — Destinos | Família |
| 26/08 (ter) | Newsletter | Assunto: "Harry Potter ou Star Wars? A escolha que vai definir a viagem da sua família" | — | Família |

### Setembro 2026

| Data | Ação | Post / Newsletter | Pilar | Segmento |
|------|------|-------------------|-------|----------|
| 01/09 (seg) | Novo post | **Roteiro Disney 5 dias com crianças de 4 a 8 anos** | D1.3 — Destinos | Família |
| 02/09 (ter) | Newsletter | Assunto: "5 dias na Disney com criança pequena: o que vale e o que você vai se arrepender de ter pulado" | — | Família |
| 04/09 (qui) | Atualizar | Post Lollapalooza → adicionar edição 2027 + datas | — | — |
| 08/09 (seg) | Novo post | **Primeira viagem internacional após os 60: o que ninguém te conta** | E2 — Persona | Escapista, Viajante de Verdade |
| 09/09 (ter) | Newsletter | Assunto: "A viagem que muda depois dos 60 — e por que isso é bom" | — | Escapista |
| 15/09 (seg) | Novo post | **Lua de mel na Europa: Lisboa vs Paris para quem não quer só museus** | D2.3 — Destinos | Bon Vivant |
| 16/09 (ter) | Newsletter | Assunto: "Lisboa ou Paris? A resposta depende do tipo de casal que vocês são" | — | Bon Vivant |
| 22/09 (seg) | Novo post | **Viagem corporativa: incentivo, MICE e workation para PMEs** | E3 — Persona | Bon Vivant, Viajante de Verdade |
| 23/09 (ter) | Newsletter | Assunto: "Sua empresa pode financiar a sua próxima viagem. Sério." | — | Bon Vivant, Viajante de Verdade |
| 29/09 (seg) | Novo post | **Cruzeiro fluvial vs roteiro terrestre na Europa para melhor idade** | D5.2 — Destinos | Escapista |
| 30/09 (ter) | Newsletter | Assunto: "Reno, Danúbio ou ônibus de cidade em cidade? A escolha certa para quem quer conforto sem abrir mão de Europa" | — | Escapista |

---

## Priorização por Score

Critérios: Customer Impact (40%) + Content-Market Fit (30%) + Search Potential (20%) + Recursos (10%)

| Post | Impacto (40%) | Fit (30%) | Search (20%) | Recursos (10%) | **Score** | Semana |
|------|--------------|----------|-------------|----------------|-----------|--------|
| Férias julho 2026 | 9 | 8 | 9 | 8 | **8.7** | 02/06 |
| Seguro viagem | 9 | 9 | 8 | 9 | **8.8** | 09/06 |
| Agência vs OTA | 10 | 10 | 7 | 8 | **9.1** | 16/06 |
| ETIAS 2026 | 8 | 8 | 8 | 8 | **8.0** | 23/06 |
| Disney — quanto custa | 9 | 10 | 8 | 7 | **8.9** | 07/07 |
| Disney vs Beto Carrero | 9 | 10 | 7 | 8 | **8.7** | 14/07 |
| Quanto investir (chatbot) | 8 | 10 | 6 | 9 | **8.2** | 28/07 |
| Cancún vs Punta Cana | 7 | 8 | 8 | 8 | **7.7** | 04/08 |
| Cruzeiros 2026/2027 | 8 | 9 | 7 | 8 | **8.1** | 11/08 |
| Documentos com criança | 7 | 7 | 9 | 9 | **7.7** | 30/06 |

---

## Estrutura padrão de cada post

Todo post deve seguir esta estrutura mínima:

```
1. H1 — título com keyword exata
2. Intro — 2 parágrafos. Dor/contexto + promessa do post.
3. Corpo — H2s com subtópicos. Cada H2 responde uma dúvida real.
4. Tabela ou lista numerada — pelo menos uma. Melhora GEO.
5. FAQ section — 3 a 5 perguntas com schema FAQPage.
   Ex: "Seguro viagem é obrigatório para onde?", "Quanto custa em média?"
6. CTA final — link para landing page de produto relevante OU
   "Quer um roteiro personalizado? Converse com nossa consultora →"
   (link direto para o chatbot/WhatsApp)
```

---

## Posts da lista original não incluídos (e por quê)

| Post original | Decisão |
|---|---|
| Roteiro Bonito MS | ✅ Incluído — D4.1, agosto |
| Turismo regenerativo | Adiado para outubro — baixa urgência, alta relevância futura |
| Lua de mel Maldivas | Não incluído neste ciclo — já tem post existente; atualizar é suficiente |
| Post pilar Europa (roteiro 10 dias) | Adiado para outubro — pilar Europa já tem ETIAS + Lua de mel |

---

## Checklist antes de publicar cada post

**Blog:**
- [ ] Post pertence a um dos 4 pilares?
- [ ] Tag(s) de perfil definidas?
- [ ] Tem pelo menos 1 link interno para landing page de produto?
- [ ] Tem schema FAQPage com mínimo 3 perguntas?
- [ ] Tem tabela ou lista numerada?
- [ ] CTA aponta para chatbot ou página de produto?
- [ ] Publicado sozinho (não junto com outro post no mesmo dia)?
- [ ] Data de publicação adicionada/atualizada no cabeçalho?

**Newsletter (na terça seguinte ao post):**
- [ ] Assunto definido (ver coluna "Segmento" no calendário)?
- [ ] Segmento correto selecionado no ESP?
- [ ] Contém: intro pessoal (2-3 linhas) + preview do post + dica exclusiva + CTA?
- [ ] Link do post testado antes de enviar?
- [ ] Enviado como resposta ao email de boas-vindas (mesmo thread no HubSpot)?
