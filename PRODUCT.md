# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Register

brand

## Users

Viajantes brasileiros decidindo uma viagem que importa — não uma reserva qualquer.

- **Famílias e casais (lazer)** — o núcleo. Planejam férias com peso emocional e financeiro: Orlando, Beto Carrero, cruzeiros, destinos de descanso. Chegam com dúvida, comparando opções, querendo alguém que conheça o destino de verdade e os trate pelo nome. Acessam majoritariamente pelo celular, muitas vezes à noite.
- **Corporativo / eventos** — empresas e grupos (Lollapalooza, viagens de incentivo, corporativo). Buscam confiabilidade, organização e um interlocutor que resolva, não um formulário.

O trabalho a ser feito: sair da incerteza ("será que vale? em quem confiar?") e chegar a uma conversa com alguém que já viajou muito e vai curar o roteiro certo. O site não fecha a venda — ele inicia o relacionamento e qualifica o lead (chatbot BANT → CRM).

## Product Purpose

A Anhangá Viagens é uma agência boutique brasileira onde **cada roteiro nasce de uma conversa**. O site é a primeira impressão dessa promessa: vitrine de destinos, blog de turismo, landing pages de campanha e um chatbot com IA que qualifica e encaminha leads para atendimento humano.

Existe para transformar tráfego frio em conversa quente — provando, pelo próprio design, que do outro lado há gente que conhece os clientes pelo nome e seleciona com critério. Sucesso é o visitante sentir "essa agência me entende" antes de falar com qualquer pessoa, e converter em lead qualificado (chatbot, formulário, WhatsApp) sem fricção corporativa.

## Positioning

A curadoria por conversa é o que a Anhangá promete e uma OTA de comparação de preço não consegue copiar de verdade: cada lead passa por qualificação BANT (Necessidade, Autoridade, Orçamento, Prazo) num chatbot com IA que faz apenas uma pergunta por vez e decide entre gerar um link de orçamento ou encaminhar para atendimento humano — nunca uma grade de preços genérica. É a mecânica de curadoria (conversa → qualificação → roteiro sob medida), não apenas o discurso de marca, que separa a Anhangá do catálogo transacional descrito nas anti-referências.

## Capabilities and Constraints

- Touchpoints confirmados que alimentam o mesmo CRM (Odoo): chatbot de qualificação (Gemini), formulário de contato rápido, quiz de perfil do viajante, lista de espera de eventos, e pesquisa NPS pós-viagem.
- O chatbot impõe uma pergunta por resposta e faz handoff para atendimento humano em reservas com menos de 30 dias, em vez de gerar link de orçamento automaticamente — reservas de última hora não seguem o fluxo self-service.
- Blog editorial com publicação agendada (posts com data futura ficam ocultos até a data programada); conteúdo editável via CMS (Decap) por pessoas não técnicas.
- Landing pages de campanha (ex.: Beto Carrero, Lollapalooza, Orlando, Melhor Idade, Corporativo, Cruzeiros) usam um layout dedicado, sem cabeçalho/rodapé/chatbot do site principal — foco total no CTA do evento.
- Todo CTA de WhatsApp carrega os parâmetros de rastreamento de campanha (UTM e click IDs) coletados na sessão.
- Restrição confirmada: conformidade com a LGPD no opt-in de marketing; o chatbot recusa qualificar leads de determinadas geografias bloqueadas.
- Constraint em aberto: hoje não há coleta nem exibição de depoimentos/avaliações reais de clientes no site (ver Evidence on Hand).

## Brand Personality

Voz na segunda pessoa, calorosa, nunca informal demais nem corporativa. Três palavras-âncora:

- **Acolhedora e pessoal** — conhece o cliente pelo nome; cada interação é uma conversa, não uma transação. Calor humano acima de eficiência fria.
- **Curadora confiante** — autoridade de quem viajou muito e recomenda com critério. Seleciona em vez de listar tudo; tem opinião.
- **Íntima + tátil** (registro herdado do DESIGN.md "O Diário de Bordo") — o relato pessoal guardado com afeto; componentes com peso físico que respondem ao toque.

Emoções a evocar: confiança ("estou em boas mãos"), pertencimento ("falam comigo, não com uma massa"), antecipação calorosa da viagem. Nunca: urgência manipulativa, frieza de comparador, distância de luxo impessoal.

## Anti-references

A Anhangá explicitamente **não** deve parecer:

- **OTA de comparação de preço** (Decolar, Booking) — grades de cards idênticos, foco em preço, frieza transacional, escassez artificial. A conversa e a curadoria são o oposto disso.
- **Agência tradicional datada** — visual anos 2000, clipart de praia, banners piscando, excesso de informação, poluição visual.
- **SaaS azul-roxo genérico** — gradientes de tech, glassmorphism decorativo, template hero-métrica (número grande + label + gradient). Já banido no DESIGN.md.
- **Luxo frio e impessoal** — resort 5 estrelas sem alma (dourado, serif, distância). A Anhangá é boutique e refinada, mas o calor da conversa vem antes do prestígio.

Anti-padrões já codificados no DESIGN.md: formulário corporativo frio, cinza neutro sem tint, fonte do sistema, espaçamento mecânico uniforme, gradient text, side-stripe borders, cards idênticos em grade repetida.

## Evidence on Hand

Não há depoimentos, estudos de caso, prêmios ou menções de imprensa reais documentados até o momento. Trabalhos futuros de design não devem inventar avaliações de clientes, números de atendimentos, selos ou prêmios fictícios — qualquer prova social deve esperar por evidência real fornecida pelo negócio.

## Design Principles

1. **Conversa, não transação.** Todo touchpoint é desenhado como um diálogo: segunda pessoa, nome do cliente quando disponível, um CTA dominante por tela. Se a tela parece um caixa de loja, está errada.
2. **Curadoria sobre catálogo.** Mostrar o roteiro certo com opinião, não despejar todas as opções. Hierarquia e seleção comunicam autoridade; a grade infinita comunica commodity.
3. **Peso físico só onde se age.** Hard shadows, press-down e âmbar são reservados aos pontos de ação (1 por tela). Decoração com peso quebra a confiança que o sistema constrói.
4. **Lugares reais, não categorias de produto.** Cor, imagem e copy remetem a oceano, sol de tarde, destinos concretos — nunca à paleta genérica de "site de viagem". A viagem é específica.
5. **Mobile-first e íntimo por padrão.** O cliente decide pelo celular, à noite, em estado receptivo. O fundo escuro nos fluxos de conversa e os alvos generosos são resposta a esse momento, não escolha estética.

## Accessibility & Inclusion

- **WCAG 2.1 AA** como piso: corpo de texto ≥ 4.5:1, texto grande ≥ 3:1, foco visível em todos os interativos (dois sinais: border + outline). Touch targets ≥ 44×44px.
- **Reduced motion não é opcional.** Toda animação de entrada (`fade-in-up`, `float`, `blob`, `popIn`) tem alternativa em `prefers-reduced-motion: reduce`.
- **Nunca depender só de cor.** Estados (erro, sucesso, âmbar de urgência) sempre acompanhados de ícone, texto ou peso — daltonismo não pode esconder informação. Erros usam `role="alert"`.
- Branco rebaixado (`white/90`) sobre Ardósia Profunda para reduzir dureza e manter legibilidade noturna.
- Considerar o público melhor idade e a leitura em celular à noite: baixa carga cognitiva, generosidade de alvo e de espaçamento.
