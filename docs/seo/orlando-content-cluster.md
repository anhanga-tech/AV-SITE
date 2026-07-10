# Cluster Editorial — Orlando

**Status:** primeira fatia publicável entregue (issue #1146) — pilar + 1 spoke, ambos publishable-ready.
**Objetivo:** dar suporte de conteúdo à landing `/orlando/` com intenções de busca distintas e complementares, em vez de um lote de artigos por volume que competem entre si.

## Estrutura do cluster

```
                    /orlando/  (landing comercial, transacional)
                         ▲
                         │ (link com CTA "Solicitar Orçamento" / ChatCTA)
                         │
   ┌─────────────────────┴─────────────────────┐
   │        PILAR (hub, intenção de processo)    │
   │  como-planejar-viagem-orlando-sob-medida    │
   └─────────────────────┬─────────────────────┘
                         │ (link explícito, seção 5 do pilar)
                         ▼
   ┌─────────────────────────────────────────────┐
   │     SPOKE 1 (intenção de timing/sazonalidade) │
   │ melhor-epoca-viajar-orlando-guia-perfil-viajante │
   └───────────────────────────────────────────────┘
```

| Página | Intenção de busca | Papel |
|---|---|---|
| `/orlando/` | Transacional ("pacote Orlando", "viagem Orlando personalizada") | Landing comercial — destino final de conversão do cluster |
| `como-planejar-viagem-orlando-sob-medida` (pilar) | Informacional-comercial de processo ("como planejar viagem Orlando", "o que preciso saber antes de ir para Orlando") | Hub do cluster — cobre a sequência completa de decisões (documentação, parques, hospedagem, dias, época) e linka para o spoke e para a landing |
| `melhor-epoca-viajar-orlando-guia-perfil-viajante` (spoke) | Informacional de timing ("melhor época para ir a Orlando", "quando ir a Orlando") | Aprofunda a decisão de época (seção 5 do pilar) sem repetir o restante do processo — linka de volta ao pilar e para a landing |

### Relação canônica / links internos

- Nenhuma página do cluster usa `rel=canonical` para outra — são URLs e intenções de busca distintas, cada uma com direito a rankear por conta própria.
- O pilar linka para o spoke uma vez (seção "Quando ir muda o resto do planejamento"), evitando repetir o conteúdo de sazonalidade no próprio pilar.
- O spoke linka de volta para o pilar uma vez (seção final), fechando o hub-and-spoke sem link recíproco redundante no meio do texto.
- Ambos linkam para `/orlando/` com UTMs distintas por página (ver Medição abaixo), nunca para outras landings — evita diluir o link equity do cluster.

### Checagem de canibalização (feita antes de publicar)

Conteúdo Orlando pré-existente no blog, e por que não há sobreposição:

- `disney-ou-beto-carrero.mdx` — intenção de **comparação** entre dois parques concorrentes (Disney vs Beto Carrero). Não compete com "como planejar" nem "melhor época", que assumem Orlando como destino já decidido.
- `ferias-julho-2026-destinos.mdx` — lista **10 destinos** para uma janela específica (julho 2026), Orlando é um item entre outros nove, não o foco. Intenção é "onde ir em julho", não "como planejar Orlando".
- `disney-tropical-americas-animal-kingdom.mdx` — foco em um parque específico (Animal Kingdom) dentro do complexo Disney, não no processo de planejamento da viagem inteira.

Nenhum desses três compete pelas queries-alvo do pilar ou do spoke pela intenção da **página**. Uma revisão de review encontrou, porém, uma sobreposição mais fina: duas perguntas do FAQ do pilar (visto para viajar / prazo de antecedência) tinham resposta quase idêntica às perguntas equivalentes já publicadas em `disney-ou-beto-carrero.mdx` — mesmos elementos, mesma resposta, competindo pelo mesmo rich result do Google apesar de as páginas terem intenções diferentes. Reescritas para focar no ângulo próprio do pilar (sequência de decisões e a relação entre escolha de parque e hospedagem) em vez de duplicar fato por fato. Checar isso — não só a intenção da página, mas o conteúdo do FAQPage schema linha a linha — é parte obrigatória da checagem de canibalização para qualquer spoke futuro.

## Frescor e ownership

| Conteúdo | O que pode ficar desatualizado | Responsável | Cadência de revisão |
|---|---|---|---|
| Regras de visto/documentação (pilar, seção 1) | Mudanças em política de visto dos EUA | Felipe (autor) | Revisar a cada 6 meses ou em qualquer mudança de política divulgada |
| Estrutura dos parques (pilar, seção 2 e 4) — nomes/quantidade de parques | Abertura/fechamento de parque (ex.: Epic Universe já é recente) | Felipe (autor) | Revisar quando houver anúncio oficial da Disney/Universal |
| Janelas sazonais (spoke) — datas de Labor Day, temporada de furacões | Baixo risco — são padrões de calendário/clima estáveis ano a ano, não datas fixas | Queila (autor) | Revisar anualmente, início do ano |

Nenhuma das duas páginas cita preço de ingresso de parque, tarifa aérea específica ou promoção datada — são exatamente os pontos que mais rápido ficam errados, e o cluster deliberadamente evita ancorar nisso (o roteiro de preço fica na conversa com a equipe, não no artigo).

## Medição

O cluster usa instrumentação que já existe no site, sem necessidade de código novo:

- **Descoberta orgânica:** sessões GA4 com canal orgânico chegando em `/blog/como-planejar-viagem-orlando-sob-medida/` ou `/blog/melhor-epoca-viajar-orlando-guia-perfil-viajante/` — já capturado pelo agrupamento de canal padrão do GA4, sem trabalho adicional.
- **Conversas assistidas pela landing:** os dois artigos linkam para `/orlando/` com UTMs próprias e distintas por artigo (`utm_campaign=orlando-cluster-pillar` / `utm_campaign=orlando-cluster-spoke-epoca`, `utm_source=blog`, `utm_medium=internal_link`) — permite isolar no GA4/Ads sessões que chegaram na landing vindas especificamente do cluster, mesmo sendo um link interno.
- **Leads qualificados:** ambos os posts têm `showChatCTA: true` com `chatCTADestination: "Orlando"`, que renderiza o `<ChatCTA />` (`components/blog/ChatCTA.tsx`) ao final do artigo. Esse componente já dispara `openContactModal({ source: 'blog-inline-cta', destination: 'Orlando' })`, e o hook `useContactForm` já envia `cta_source`/`page_location` no evento `contact_form_submission` do dataLayer (`hooks/useContactForm.ts`) — ou seja, toda submissão de lead a partir desses dois posts já chega distinguível no GA4 por `page_location`, sem mudança de código.

## Próximas fatias (fora do escopo desta entrega)

Candidatos a spokes futuros, cada um cobrindo uma intenção não sobreposta às duas páginas atuais nem entre si:

- Orçamento por perfil de viagem (casal, família, grupo) — intenção transacional-comparativa, cuidado redobrado com preços (ver seção Frescor).
- Documentação para viajar com criança (complementa `documentos-para-viajar-com-crianca.mdx` já existente — verificar sobreposição antes de escrever).
- Roteiro dia a dia por número de dias disponíveis (ex.: "Orlando em 5 dias" vs "Orlando em 10 dias") — intenção operacional, distinta de "como planejar".

Cada spoke futuro deve repetir a checagem de canibalização feita nesta entrega antes de ser publicado.
