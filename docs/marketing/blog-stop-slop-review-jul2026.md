# Revisão anti-slop do blog — julho/2026

Revisão dos 29 posts em `content/blog/` sob a lente combinada das skills **stop-slop** (padrões de escrita de IA em geral) e **humanizer-pt-br** (marcadores de IA específicos do português). **Relatório apenas — nenhum arquivo foi editado.**

Cada post recebeu nota de 1 a 10 em cinco dimensões (total /50): Diretividade, Ritmo, Confiança no leitor, Autenticidade e Precisão (densidade). Corte de referência: abaixo de 35/50 pede revisão.

> Observação importante: **o blog está, no geral, muito acima da média de conteúdo de agência.** A maioria dos posts é concreta, com números reais, segunda pessoa e voz. Os problemas encontrados são majoritariamente **sistêmicos e mecânicos** (mesmos 4–5 tells repetidos em vários posts), não falência de escrita. Corrigi-los é higiene, não reescrita.

---

## 1. Padrões sistêmicos (as correções de maior alavancagem)

Esses cinco padrões aparecem em vários posts. Resolver via find-and-replace/checklist rende mais que revisar post a post.

### 1.1 Headings em Title Case (o problema #1)
Em português a norma é capitalizar só a primeira palavra e nomes próprios. Vários posts capitalizam todas as palavras principais do título/heading — um marcador forte de IA em pt-BR (humanizer #17). Os posts da **queila-oliveira** e alguns da **felipe-william** têm isso; os posts de destino da felipe já usam sentence case (bom — é o padrão a seguir).

Exemplos: `Por Que as Maldivas São o Destino Perfeito Para Lua de Mel`, `O Que Levar na Mala`, `Roteiro de 10 Dias: Do Norte ao Sul Italiano`, `Em Quais Países o Seguro Viagem É Obrigatório?`, `Quando Ir: Escolhendo a Época Perfeita`.

**Ação:** padronizar TODOS os headings (e títulos onde couber) para sentence case. É a correção de maior impacto e menor risco.

### 1.2 Travessão (—) usado como pontuação de efeito
Uso acima do natural para português (humanizer #13, stop-slop "no em dashes"). Aparece em quase todos os posts, com frequência maior nos blocos de FAQ. Muitos podem virar vírgula, ponto ou parênteses sem perda.

Exemplos: `criado por Walt Disney — o original`, `Chile — nenhum dos dois exige`, `O prato original — o famoso fettuccine`, `decisões — visto, escolha de parques, hospedagem`.

**Ação:** varredura de `—` no corpo dos posts, convertendo a maioria para vírgula/ponto.

### 1.3 Listas com rótulo em negrito + dois-pontos
Padrão `- **Rótulo:** texto` (humanizer #15). É a estrutura mais recorrente do blog. Em guias escaneáveis isso é **defensável** como recurso de leitura — mas vira tique quando usado em bloco (`**Para quem é:** / **O que entrega:** / **O que não entrega:**`). O caso extremo é `destinos-carnaval` (todo o corpo é bullet com rótulo em negrito) e `guia-festivais`.

**Ação:** manter onde é tabela-disfarçada real; converter em prosa onde o rótulo não agrega (ex.: `**Proteção:** Capa de chuva...` → frase corrida). Não erradicar cegamente.

### 1.4 Setups retóricos e "revelação" encenada
Pergunta que se responde sozinha, fragmento dramático, gancho de importância (stop-slop "rhetorical setups"; humanizer #19).

Exemplos: `você vai gastar uma fortuna em água, certo? Errado.` (5-segredos), `A verdade?` (europa-italia, malas-de-mao), `Por que ninguém conta?` (5-segredos), `Sério.` / `Impossível descrever.` (europa-italia), `Sim, ela existe.` (copa), `Isso não é detalhe. É o centro da decisão.` (disney-ou-beto), heading `Por que isso importa para quem viaja a Orlando` (tropical-americas).

**Ação:** cortar o setup e ir direto ao fato.

### 1.5 Linguagem promocional / de folder + regra dos três
Adjetivos de folheto turístico (humanizer #3) e grupos de três forçados (#11). Concentrados nos posts mais "brochure": `europa-gastronomica`, `viagem-solo-norwegian`, `lua-de-mel-maldivas`, `guia-festivais`.

Exemplos: `Paraíso dos Amantes da Gastronomia`, `algo extraordinário`, `Destino Perfeito`, `conexões genuínas... de forma orgânica e sem pressão`, `centros históricos encantadores, gastronomia flexível e rituais de spa`, `a época mais mágica do ano`.

**Ação:** trocar adjetivo vazio por fato concreto; quebrar tríades em dois ou quatro itens.

### Tells menores recorrentes
- **Aberturas "throat-clearing":** `Aqui vai...` / `Aqui está...` (agencia, caribe, america-sul, 5-segredos). Cortar e ir ao ponto.
- **Advérbios de ênfase:** `realmente`, `honestamente`, `particularmente` (varridos por stop-slop). Baixa frequência — bom sinal.
- **Extremos vagos em títulos:** `que Ninguém Conta`, `ninguém fala`, `que ninguém coloca` — clickbait leve, às vezes contradito pelo próprio corpo.
- **Metáfora "janela" repetida:** `a janela está fechando` / `a janela ainda existe` (ferias-julho, jalapao) — cliché entre posts.

---

## 2. Placar (ordenado por nota)

Dimensões (1-10): **Dir** = Diretividade · **Rit** = Ritmo · **Conf** = Confiança no leitor · **Aut** = Autenticidade · **Pre** = Precisão/densidade.

| # | Post | Autor | Dir | Rit | Conf | Aut | Pre | /50 | Faixa |
|---|------|-------|:---:|:---:|:----:|:---:|:---:|:---:|-------|
| 1 | quanto-custa-viagem-disney-2026 | felipe | 10 | 9 | 9 | 9 | 9 | **46** | Forte |
| 2 | roteiro-bonito-ms-5-dias | felipe | 10 | 9 | 9 | 9 | 8 | **45** | Forte |
| 3 | jalapao-julho-roteiro-custos | felipe | 9 | 9 | 9 | 9 | 8 | **44** | Forte |
| 4 | documentos-para-viajar-com-crianca | felipe | 10 | 8 | 9 | 8 | 9 | **44** | Forte |
| 5 | agencia-de-viagens-ou-por-conta-propria | queila | 9 | 9 | 9 | 9 | 7 | **43** | Forte |
| 6 | viagem-corporativa-pequenas-empresas | felipe | 9 | 9 | 9 | 8 | 8 | **43** | Forte |
| 7 | melhor-epoca-viajar-orlando | queila | 9 | 8 | 9 | 8 | 9 | **43** | Forte |
| 8 | cancun-punta-cana-aruba-lua-de-mel | felipe | 9 | 8 | 8 | 8 | 9 | **42** | Forte |
| 9 | como-planejar-viagem-orlando-sob-medida | felipe | 9 | 8 | 9 | 8 | 8 | **42** | Forte |
| 10 | destinos-america-do-sul-latam | felipe | 8 | 8 | 8 | 8 | 9 | **41** | Bom |
| 11 | melhores-destinos-brasil-2026 | queila | 8 | 8 | 8 | 9 | 8 | **41** | Bom |
| 12 | asia-destinos-para-brasileiros-2026 | felipe | 8 | 8 | 8 | 8 | 9 | **41** | Bom |
| 13 | america-do-norte-destinos-alem-de-nova-york | felipe | 8 | 8 | 8 | 8 | 9 | **41** | Bom |
| 14 | roteiro-europa-brasileiros-2026 | felipe | 8 | 8 | 8 | 8 | 8 | **40** | Bom |
| 15 | caribe-destinos-para-brasileiros | queila | 8 | 8 | 8 | 8 | 8 | **40** | Bom |
| 16 | copa-do-mundo-2026-cidades-sede | felipe | 8 | 7 | 8 | 8 | 9 | **40** | Bom |
| 17 | ferias-julho-2026-destinos | queila | 8 | 8 | 8 | 7 | 9 | **40** | Bom |
| 18 | disney-ou-beto-carrero | felipe | 8 | 7 | 8 | 8 | 8 | **39** | Bom |
| 19 | etias-2026-brasileiros-europa | felipe | 8 | 7 | 8 | 7 | 9 | **39** | Bom |
| 20 | disney-tropical-americas-animal-kingdom | queila | 8 | 7 | 7 | 8 | 8 | **38** | Ajustar |
| 21 | seguro-viagem-internacional-2026 | queila | 8 | 7 | 7 | 7 | 8 | **37** | Ajustar |
| 22 | 5-segredos-da-disney-que-ninguem-conta | queila | 7 | 7 | 7 | 8 | 7 | **36** | Ajustar |
| 23 | nova-york-no-natal | felipe | 7 | 7 | 7 | 7 | 8 | **36** | Ajustar |
| 24 | malas-de-mao-o-guia-definitivo | felipe | 7 | 7 | 7 | 7 | 8 | **36** | Ajustar |
| 25 | lua-de-mel-nas-maldivas | queila | 7 | 7 | 7 | 7 | 7 | **35** | Ajustar |
| 26 | guia-definitivo-sobrevivencia-festivais | felipe | 7 | 6 | 6 | 7 | 6 | **32** | **Revisar** |
| 27 | viagem-solo-feminina-norwegian | queila | 7 | 6 | 6 | 6 | 6 | **31** | **Revisar** |
| 28 | destinos-carnaval-2026-brasil | queila | 6 | 6 | 6 | 6 | 6 | **30** | **Revisar** |
| 29 | europa-gastronomica-roteiro-italia | felipe | 6 | 6 | 5 | 6 | 6 | **29** | **Revisar** |

Média geral = **39,1/50** (soma 1134 ÷ 29). Quatro posts abaixo do corte de 35. Padrão de queda: os posts fracos perdem sobretudo em **Precisão** (genérico/folder) e **Autenticidade** (tom de brochura), não em Diretividade — ou seja, o problema é embalagem, não estrutura.

---

## 3. Prioridade de ação

1. **Revisar os 4 abaixo de 35** (maior retorno): `europa-gastronomica-roteiro-italia`, `destinos-carnaval-2026-brasil`, `viagem-solo-feminina-norwegian`, `guia-definitivo-sobrevivencia-festivais`.
2. **Passada sistêmica de Title Case → sentence case** em todos os headings (1.1). Rápida, mecânica, alto impacto.
3. **Varredura de travessão** (1.2).
4. **Ajustes pontuais** nos 6 posts da faixa "Ajustar" (setups retóricos + promocional).
5. Os 19 posts "Forte/Bom" só precisam de retoques cosméticos ou nada.

---

## 4. Achados por post

Faixas **Revisar** e **Ajustar** primeiro (onde o trabalho está), depois as notas rápidas dos fortes.

### 🔴 europa-gastronomica-roteiro-italia — 29
O mais carregado de slop do blog.
- **Title Case** em quase todo heading: `Por Que a Itália é o Paraíso dos Amantes da Gastronomia`, `Roteiro de 10 Dias: Do Norte ao Sul Italiano`, `Dicas Práticas para Aproveitar ao Máximo`.
- **Promocional/folder:** "Paraíso dos Amantes da Gastronomia", "pizzas que redefinem tudo o que você achava que sabia", "algo extraordinário", "região incrível", "tesouros culinários em cada esquina", "cidade eterna".
- **Fragmento dramático:** "Sério." (l.60), "Impossível descrever." (l.96), "A lista não tem fim." (l.110).
- **Setup retórico:** "A verdade?" (l.34); "E tem mais:" (l.32).
- **Travessão de efeito:** l.24, l.84.
- **`jornada`** (vocab de IA): "Comece sua jornada gastronômica", "Termine sua jornada".
- Excerpt mistura inglês ("touristy spots") — trocar por português.
- **Bom manter:** "aquele olhar de reprovação do barista", a curiosidade do ragù registrado em cartório. Detalhes concretos que funcionam.

### 🔴 destinos-carnaval-2026-brasil — 30
O mais genérico e o mais "template".
- **Abre com pergunta em negrito** (gancho): "**Quer curtir o Carnaval 2026 sem estourar o orçamento?**".
- **Corpo quase todo em bullet com rótulo em negrito:** `* **Para economizar:**`, `* **Dica:**`, `* **Extra:**`, `* **Não perca:**`, `* **Atenção:**`. Estrutura de IA em bloco (humanizer #15).
- **Baixa especificidade** vs. o resto do blog: FAQ vaga ("O ideal é reservar o quanto antes", "Depende da sua cidade de origem"). Falta o número concreto que caracteriza os bons posts.
- **Ação sugerida:** este pede reescrita de fato, não só limpeza — subir o nível de concretude (preços, datas, distâncias) para o padrão dos posts de destino.

### 🔴 viagem-solo-feminina-norwegian — 31
Tom de advertorial/folder da companhia.
- **Promocional em série:** "conexões genuínas entre os hóspedes, de forma orgânica e sem pressão", "o compromisso com o conforto real", "natureza em sua forma mais autêntica", "o prazer genuíno de desacelerar".
- **Regra dos três + folder:** "centros históricos encantadores, gastronomia flexível e rituais de spa que tornam cada dia uma experiência completa"; "Glaciares imponentes, vida selvagem e parques nacionais que impressionam".
- **Falso range:** "seu ritmo, do início ao fim".
- **Nit de formatação:** headings `##` colados no parágrafo anterior sem linha em branco (l.28, 32, 38) — pode quebrar render do MDX; adicionar linha em branco.
- **Bom manter:** o dado do Virtuoso (71% dos viajantes solo) e os preços/roteiros concretos. A âncora factual está lá; o problema é a embalagem.

### 🔴 guia-definitivo-sobrevivencia-festivais — 32
Muita moldura, pouca substância específica.
- **Símile forçado:** "Ir para um festival sem um plano é como entrar em um labirinto no escuro."
- **Promocional/vago:** "o combustível da sua experiência", "seu corpo precisa estar do seu lado", "A mochila certa pode transformar sua experiência", "qualquer festival se transforma em uma experiência memorável, da primeira música ao último acorde".
- **Fragmento-citação:** "Tenha sempre o essencial. Nada mais, nada menos."
- **Exclamações de ênfase:** "(essencial!)", "(salve offline!)", "(esqueça sapato novo!)".
- **Falso range:** "da primeira música ao último acorde".
- Conteúdo real (kit, chegar cedo) é raso perto dos guias de destino. Candidato a ganhar especificidade (nomes de festivais, regras de bagagem por evento, valores).

### 🟡 disney-tropical-americas-animal-kingdom — 38
- Heading **`Por que isso importa para quem viaja a Orlando`** — encena importância (humanizer checklist). Trocar por algo concreto ("O Animal Kingdom deixa de ser meio-período").
- "a vegetação que engole tudo" (agência falsa, leve); "essa atração sozinha já justifica a viagem" (repetido no blog).
- CTA-cliché: "hora de parar de falar em hipótese e começar a montar o roteiro".
- Fora isso, sólido e sentence-case.

### 🟡 seguro-viagem-internacional-2026 — 37
- **Title Case** em todos os headings (`Em Quais Países...`, `Qual Cobertura Contratar Para Cada Destino?`, `5 Erros Que as Pessoas Cometem...`). Principal problema.
- Rótulos em negrito nas listas (aqui defensável — é referência).
- **Bom manter:** abertura ("Ninguém planeja passar mal... Mas acontece.") e a tríade concreta ("intoxicação em Cancún, torção em Lisboa, crise alérgica em Orlando") funcionam. Conteúdo forte; só a capitalização destoa.

### 🟡 5-segredos-da-disney-que-ninguem-conta — 36
- **Título com extremo** ("que Ninguém Conta") contradito pelo próprio corpo ("A maioria descobre tarde demais").
- **Setup/pergunta-resposta:** "você vai gastar uma fortuna em água, certo? Errado."; "Por que ninguém conta?".
- **Title Case** nos headings; **travessões** (l.24, 66, 68).
- Rótulos "O segredo:", "A dica de ouro:", "Economia estimada:".
- Conteúdo prático e correto — é embalagem clickbait sobre base boa.

### 🟡 nova-york-no-natal — 36
Voz inconsistente: intro nova (concreta, l.27-31) sobre um roteiro antigo (promocional).
- **Title Case** nos headings.
- **Promocional/cliché:** "a época mais mágica do ano", "não tem preço", "cenários dignos de filme", "transforma a noite em algo especial", "Parece um filme, mas é real".
- **Staccato:** "Sim, vai estar lotada. Sim, você provavelmente vai cair."
- **Agência falsa:** "a pista de patinação... espera por você".
- A intro mostra o padrão-alvo; alinhar o corpo a ela.

### 🟡 malas-de-mao-o-guia-definitivo — 36
Tabelas excelentes; prosa de abertura escorrega.
- **Abertura com 2 perguntas retóricas** (l.26).
- **Paralelismo negativo + três + promocional:** "não é apenas economia. É sobre liberdade, praticidade e aquela sensação incrível".
- **"A verdade?"** (l.122); rótulos "Dica de ouro:", "Truque:".
- **Title Case** nos headings.
- As tabelas por companhia são ouro — mexer só na prosa.

### 🟡 lua-de-mel-nas-maldivas — 35
- **Title Case** em série (`Por Que as Maldivas São o Destino Perfeito...`, `Quando Ir: Escolhendo a Época Perfeita`, `Investimento: Quanto Custa Esse Sonho`).
- **Promocional:** "Destino Perfeito", "Época Perfeita", "compensa cada centavo", "praia paradisíaca".
- Rótulos em negrito nas listas (defensável aqui).
- **Bom manter:** abertura estrutural (privacidade por ilha inteira) é forte e concreta.

### 🟢 Faixa Forte/Bom (retoques cosméticos)
- **quanto-custa-viagem-disney-2026 (46):** melhor do blog. Primeira pessoa, dados reais datados, planilha. Só Title Case no título.
- **roteiro-bonito-ms-5-dias (45):** abertura afiada ("Você não escolhe o preço. A prefeitura escolhe por você."), tabelas de preço. Exemplar.
- **jalapao-julho (44):** concreto e específico; só a metáfora "janela" e "Não é alarmismo de marketing" (telling). Title Case no título.
- **documentos-para-viajar-com-crianca (44):** referência limpa, sentence-case, links oficiais.
- **agencia-de-viagens-ou-por-conta-propria (43):** só um "Não... Mas porque..." (paralelismo negativo, l.30) e finais tipo pull-quote.
- **viagem-corporativa (43):** direto; usa muitos `---` como divisória (estético, não slop).
- **melhor-epoca-viajar-orlando (43):** dos mais limpos; sentence-case, segunda pessoa.
- **cancun-punta-cana-aruba (42):** "informação que muda tudo" (gancho leve), "Não é exagero" (telling). Sólido.
- **como-planejar-orlando (42):** "realmente importa" (advérbio) + travessões frequentes (l.27,35,45,67).
- **america-do-sul-latam (41):** seoTitle "Destinos Imperdíveis" (promocional); "Aqui vai um panorama honesto" (throat-clearing).
- **melhores-destinos-brasil (41):** "variedade absurda"; "O Caribe Brasileiro não é só marketing" (telling). Bons fragmentos de voz.
- **asia-destinos (41):** "é um capítulo à parte" (cliché); resto concreto.
- **america-do-norte (41):** limpo, sentence-case; negrito em nomes próprios em excesso.
- **roteiro-europa (40):** "A regra de ouro"; info de ETIAS/EES **mais vaga que o post dedicado** (ver §5).
- **caribe-destinos (40):** "Aqui vai o que cada destino..." (throat-clearing); sobreposição de tema com cancun-punta-cana (ver §5).
- **copa-do-mundo (40):** conteúdo excelente, mas muito **fragmento dramático**: "LA não é uma cidade. É uma região.", "Sim, ela existe.", "Os destinos falam por conta própria." (agência falsa).
- **ferias-julho-2026 (40):** Title Case no título/headings; rótulos em negrito (defensável); metáfora "janela".
- **disney-ou-beto-carrero (39):** "que ninguém fala logo de cara" (extremo); "Isso não é detalhe. É o centro da decisão." e "Isso não é consolação. É a forma mais inteligente" (mesmo molde de contraste 2x); "honestamente".
- **etias-2026 (39):** Title Case nos headings; fora isso, referência forte com tabelas.

---

## 5. Observações de conteúdo (fora do escopo stop-slop, mas visíveis na leitura)

Não são slop, mas apareceram na revisão e valem uma decisão editorial:

1. **Sobreposição de tema:** `cancun-punta-cana-aruba-lua-de-mel` e `caribe-destinos-para-brasileiros` cobrem o mesmo trio Cancún/Punta Cana/Aruba com ângulos próximos. Risco de canibalização de SEO; considerar diferenciar mais ou consolidar/interligar.
2. **Deriva factual de ETIAS/EES:** `roteiro-europa-brasileiros-2026` (l.32-34) descreve EES/ETIAS de forma mais vaga e antiga ("previsto para 2026", "€20 para adultos entre 18 e 70") do que o post dedicado `etias-2026` (preciso: EES já em vigor desde 10/abr/2026, isenção <18 e >70). Alinhar o post genérico ao dedicado.
3. **Extremos em títulos de conversão:** "que Ninguém Conta" e afins são clickbait leve; a marca posiciona-se como curadoria honesta (ver PRODUCT.md). Vale checar se o tom bate com o register `brand`.

---

## 6. Metodologia

- Skills aplicadas: `stop-slop` (referências `phrases.md` + `structures.md`) e `humanizer-pt-br` (25 padrões).
- Escopo: corpo markdown + campos de frontmatter voltados ao leitor (`title`, `excerpt`, `faq`). Frontmatter técnico ignorado.
- Notas são qualitativas e comparativas dentro do próprio blog, não absolutas.
- **Nada foi editado.** Próximo passo sugerido: aprovar o piloto de reescrita dos 4 posts "Revisar" + a passada sistêmica de Title Case, em branch/PR.
