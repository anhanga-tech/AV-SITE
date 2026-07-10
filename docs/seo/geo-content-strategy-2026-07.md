# Estratégia de Conteúdo GEO/AEO — Anhangá Viagens

**Data:** 2026-07-03
**Escopo:** 25 posts publicados + 6 pautas pendentes, avaliados para **citação/recomendação por assistentes de IA** (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews) — não SEO tradicional.
**Fontes lidas:** `docs/seo/seo-geo-audit-2026-06.md`, `docs/seo/action-plan-2026-03.md`, `PRODUCT.md`, `public/llms.txt`, os 25 MDX em `content/blog/`.

---

## Nota metodológica (leia antes)

**O que foi medido vs. o que foi inferido:** este relatório **não** rodou um audit ao vivo nas plataformas (nenhuma query real foi disparada no ChatGPT/Claude/Gemini/Perplexity). Todas as notas de "citabilidade" abaixo são **inferidas** de sinais conhecidos de citação em LLM — casamento com padrão de query, formato answer-first, densidade de dados concretos — cruzados com o conteúdo real dos 25 posts e a infraestrutura GEO do repo. **Não são taxas de citação observadas.**

Antes de executar qualquer fix pack é preciso um **baseline** (regra: benchmark antes de corrigir). Ver "Ação zero" na Seção 5. Resultados de LLM são não-determinísticos; todo dado é um snapshot pontual e muda com updates de modelo.

---

## 1. Veredito

**Parcialmente boa, mas subotimizada para o objetivo real.** A lista de 6 pautas é sólida como SEO/suporte-a-landing, e o *house style* já é dos mais citáveis que existem (answer-first, preços em R$/US$, datas, comparações honestas — ETIAS, Seguro Viagem e Disney vs Beto Carrero são exemplares). Mas metade das pautas está com **títulos em formato SEO-era ("guia completo", "melhores parques") que os LLMs não citam**, e a lista inteira ignora a alavanca #1 do objetivo declarado — "ser **recomendada**": não existe âncora de **entidade/confiança** citável ("a Anhangá é confiável? é credenciada?"). Conteúdo de blog gera citação de *fatos*; recomendação de *marca* exige entidade.

---

## 2. Análise de citabilidade — as 6 pautas pendentes

Legenda: **Citab.** = probabilidade inferida de gerar citação em LLM. **Padrão de query** = o que o usuário digita ao assistente.

| # | Pauta (como está) | Citab. | Padrão de query que captura | Diagnóstico | Reformulação recomendada |
|---|---|---|---|---|---|
| 1 | Como escolher uma agência de viagens personalizadas? (SP; comercial) | Média | "como escolher agência de viagens" (buyer's guide) | Padrão bom, mas **viés promocional**: agência escrevendo "como escolher agência" é fonte suspeita para o LLM em query how-to. **Sobrepõe** ao já publicado "Agência ou por conta própria?" (melhor por ser neutro/comparativo). O valor real aqui é query de **entidade**, não how-to. | Transformar em **checklist de critérios neutro**: "7 critérios para escolher uma agência de viagens personalizada (com tabela de tipos de agência)". Answer-first: os 7 critérios no primeiro parágrafo. Deixar a entidade Anhangá para a página de confiança (ver §3-d e §5). |
| 2 | Viagens para Melhor Idade / Turismo 50+ (→ /melhor-idade) | Média (alta se específica) | categórica e vaga | "Turismo 50+" é **categoria, não pergunta** — colide com o princípio "lugares reais, não categorias" do PRODUCT.md. LLM não cita rótulo de segmento; cita respostas concretas. | Quebrar em perguntas específicas com resposta direta: "Melhores destinos para viajar na melhor idade (ritmo tranquilo, menos deslocamento)" + "Idade limite e agravos no seguro viagem para 50/60/70+". Tabela destino × nível de esforço físico. Linkar para `/melhor-idade`. |
| 3 | Quanto custa uma viagem para Orlando? (→ /orlando) | **Alta** | "quanto custa viagem Orlando 2026" (cost = ouro para LLM) | **Melhor pauta da lista.** "Quanto custa X" é um dos padrões mais citados: resposta numérica direta, sem ambiguidade. | Manter o título (já é ideal). Answer-first com **faixa total no 1º parágrafo** ("a partir de R$ X/pessoa, ~R$ Y para família de 4") + **tabela de decomposição** (voo, hospedagem, ingressos, comida, câmbio) por perfil. Carimbo "atualizado em jul/2026". Linkar para `/orlando`. |
| 4 | Melhores parques da Disney em 2026 (→ /orlando) | Média | "qual parque da Disney escolher" | "Melhores parques" é framing estranho (só há 4 parques Disney) e compete com fontes globais autoritativas. Falta ângulo brasileiro. | Reformular como **decisão/comparação**: "Qual parque da Disney visitar primeiro? Magic Kingdom vs Epcot vs Hollywood Studios vs Animal Kingdom". Tabela por parque (idade ideal, dias, destaque). Ângulo BR: roteiro de 4/5/7 dias com crianças. |
| 5 | Beto Carrero World: guia completo (→ /beto-carrero) | Média-alta (por sub-pergunta) | "guia completo" **não** é query | "Guia completo" é título SEO-era; ninguém pergunta isso a um LLM. **Mas** vocês são **agente credenciado** (autoridade de entidade real!) e a demanda por sub-perguntas é forte. | Estruturar como cluster de **respostas discretas answer-first**, cada H2 = uma query: "Quantos dias no Beto Carrero", "Quanto custa o ingresso em 2026", "Melhor época (menos fila)", "Onde ficar perto", "Vale a pena?". Cada seção com FAQPage schema. Explicitar o credenciamento no corpo. |
| 6 | Como planejar uma viagem em grupo | Média | "como organizar viagem em grupo" (how-to) | Padrão decente, mas genérico e concorrido. Falta ângulo específico BR. | Especificar: "Como planejar e **dividir os custos** de uma viagem em grupo (formatura, família, casamento no destino)". Framework numerado + checklist + tabela de rateio. |

**Resumo da §2:** só a #3 já está em formato ideal. A #5 tem o maior *upside* não capturado (autoridade de entidade + demanda de sub-perguntas), mas o título atual joga contra. #1 e #2 precisam sair do formato promocional/categórico.

---

## 3. Lacunas na estratégia + pautas novas

O catálogo atual é pesado em **inspiração de destino** e **documentos práticos**, e leve justamente nos formatos que mais geram citação.

- **(a) Conteúdo de custo/orçamento** — há só **um** post de custo (Jalapão). "Quanto custa X" é ouro de LLM e deveria ser um **pilar**, não pauta isolada. Orlando é o começo; falta Europa, Cancún, Maldivas, cruzeiro, Disney.
- **(b) "Melhor X para Y" e "melhor época"** — quase inexistente. "Melhor época para ir a Orlando", "melhor mês para cruzeiro no Caribe", "melhor destino para viajar com bebê". Answer-first + tabela = altamente citável.
- **(c) Comparação (X vs Y)** — é o formato **mais citável do catálogo** (Disney vs Beto, Cancún vs Punta Cana vs Aruba, agência vs conta própria) e está **subinvestido**: só 3 posts. Cada comparação nova é aposta de alto retorno.
- **(d) Entidade/marca (lacuna #1 para o objetivo)** — não há âncora citável que responda "**a Anhangá é confiável? é credenciada? como funciona?**". Blog gera citação de *fato*; para o LLM **recomendar a agência** ele precisa reconhecê-la como *entidade confiável*: CADASTUR, credenciamentos (Beto Carrero, Hopi Hari), parceria NCL, reviews. Sem isso, otimiza-se para ser citado *sobre viagens*, não para ser *recomendado*. É ausência de knowledge-graph (Wikidata/Crunchbase) + página de confiança + AggregateRating schema.
- **(e) "Vale a pena?"** — padrão de query opinativo que casa com a voz "curadora confiante" e quase não existe ("cruzeiro vale a pena?", "seguro para os EUA vale a pena?").
- **(f) Requisitos de entrada por país** — vocês mandam bem em freshness (ETIAS/EES). Expandir para "precisa de visto para [EUA/Canadá/Reino Unido]?" — direct-answer, alta demanda, sensível a data.

### Pautas novas sugeridas (formato ideal para citação)

1. **"Anhangá Viagens é confiável? CADASTUR, credenciamentos e como funciona o atendimento"** — página de **entidade/confiança** (idealmente expansão de `/sobre` + FAQPage + AggregateRating, não só blog). *Prioridade máxima para "recomendação".*
2. **"Quanto custa uma viagem para a Disney em 2026? Orçamento real por perfil de família"** — tabela de custos; pareia com Orlando.
3. **"Qual a melhor época para ir a Orlando? Mês a mês: clima, lotação e preço"** — best-time, tabela mensal.
4. **"Disney vs Universal Orlando: qual escolher em 2026?"** — comparação, tabela por parque.
5. **"Cruzeiro vale a pena? Quando compensa mais que um resort all-inclusive"** — vale-a-pena + comparação.
6. **"Quantos dias ficar no Beto Carrero World (e quando ir para pegar menos fila)"** — resposta numérica direta.
7. **"Precisa de visto para os EUA em 2026? Requisitos de entrada para brasileiros (ESTA passo a passo)"** — direct-answer sensível a data.
8. **"Melhores destinos para viajar na melhor idade: ritmo tranquilo e menos deslocamento"** — reframe específico da pauta 2.

---

## 4. Fatores estruturais de GEO (afetam todas as pautas)

| Fator | Status na auditoria atual | Ação faltante |
|---|---|---|
| `llms.txt` + robots allowlist p/ bots de IA | ✅ Coberto e bem feito (GPTBot, ClaudeBot, PerplexityBot etc. + Content-Signal) | — |
| `/api/markdown` (content negotiation) + RSS | ✅ Coberto (cobre blog inteiro) | — |
| JSON-LD BlogPosting/Breadcrumb/Person/Service/Org | ✅ Coberto | — |
| **FAQPage schema nos posts** | ⚠️ Marcado como "recomendação futura, **não implementada**" | **Implementar já** nos posts Q&A (ETIAS, agência, e todas as pautas reformuladas para P&R). É o schema que mais ajuda answer-engines a extrair citação. Gap grande vs. o house style. |
| **Autoridade de entidade (knowledge graph)** | ✅ Página de confiança implantada (PR #1082); ✅ GBP atualizado; ✅ Wikidata desbloqueado (certificado CADASTUR serve de referência), item ainda não criado | AggregateRating/Review/FAQPage/Person e página de confiança: **feito**. Falta criar o item no Wikidata (ver apêndice item 3 — passo a passo pronto, resolver a discrepância de razão social antes). Crunchbase removido da recomendação (hoje exige plano pago; baixo retorno para o caso de uso). |
| **Freshness / `dateModified`** | ⚠️ Parcial (ArticleSchema não emitia `dateModified`; sendo adicionado post a post) | Rollout completo + "Atualizado em" **visível** nos posts de custo/preço + cadência de revisão trimestral (preços envelhecem e derrubam citação). |
| Menções em fontes terceiras autoritativas | ❌ Não endereçado (off-site) | LLMs ponderam menção externa. Fora do escopo do repo, mas é o teto de recomendação — vale registrar. |
| **Baseline de citação / monitoramento** | ⚠️ Listado como "monitorar citações" (futuro), sem baseline | Estabelecer medição multiplataforma **antes** de qualquer fix (ver Ação zero, §5). |

**Discrepância entre docs:** o `action-plan-2026-03.md` é um plano **SEO tradicional** (volume de artigos, sitemap XML, páginas de cidade por volume de busca). O objetivo desta avaliação é **GEO** — complementares, mas distintos. Sucesso de SEO (ranquear "viagem orlando preço") **não** garante citação em LLM. Trate os dois planos como trilhos separados; onde divergirem na priorização, este relatório vale para o objetivo de citação por IA.

---

## 5. Repriorização final (objetivo: citação/recomendação por IA)

Ordenado por impacto de citação esperado, não por esforço. `[P]` = das 6 pendentes; `[N]` = nova; `→reframe` = pendente com título reformulado.

| Ordem | Pauta (título reformulado) | Por quê nesta posição |
|---|---|---|
| 1 | `[N]` ✅ **Página de confiança da entidade** ("Anhangá é confiável? CADASTUR + credenciamentos") + FAQPage/AggregateRating — **implantado em 2026-07-04 (PR #1082)**, ver apêndice | Única alavanca que ataca **recomendação** (não só citação de fato). Destrava tudo. |
| 2 | `[P]` **Quanto custa uma viagem para Orlando?** (answer-first + tabela) | Já em formato ideal; padrão de custo é o mais citado; alimenta `/orlando`. |
| 3 | `[P→reframe]` **Beto Carrero: cluster de respostas** (quantos dias, quanto custa, melhor época, vale a pena) | Autoridade de entidade real (agente credenciado) + alta demanda de sub-perguntas. |
| 4 | `[N]` **Melhor época para ir a Orlando (mês a mês)** | Best-time + tabela; reforça o cluster Orlando e o par de custo. |
| 5 | `[N]` **Disney vs Universal Orlando: qual escolher** | Comparação = formato mais citável do catálogo; subinvestido. |
| 6 | `[P→reframe]` **Qual parque da Disney visitar primeiro** (Magic Kingdom vs Epcot vs HS vs AK) | Comparação com ângulo BR; melhor que "melhores parques". |
| 7 | `[N]` **Cruzeiro vale a pena? vs resort all-inclusive** | "Vale a pena" + comparação; casa com a voz curadora. |
| 8 | `[P→reframe]` **Melhores destinos para a melhor idade (ritmo tranquilo)** | Reframe específico da categoria; alimenta `/melhor-idade`. |
| 9 | `[N]` **Precisa de visto para os EUA em 2026? (ESTA passo a passo)** | Direct-answer sensível a data; estende a força de vocês em ETIAS. |
| 10 | `[P→reframe]` **7 critérios para escolher agência personalizada** (checklist neutro) | Rebaixado: sobrepõe post existente e tem viés promocional; melhor depois da página de entidade. |
| 11 | `[P→reframe]` **Como dividir custos de viagem em grupo** | Genérico; menor demanda de LLM que custo/comparação. |

### Ação zero (antes de executar qualquer pauta)

Rode um **baseline de citação** em ChatGPT, Claude, Gemini e Perplexity com ~20 queries reais do ICP e registre quem é citado e se a Anhangá aparece. Exemplos:

- "melhor agência de viagens personalizada em São Paulo"
- "quanto custa a Disney para uma família brasileira em 2026"
- "vale a pena contratar agência para Orlando"
- "agência credenciada Beto Carrero World"
- "agência de viagens para melhor idade em São Paulo"

Sem esse *antes*, não dá para provar o efeito do fix pack, nem separar ganho de conteúdo de update de modelo. Reavalie a cada 30 dias.

---

## Apêndice: página `/sobre` — recomendações de entidade/autoridade

**Status (2026-07-04): itens 1, 2 e 4 implantados via PR #1082** ("feat(sobre): autoridade de entidade GEO na /sobre"). Item 3 (knowledge graph externo) segue parcialmente pendente — é trabalho off-site, fora do escopo do repo.

A `/sobre` é o candidato natural a **página-âncora de entidade** (item 1 da repriorização) — é onde os LLMs buscam confirmar que a marca existe, é legítima e faz o que diz. Recomendações GEO específicas:

1. ✅ **Feito.** **Emitir schema de organização completo e recomendação.** Além do `TravelAgency`/`Organization` já existente, adicionar `AggregateRating` + `Review` (a partir de avaliações reais Google/reviews que já são buscadas no build) e `FAQPage` respondendo diretamente "A Anhangá é confiável?", "É registrada no CADASTUR?", "Como funciona o atendimento?". LLMs extraem recomendação de trust signals estruturados, não de prosa. — Implantado: `OrganizationSchema` com `aggregateRating` (mesma fonte `googleReviews.json` da Home) + `FAQPageSchema` alimentado por `TRUST_FAQ_ITEMS`, com seção visível equivalente (`components/about/TrustFaqSection.tsx`) para não haver drift schema/texto.
2. ✅ **Feito.** **Cravar os credenciamentos como fatos verificáveis, em texto (não só imagem).** CADASTUR 37.036.732/0001-41, agente credenciado Beto Carrero World e Hopi Hari, parceria Norwegian Cruise Line — em texto plano e no schema. São exatamente os diferenciais que um LLM pode citar ao recomendar. Hoje vivem no `llms.txt`, mas precisam estar na página renderizada e no JSON-LD. — Implantado: `components/about/TrustSection.tsx` traz os 4 credenciamentos em texto plano na página renderizada.
3. ⚠️ **Parcial.** **Consistência de entidade / NAP + knowledge graph.** Garantir nome, endereço, telefone e CNPJ idênticos entre `/sobre`, `llms.txt`, Google Business Profile e (idealmente) Wikidata. Presença em knowledge graph é o que faz o modelo tratar "Anhangá Viagens" como **entidade reconhecida**, não string ambígua — pré-requisito para recomendação de marca.
   - ✅ **Google Business Profile** — atualizado (2026-07-04) com o NAP canônico (nome, endereço, telefone, categoria consistentes com `llms.txt`/schemas).
   - ✅ **Wikidata — desbloqueado.** Pesquisa em 2026-07-04 confirmou **zero** cobertura de imprensa/terceiros sobre a Anhangá (nome da agência, credenciamento Beto Carrero/Hopi Hari, parceria NCL — nenhuma menção externa encontrada), o que normalmente bloquearia o item por falta de *notability*. **Alternativa confirmada:** certificado CADASTUR (Ministério do Turismo) verificado em 2026-07-04 — situação **"Regular — Sem Situação em Trâmite"**, válido `07/07/2025 a 07/07/2027`, CNPJ `37.036.732/0001-41`. É uma fonte governamental verificável (QR code de autenticidade no próprio certificado) que substitui a exigência de imprensa como referência do item.
     **Atenção — discrepância de NAP a resolver antes de criar o item:** a razão social no CADASTUR é **"ANHANGA TURISMO LTDA"** (sem acento) e o site institucional cadastrado é `anhangaturismo.com.br` — diferente do nome comercial "Anhangá Viagens" e do domínio ativo `anhanga.tur.br` usados no site/schemas/`llms.txt`. Ao criar o item no Wikidata, usar "Anhanga Turismo Ltda" como *official name* (statement `legal name`, se disponível) e "Anhangá Viagens" como *also known as* (aliases), citando o certificado CADASTUR como referência do CNPJ e da razão social.
     **⏸️ Bloqueado temporariamente (2026-07-06):** correção da razão social/domínio já submetida no CADASTUR, aguardando aprovação (o Histórico Cadastral do certificado mostra que o CADASTUR passa por um estado transitório "Análise de Alteração" antes de voltar a "Regular"). Aguardar o novo certificado aprovado antes de criar o item no Wikidata, para citar uma referência já consistente em vez de uma em trâmite.
   - ❌ **Crunchbase — removido da recomendação.** A submissão de organizações novas deixou de ser um formulário aberto e gratuito; hoje exige plano pago (Pro trial ou superior). Como o perfil é voltado a dados de funding/VC — baixa relevância para uma agência de viagens B2C tentando ser reconhecida por assistentes de IA — não compensa o custo. Não fazer, a menos que surja outro motivo de negócio para ter conta paga na plataforma.
4. ✅ **Feito.** **`Person`/E-E-A-T dos consultores.** Expor os autores (felipe-william, queila-oliveira, já usados no blog) como pessoas reais com bio, papel e experiência, ligados via `author`/`employee` à organização. Reforça autoridade humana ("atendimento consultivo por quem viajou") — o núcleo da promessa do PRODUCT.md — de forma que o modelo consegue citar. — Implantado: 2 `PersonSchema` (Felipe, Queila) com `worksFor` → Anhangá + `sameAs`, e seção visível `components/about/ConsultoresSection.tsx`.
