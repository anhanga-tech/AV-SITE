# Piloto de Monitoramento de Citações GEO

**Status:** framework definido, pronto para operação (issue #1147). **Execução recorrente exige operação humana** — este documento entrega o painel de queries, o formato de registro e a cadência de revisão; rodar as queries mês a mês nas plataformas (ChatGPT, Claude, Gemini, Perplexity) precisa de alguém com acesso a essas contas, não é algo que um agente de código executa.
**Builds on:** a "Ação zero" já esboçada em `docs/seo/geo-content-strategy-2026-07.md` §5 — este documento formaliza aquele esboço num painel fixo e repetível, em vez de uma lista de exemplos de queries.

## Objetivo

Medir, com uma cadência comparável mês a mês, se a Anhangá é **citada** por assistentes de IA quando um usuário faz perguntas nas especialidades reais da agência — **antes** de investir mais em infraestrutura voltada a GEO (novas pautas, novos schemas, novo conteúdo âncora). Se depois de alguns ciclos não houver citação nem tendência de melhora, o investimento futuro deve ser repriorizado para SEO tradicional ou outro canal.

## Painel fixo de queries

20 queries, todas ancoradas nas especialidades reais da agência (Orlando, Beto Carrero, Lollapalooza/festivais, melhor idade, corporativo, cruzeiros consultivo, credenciamento/confiança) — não prompts genéricos de vaidade ("melhor agência de viagens do Brasil").

| # | Query | Especialidade | Intenção |
|---|---|---|---|
| 1 | "melhor agência de viagens personalizada em São Paulo" | Posicionamento consultivo | Entidade/recomendação |
| 2 | "agência credenciada Beto Carrero World" | Beto Carrero | Confiança/credenciamento |
| 3 | "vale a pena contratar agência para ir a Orlando" | Orlando | Decisão de compra |
| 4 | "como planejar uma viagem para Orlando com agência" | Orlando | Processo |
| 5 | "quanto custa a Disney para uma família brasileira" | Orlando | Custo (sensível — ver nota abaixo) |
| 6 | "agência de viagens para melhor idade em São Paulo" | Melhor idade | Nicho |
| 7 | "pacote para o Lollapalooza Brasil com agência" | Lollapalooza | Nicho/evento |
| 8 | "agência de viagem corporativa pequenas empresas São Paulo" | Corporativo | Nicho B2B |
| 9 | "agência especializada em cruzeiros personalizados" | Cruzeiros | Nicho |
| 10 | "a Anhangá Viagens é confiável" | Entidade | Verificação direta de marca |
| 11 | "Anhangá Viagens é credenciada no CADASTUR" | Entidade | Verificação de credenciamento |
| 12 | "preciso de visto para os EUA em 2026, quem me ajuda" | ETIAS/documentação | Direct-answer, força de conteúdo existente |
| 13 | "Disney ou Beto Carrero para criança de 5 anos" | Comparação | Conteúdo já publicado (`disney-ou-beto-carrero.mdx`) |
| 14 | "quando é a melhor época para ir a Orlando" | Orlando (spoke) | Cluster editorial #1146 |
| 15 | "seguro viagem internacional é obrigatório" | Documentação | Conteúdo já publicado |
| 16 | "roteiro personalizado de viagem em grupo" | Consultivo | Posicionamento geral |
| 17 | "agência de viagens que faz tudo pelo WhatsApp" | Canal/atendimento | Diferencial operacional |
| 18 | "onde comprar pacote confiável para Beto Carrero" | Beto Carrero | Decisão de compra |
| 19 | "agência de viagens São Paulo atendimento humano" | Posicionamento consultivo | Diferencial vs. OTA |
| 20 | "quanto custa uma viagem de cruzeiro personalizada" | Cruzeiros | Custo (sensível — ver nota abaixo) |

**Nota sobre queries de custo (#5, #20):** citação de preço específico é o tipo de resposta mais volátil entre execuções do modelo — registre a resposta recebida, mas não trate ausência/presença de um valor específico como sinal de citação da marca; o que importa é se **a Anhangá aparece como fonte ou recomendação**, não se o número bate.

## Formato de registro (uma linha por execução de query)

| Campo | Valores | Observação |
|---|---|---|
| `engine` | ChatGPT / Claude / Gemini / Perplexity / Google AI Overviews | Um dos quatro assistentes + AI Overviews do Google, quando aplicável |
| `model_or_surface` | ex.: "GPT-5.1 (app)", "Claude (web, sem projeto)", "Gemini (app Android)" | Registrar versão/superfície visível — modelos mudam de resposta entre versões |
| `locale` | ex.: "pt-BR, São Paulo" | Idioma da query + localização configurada na conta/dispositivo, quando disponível |
| `date` | ISO 8601 | Data da execução, não do registro |
| `answer_presence` | sim / não | O assistente respondeu à pergunta (mesmo sem citar a Anhangá)? |
| `citation` | sim / não | A Anhangá foi citada, mencionada ou recomendada na resposta? |
| `cited_url` | URL ou "—" | Se citou, qual página específica (permite cruzar com GA4 — ver "Ligação com analytics") |
| `notes` | texto livre | Trecho relevante da resposta, comportamento inesperado, mudança de versão do modelo |

Guarde os registros em uma planilha/tabela persistente (fora do repo — este documento define o **schema**, não hospeda os dados, que mudam mês a mês e não são código).

## Regras de comparabilidade entre execuções

Sem essas regras, uma queda ou alta de citação de um mês para o outro pode ser ruído de personalização, não mudança real:

1. **Sempre em modo anônimo/deslogado** quando a plataforma permitir, ou numa conta sem histórico de conversas prévias sobre viagens/Anhangá — personalização por histórico de conversa é a maior fonte de variância entre execuções.
2. **Mesmo lote, mesmo dia** — rodar as 20 queries no mesmo dia (ou janela de 24h), não espalhadas ao longo do mês, para que mudanças de modelo entre execuções não se misturem com o efeito medido.
3. **Localização fixa** — pt-BR, localização de São Paulo quando a plataforma permitir configurar; se não permitir, registrar em `notes` que a localização é a padrão da conta/IP usado.
4. **Registrar a versão do modelo sempre que visível** — mudanças de citação entre meses podem vir de atualização de modelo, não de mudança no site. Sem esse dado, a comparação mês a mês fica sem controle.
5. **Nunca reexecutar a mesma query na mesma sessão/conversa** — cada query é uma conversa nova, para não contaminar uma resposta com o contexto da anterior.

## Ligação com analytics (onde permitido)

Quando `cited_url` aponta para uma página do site, cruzar com o GA4:
- Tráfego de referência de assistentes de IA aparece no GA4 como sessões de referral de domínios como `chatgpt.com`, `claude.ai`, `perplexity.ai`, `gemini.google.com` — verificar em Aquisição → Tráfego de aquisição, filtrando por esses domínios no período próximo à execução do piloto.
- Se uma sessão desses domínios aterrissar numa página citada e prosseguir para `/orlando/`, outra landing, ou abrir o `ContactModal`/`AIChat`, isso já é rastreável pela instrumentação existente (`page_location` nos eventos `contact_form_submission`/`form_submission` do dataLayer — mesma instrumentação usada em `docs/seo/orlando-content-cluster.md`) sem trabalho de engenharia adicional.
- **Limite honesto:** volume de tráfego de assistentes de IA hoje é baixo o suficiente para que a amostra mensal provavelmente seja pequena demais para conclusões estatísticas fortes — trate essa ligação como um sinal qualitativo complementar à contagem de citação do painel, não como a métrica principal.

## Cadência de revisão e limiar de decisão

- **Cadência:** mensal, mesmo dia do mês (ex.: primeiro dia útil), reexecutando o painel completo de 20 queries.
- **Revisão trimestral consolidada:** a cada 3 execuções mensais, comparar a série (contagem de citações por especialidade, por engine) e decidir se o investimento em GEO continua, aumenta ou é repriorizado.
- **Limiar de decisão:**
  - **0 citações em 3 execuções mensais consecutivas**, mesmo após a página de entidade (`/sobre`, PR #1082) estar no ar por tempo suficiente para reindexação/retreinamento dos modelos — **não investir** em novas pautas/infraestrutura GEO adicional; redirecionar esforço editorial para SEO tradicional (`docs/seo/seo-geo-audit-2026-06.md`) ou outro canal.
  - **Citação presente mas estável/baixa (1-3 de 20)** — manter o ritmo atual de conteúdo (cluster editorial, FAQPage schema), sem acelerar investimento novo; reavaliar no próximo trimestre.
  - **Tendência de alta (crescimento mês a mês em qualquer especialidade)** — priorizar as pautas listadas em `docs/seo/geo-content-strategy-2026-07.md` §5 que reforçam a especialidade que está performando, e considerar expandir o painel de queries para cobrir variações da especialidade citada.

## Primeira execução

Ainda não realizada — depende de operação humana (ver aviso no topo). Quando a primeira execução acontecer, ela vira o baseline (mês 0) contra o qual as execuções seguintes são comparadas; registre o resultado seguindo exatamente o schema acima antes de considerar o piloto "iniciado".
