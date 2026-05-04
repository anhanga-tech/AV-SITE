# Revisão Editorial Consolidada — Blog Anhangá Viagens

**Data:** 2026-05-04
**Escopo:** 15 artigos `.mdx` em `content/blog/`
**Eixos analisados:** Factual · Coerência (interna + cross-article) · Semântica/SEO

---

## Sumário executivo

| Eixo | Achados Alta | Achados Média | Achados Baixa |
|---|---|---|---|
| Factual | 8 | 12 | 9 |
| Coerência | 0 | 7 | 12 |
| Semântica/SEO | 14 | 23 | 12 |

### Padrões sistêmicos detectados
1. **Tags vazias** em 7 de 15 artigos (Disney 5 segredos, Itália, Festivais, Malas, Maldivas, NY Natal — todos com `tags: []` ou apenas 1 tag).
2. **Ausência de H2 estruturador** em 8 artigos (usam apenas H3/H4).
3. **Tom "AI/listicle"** em artigos mais antigos: Maldivas, NY Natal, Itália, Festivais, Malas, Carnaval, Disney secrets.
4. **CTA Anhangá ausente ou fraco** em 6 artigos apesar de `chatCTADestination` configurado.
5. **Title >60 chars** em 5 artigos — risco de truncamento em SERPs.
6. **Excerpts truncados ou curtos** em 5 artigos.
7. **Carnaval 2026** já passou (estamos em mai/2026) — decisão editorial necessária (despublicar, marcar como histórico, ou repurpose para 2027).

### Top 3 artigos a refatorar primeiro
1. `destinos-carnaval-2026-brasil.mdx` — raso + temporalmente datado + tag inválida
2. `guia-definitivo-sobrevivencia-festivais.mdx` — genérico, sem destinos reais, sem dados Anhangá
3. `5-segredos-da-disney-que-ninguem-conta.mdx` — erro factual sobre Club 33 + tom clickbait + sem CTA

### Top 3 com maior força editorial (referência de voz)
1. `america-do-norte-destinos-alem-de-nova-york.mdx`
2. `asia-destinos-para-brasileiros-2026.mdx`
3. `melhores-destinos-brasil-2026.mdx`

---

## Por artigo (priorizado por severidade)

### 1. `destinos-carnaval-2026-brasil.mdx` — Score 4/10 — REFATORAR
**Problemas Alta:**
- Excerpt truncado ("trio el...")
- Tag `"malas"` não tem relação com o conteúdo → trocar por `["carnaval","brasil","salvador","rio","recife"]`
- Densidade rasa (2-3 frases por destino)
- Tom listicle/IA genérico ("Preços sobem rápido", "Os melhores lugares esgotam")
- Hierarquia mistura H2/H3 sem coerência
- **Datado:** Carnaval 2026 já ocorreu — repurpose para 2027 ou despublicar
**Problemas Média:**
- CTA em primeira pessoa ("Me diga") destoa de autor "equipe-anhanga"
- Cross-article: Florianópolis recomendada como "vibe leve" para Carnaval, mas o outro artigo (`melhores-destinos-brasil-2026`) avisa que jan/fev é pico de lotação. Alinhar.
- Cross-article: Ouro Preto aqui tem aviso de segurança noturna; em `melhores-destinos-brasil-2026` não. Alinhar tom.

---

### 2. `5-segredos-da-disney-que-ninguem-conta.mdx` — Score 6/10
**Problemas Alta (factual):**
- Linha ~57-59: Club 33 em Orlando descrito como "área escondida do Magic Kingdom". Errado: existem espaços nos quatro parques de Walt Disney World (e o original é em Disneyland/New Orleans Square).
- Frontmatter sem tags
- Sem H1/H2 — começa direto em H3
**Problemas Média:**
- Linha ~41: "Carousel of Progress entre Tomorrowland e Fantasyland" — fica dentro de Tomorrowland.
- Tom clickbait ("a sete chaves", "muda completamente o jogo", "Pouquíssima gente sabe")
- Item 5 (Club 33) frustra leitor ao prometer e negar
- Sem CTA Anhangá

---

### 3. `guia-definitivo-sobrevivencia-festivais.mdx` — Score 5/10 — REFATORAR
**Problemas Alta:**
- Tom coach/IA: "uma maratona de música, movimento, emoções e descobertas", "Isso acontece MUITO" (caps lock)
- Não nomeia nenhum festival real (Lollapalooza, Rock in Rio, The Town) apesar da Anhangá ter landing dedicada de Lollapalooza
- Title 80+ chars; tags vazias; excerpt 109 chars
- Apenas H3, sem H2 estruturador

---

### 4. `disney-tropical-americas-animal-kingdom.mdx` — Score 7/10
**Problemas Alta (factual):**
- Tropical Americas substituirá **DinoLand U.S.A.**, NÃO a Maharajah Jungle Trek (que fica em Asia e permanece). Erro factual + contradição interna geográfica (texto diz "perto do Discovery Island" mas cita atração de outra área).
**Problemas Média:**
- H3 como seções principais (sem H2)
- "Essa atração sozinha já justifica a viagem" — afirmação forte sobre algo que abre em 2027

---

### 5. `america-do-norte-destinos-alem-de-nova-york.mdx` — Score 8/10
**Problemas Alta (factual):**
- Linha 40: Boston listada como sede da Copa 2026. **Boston não é sede** — a sede é o Gillette Stadium em Foxborough/MA. Sedes confirmadas a considerar: Atlanta, Houston, Filadélfia, Kansas City, San Francisco/Bay Area, Seattle. NY tecnicamente é MetLife/East Rutherford NJ.
- Title 65 chars (acima do ideal)
**Problemas Média:**
- "cats cafés" em Key West → erro tipográfico + Key West é conhecida por gatos polidáctilos da Casa de Hemingway, não cat cafés
- "Visto para o México" — atualizar regras 2026
- Cross-article (México): regras incompletas vs `caribe-...` — padronizar (visto americano em escala via EUA + 180 dias para isenção)
**Problemas Baixa:**
- Tese "além de NY" mas recomenda "NY+Orlando como dupla clássica" — atrito de premissa

---

### 6. `asia-destinos-para-brasileiros-2026.mdx` — Score 8/10
**Problemas Alta (factual):**
- Linha 69: China — "isenção de até 15 dias" para brasileiros. **Errado:** desde nov/2024 são **30 dias**.
- Title 81 chars
**Problemas Média (factual):**
- Tailândia: "30 dias" → desde jul/2024 são **60 dias** para brasileiros.
- Indonésia VoA: confirmar redação (IDR 500.000 ≈ US$ 35).
**Problemas Média (coerência interna):**
- Tempo de voo SP-Tóquio aparece como "18-22h" em uma seção e "24h" em outra. Padronizar (realista: 22-26h com escala).
- "electrizante" → "eletrizante"
- "Como planejar" usa **bold** onde devia ser H3

---

### 7. `caribe-destinos-para-brasileiros.mdx` — Score 8/10
**Problemas Alta (factual):**
- "Voo direto SP-Punta Cana ~8h" — real é **6h30-7h30**
- "Cidade-coral de Cozumel" — Cozumel é **ilha**
- "Cidade subterrânea de Tulum" — Tulum é cidade maia costeira em ruínas; "subterrânea" cabe a cenotes
- Yucatán/Cancún citado como "América Central" — é **América do Norte**
- "Voo direto SP-Aruba ~6h30" — duração real é **7h30-8h** (~6.000 km)
**Problemas Alta (tom):**
- "qual faz mais sentido pra o que você tá buscando" — coloquial demais
**Problemas Média:**
- "barriga de turista" como ponto de atenção é informal
- Cross-article (México): regra de visto incompleta (sem prazo de 180 dias)

---

### 8. `roteiro-europa-brasileiros-2026.mdx` — Score 8/10
**Problemas Alta:**
- "EES entrou em operação integral em abril de 2026" — **verificar cronograma oficial UE atualizado**
- Title 76 chars
**Problemas Média:**
- ETIAS: confirmar custo (€7 vs discussão de €20) e janela de entrada em vigor
- "voos diretos de São Paulo e Lisboa" — provável typo ("São Paulo para Lisboa")
- "saí mais barato" → **sai** (sem acento)
- "em vez de só passou por eles" → "em vez de só ter passado por eles"

---

### 9. `viagem-solo-feminina-...norwegian.mdx` — Score 7/10
**Problemas Alta (factual + coerência):**
- Roteiro vendido como "Norte da Europa e **Fiordes Noruegueses**", mas paradas listadas (Hamburgo, IJmuiden, Tilbury, Zeebrugge, Southampton) **não tocam a Noruega**. Induz cliente a erro.
- Title 73 chars; slug muito longo
- Excerpt truncado ("embarcar sem ...")
- H2/H3 colados sem linha em branco — pode quebrar parser MDX
**Problemas Baixa:**
- "450 metros de areia branca" em Great Stirrup Cay — verificar (a ilha tem ~3,2 km)
- Tag única `["cruzeiros"]` — expandir

---

### 10. `lua-de-mel-nas-maldivas.mdx` — Score 6/10
**Problemas Alta (tom):**
- "tira o fôlego a cada segundo", "memórias eternas", "os filhos e netos", "pôr do sol mais lindo da sua vida" — Pinterest/IA
- Tags vazias em artigo de altíssimo valor comercial → `["maldivas","lua-de-mel","romance","luxo"]`
**Problemas Média (coerência interna):**
- Faixa "Econômico US$ 8-12k" não bate com hospedagem listada (resorts 5★ a partir de US$ 600/noite × 7 = US$ 4.200 só de hotel + voos = US$ 8k é tight). Sugestão: incluir resorts 4★ reais OU subir faixa "econômica" para US$ 10-14k.
- Soneva Jani frequentemente >US$ 2.500/noite — faixa "1500+" subdimensiona
- Apenas H3, sem H2
- CTA emocional sem chamada explícita à Anhangá

---

### 11. `nova-york-no-natal.mdx` — Score 6/10
**Problemas Alta (tom):**
- Abertura clichê hollywoodiana ("cheiro de castanhas misturado com chocolate quente", "te faz acreditar em magia novamente")
- "a Central Park" (feminino) — em pt-BR é **o Central Park**. Inconsistente no próprio texto.
- Tags vazias
**Problemas Média (coerência interna):**
- Excerpt promete "patinar no Central Park" mas o roteiro cita Rockefeller e Bryant Park. Alinhar (mencionar Wollman Rink no Central Park OU corrigir excerpt).
- Century 21 (linha ~89): a loja icônica do Lower Manhattan **fechou em 2020**; reabriu loja menor em Battery Park em 2023. Verificar se ainda faz sentido como dica.
- Sem H2; sem CTA Anhangá
- Date 2025-01-10 vs dateModified 2026-04-25 — artigo de Natal escrito em janeiro?

---

### 12. `europa-gastronomica-roteiro-italia.mdx` — Score 6/10
**Problemas Alta (factual):**
- "Fettuccine Alfredo não existe na Itália, foi criado para turistas americanos." **Parcialmente errado:** o prato foi criado em Roma por Alfredo di Lelio (1907/1914) e existe nos restaurantes Alfredo até hoje. O que é americano é a versão com **creme de leite**. Reescrever.
- Tags vazias
- Tom "AI gourmet" ("explodem na boca", "memórias afetivas", "respeito ao produto")
**Problemas Média:**
- Title 33 chars + excerpt 75 chars (subdimensionados)
- Sem H2 agrupando o roteiro
- Sem CTA explícito
- Cross-article: artigo de Itália não dá referência de orçamento; deveria linkar para `roteiro-europa-brasileiros-2026` (que tem câmbio + custo/dia)

---

### 13. `melhores-destinos-brasil-2026.mdx` — Score 8/10
**Problemas Média:**
- Hierarquia inconsistente: Fortaleza usa bullet aninhado para Jericoacoara; outros destinos viram **bold** inline. Padronizar (H3 ou bullets uniformes).
- "Fortaleza fica a mais de 800 km dali" — frase ambígua dentro do parágrafo de Lençóis. Reescrever.
- Excerpt 116 chars (curto)
**Problemas Baixa:**
- Tatio (Atacama): "5°C ao amanhecer" → realista é 0°C a -10°C a 4.300m

---

### 14. `destinos-america-do-sul-latam.mdx` — Score 8/10
**Problemas Média:**
- Peru: "brasileiros precisam de passaporte" → na verdade **podem entrar com RG** (Mercosul). Reescrever.
- Excerpt 116 chars
- Sem H3 dentro dos países

---

### 15. `malas-de-mao-o-guia-definitivo.mdx` — Score 6/10
**Problemas Alta (tom):**
- "Liberdade Começa na Bagagem", "Viajar com mala de mão é uma mentalidade" — copy motivacional
- Tags vazias
**Problemas Média (factual):**
- Linha 23: "Ryanair e EasyJet (40×20×25cm)" — combina duas companhias em uma dimensão errada. Correto: Ryanair pessoal **40×25×20**, EasyJet pessoal **45×36×20**. Separar.
- Title 33 chars, excerpt 75 chars
- Sem H2; sem CTA Anhangá

---

## Cross-article — recomendações de alinhamento

### México (Cancún, Yucatán, CDMX)
Artigos: `caribe-destinos-para-brasileiros`, `america-do-norte-destinos-alem-de-nova-york`
- Padronizar regra de visto: brasileiro precisa de visto, **exceto** com visto válido EUA/Canadá/Japão/Schengen/UK (até 180 dias). Se voo tem escala nos EUA, **visto americano obrigatório** mesmo para destino mexicano.
- Adicionar link interno entre os dois artigos.

### Orlando / Disney
Artigos: `5-segredos-da-disney`, `disney-tropical-americas-animal-kingdom`, `america-do-norte-destinos-alem-de-nova-york`
- Decidir posicionamento Anhangá: apoia "NY+Orlando clássico" ou empurra para alternativas? Hoje os artigos sinalizam ambos.

### Florianópolis / Carnaval
Artigos: `destinos-carnaval-2026-brasil`, `melhores-destinos-brasil-2026`
- Alinhar expectativa de lotação em fevereiro.

### Ouro Preto
Artigos: `destinos-carnaval-2026-brasil`, `melhores-destinos-brasil-2026`
- Alinhar tom sobre segurança noturna.

### Itália gastronômica ↔ Europa 2026
- Adicionar link de Itália → guia Europa 2026 para referência de orçamento.

---

## Plano de ação sugerido (em 4 sprints)

### Sprint 1 — Correções factuais críticas (1 dia)
- [ ] Corrigir Club 33 em `5-segredos-da-disney`
- [ ] Corrigir Boston/sedes Copa em `america-do-norte`
- [ ] Atualizar isenção China (30d) e Tailândia (60d) em `asia-destinos`
- [ ] Corrigir Cozumel/Tulum/Yucatán/voo Punta Cana em `caribe-destinos`
- [ ] Corrigir Tropical Americas/DinoLand em `disney-tropical-americas`
- [ ] Reescrever fettuccine Alfredo em `europa-gastronomica-roteiro-italia`
- [ ] Corrigir Peru/RG em `destinos-america-do-sul-latam`
- [ ] Corrigir/remover roteiro "Fiordes" em `viagem-solo-feminina`
- [ ] Verificar EES/ETIAS em `roteiro-europa-brasileiros-2026`

### Sprint 2 — Decisões editoriais sobre conteúdo datado (0,5 dia)
- [ ] Decidir `destinos-carnaval-2026-brasil`: despublicar, marcar histórico, ou repurpose 2027
- [ ] Atualizar Century 21 em `nova-york-no-natal`
- [ ] Verificar voos Gol Aruba e preços NCL ainda vigentes

### Sprint 3 — SEO básico (1 dia)
- [ ] Preencher tags em todos os artigos com array vazio (7 artigos)
- [ ] Encurtar titles >60 chars (5 artigos)
- [ ] Reescrever excerpts truncados/curtos (5 artigos)
- [ ] Adicionar H2 estruturadores nos 8 artigos que só usam H3/H4

### Sprint 4 — Voz Anhangá + CTAs (2-3 dias)
- [ ] Reescrever tom dos 7 artigos com clichê IA/listicle (priorizar Maldivas, NY Natal, Itália, Festivais, Disney secrets, Malas, Carnaval)
- [ ] Adicionar CTA Anhangá explícito nos 6 artigos sem chamada
- [ ] Padronizar primeira pessoa (sempre "a equipe da Anhangá", nunca "eu")
- [ ] Implementar links internos cross-article (México, Itália↔Europa, Disney)

---

*Relatório gerado por revisão multi-agente: factual + coerência + semântica/SEO.*
