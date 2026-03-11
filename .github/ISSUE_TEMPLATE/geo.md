---
name: "\U0001F916 GEO (Generative Engine Optimization)"
about: Otimização para visibilidade em respostas de IA (ChatGPT, Claude, Perplexity, Google AI Overview)
title: "[GEO] "
labels: geo, seo
assignees: ''
---

## 🎯 Objetivo
<!-- O que precisa melhorar na visibilidade do site em respostas de IA? -->

## 📋 Tipo de GEO
<!-- Marque o(s) que se aplica(m) -->
- [ ] **Conteúdo citável** — dados originais, estatísticas, definições claras
- [ ] **Autoridade** — credenciais, quotes atribuídos, "quem escreveu"
- [ ] **Estrutura** — FAQ, tabelas comparativas, step-by-step, listas definidas
- [ ] **Freshness** — timestamps "Última atualização", dados atualizados
- [ ] **Entity SEO** — presença em Knowledge Graph, Wikipedia, Wikidata, schemas

## 🤖 IA(s) alvo
<!-- Em qual mecanismo de IA queremos ser citados? -->
- [ ] Google AI Overview / SGE
- [ ] ChatGPT (com browsing)
- [ ] Claude
- [ ] Perplexity
- [ ] Bing Copilot
- [ ] Outro:

## 📄 Página(s) / Conteúdo afetado
<!-- Liste as URLs, seções ou peças de conteúdo impactadas -->
-

## 🔍 Situação atual
<!-- Como o conteúdo aparece (ou não) em respostas de IA hoje? -->
- **Query testada:**
- **IA usada:**
- **Resultado:** Citado / Mencionado sem link / Não aparece
- **Concorrente(s) citado(s) em vez de nós:**

## 📈 Resultado esperado
<!-- O que esperamos após a otimização -->
-

## ✅ Critérios de Aceitação
- [ ] Conteúdo segue o checklist GEO abaixo
- [ ] Testado manualmente em pelo menos 1 IA (query + verificação de citação)
- [ ] Schema markup válido no Rich Results Test
- [ ] Conteúdo é crawlável (presente no HTML estático, não só no JS)

## 🔧 Tarefas
<!-- Quebre em sub-tarefas quando possível -->
- [ ]
- [ ]
- [ ]

## 🧪 Como verificar
<!-- Como testar se a otimização funcionou -->
1. Pesquisar "[query relevante]" em ChatGPT / Perplexity / Google AI Overview
2. Verificar se o site é citado ou linkado na resposta
3. Repetir com variações da query

## 💡 Contexto adicional
<!-- Hipóteses, referências, análise de concorrentes em IA, screenshots -->

## 📊 Checklist GEO (preencha o que for relevante)
<!-- Referência rápida — o que torna conteúdo "citável" por IAs -->

**Conteúdo citável:**
- [ ] Estatísticas originais com fonte clara
- [ ] Definições diretas e concisas (formato "X é Y que Z")
- [ ] Tabelas comparativas estruturadas
- [ ] Guias step-by-step com numeração
- [ ] Listas com critérios claros (top N, melhores X para Y)

**Autoridade & E-E-A-T:**
- [ ] Autor identificado com credenciais visíveis
- [ ] Quotes de especialistas atribuídos (nome + cargo)
- [ ] Links para fontes de autoridade (órgãos oficiais, estudos)
- [ ] Certificações / registros profissionais mencionados (ex.: Cadastur)
- [ ] Reviews e depoimentos reais de clientes

**Estrutura para extração:**
- [ ] Seção FAQ com `<details>` ou schema FAQPage
- [ ] Headings descritivos que respondem perguntas (ex.: "Quanto custa...")
- [ ] Schema JSON-LD relevante (Article, FAQPage, HowTo, LocalBusiness)
- [ ] Canonical e meta tags no HTML estático (acessível a crawlers de IA)

**Freshness:**
- [ ] Data de "Última atualização" visível na página
- [ ] `dateModified` no schema Article/WebPage
- [ ] Conteúdo revisado nos últimos 6 meses

**Entity SEO:**
- [ ] Marca presente no Google Knowledge Panel
- [ ] Schema Organization com sameAs (redes sociais, Wikidata)
- [ ] Dados consistentes entre Google Business Profile, site e diretórios

---
> **Para o Codex:** GEO depende de conteúdo acessível no HTML estático. Sempre verifique com `curl` se o conteúdo otimizado está no HTML servido, não apenas no DOM renderizado por JS. IAs fazem crawl do HTML cru.
