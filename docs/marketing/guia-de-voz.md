# Guia de voz da Anhangá

Como a Anhangá fala com o cliente: no site, no chat, no WhatsApp, em e-mail, em formulário e em mensagem de erro. Este é o guia operacional. A direção estratégica continua em [`PRODUCT.md`](../../PRODUCT.md) (seção "Brand Personality"), que prevalece em caso de conflito. A identidade visual está em [`DESIGN.md`](../../DESIGN.md) e em [`docs/design/brand-system/`](../design/brand-system/README.md).

## Em uma frase

> A Anhangá fala como uma pessoa que viajou muito, conhece você pelo nome e cuida de cada detalhe da sua próxima viagem, no seu tempo e do seu jeito.

## Quem está falando

Uma curadora de viagem de verdade, não um sistema. Tem experiência, tem opinião e recomenda com critério. Fala de igual para igual: sem reverência de luxo e sem a pressa de vendedor.

**Três palavras-âncora** (de `PRODUCT.md`):

- **Acolhedora e pessoal.** Cada interação é uma conversa, não uma transação. O calor humano vem antes da eficiência fria.
- **Curadora confiante.** Seleciona em vez de listar tudo. Diz "para o seu perfil, eu iria de X", não "temos as opções A, B, C, D, E".
- **Íntima e tátil.** O tom de um diário de bordo: relato pessoal, guardado com afeto, cheio de lugares concretos.

**Três pilares** (do brand-system):

- **Humano.** Tem gente de verdade do outro lado, e a gente diz isso.
- **Artesanal.** Cada viagem é feita à mão, sem pacote engessado.
- **Acompanhado.** A gente caminha junto da primeira ideia ao último pôr do sol.

**Palavras de clima:** sincero, artesanal, sonhador, aconchegante, bem-feito.

## O que o cliente deve sentir

| Evocar | Nunca provocar |
|---|---|
| Confiança: "estou em boas mãos" | Urgência manipulativa: "últimas vagas!", contagem regressiva falsa |
| Pertencimento: "falam comigo, não com uma massa" | Frieza de comparador de preço |
| Expectativa calorosa pela viagem | Distância de luxo impessoal |

## Regras de gramática e forma

**Pessoa gramatical.** A agência fala como **"a gente"** (ou "nós", em textos mais formais, como os jurídicos). O cliente é sempre **"você"**, no singular. Mesmo numa página vista por milhares de pessoas, o texto fala com uma pessoa só.

- ✅ "A gente cuida da burocracia."
- ❌ "Vocês podem contar com nossa equipe." (fala com uma multidão)
- ❌ "Prezado cliente" (fala com ninguém)

**Nome do cliente.** Use sempre que estiver disponível ("Olá, Marina!"), mas não repita em todas as frases. Um uso na abertura já basta.

**Português brasileiro coloquial-cuidado.** Conversado, mas preciso. Contrações naturais ("pra", "tá") cabem em conversa e WhatsApp, não em títulos nem em página institucional. Gíria de nicho só em landing de público de nicho (Lollapalooza pode dizer "perrengue"; a página Melhor Idade não).

**Frases curtas e diretas.** Uma ideia por frase. Primeiro o que importa ao cliente, depois o detalhe.

**Sentence case.** Título, heading e botão levam maiúscula só na primeira palavra e em nomes próprios. Title Case é tique de tradução do inglês (ver [`blog-stop-slop-review-jul2026.md`](blog-stop-slop-review-jul2026.md)).

- ✅ "Quero meu pacote no WhatsApp"
- ❌ "Quero Meu Pacote no WhatsApp"

**Travessão com moderação.** Na maioria dos casos, vírgula, ponto ou dois-pontos resolvem. Travessão é para a pausa dramática rara, não para a pontuação do dia a dia.

**Emoji.** No máximo um por mensagem, e só em canais de conversa (chat, WhatsApp, redes). Nunca como ícone de interface, nunca em título de página e nunca em mensagem sobre problema do cliente (erro, cancelamento, recusa).

## Vocabulário

| Preferir | Evitar | Por quê |
|---|---|---|
| roteiro, viagem | pacote (como produto genérico), produto, item | curadoria, não catálogo |
| conversar, falar com a gente | entrar em contato, acionar o atendimento | conversa, não transação |
| consultor, especialista, gente de verdade | atendente, operador, central | tem uma pessoa do outro lado |
| investir, quanto você quer investir | preço baixo, promoção imperdível, barato | não somos comparador |
| lugares concretos: "o pôr do sol em Jericoacoara" | categorias: "destinos de praia", "opções nacionais" | lugares reais, não categorias |
| Planejar, Começar a sonhar, Falar com a gente, Ver destinos | Clique aqui, Saiba mais (como CTA principal) | o verbo diz o que acontece |

"Pacote" continua válido quando é mesmo um pacote fechado de evento (Lollapalooza, Beto Carrero, grupos). O que se evita é tratar toda viagem como mercadoria de prateleira.

## Frases que soam como a Anhangá

Tiradas do próprio site e do brand-system. Use como diapasão, não como bordão.

- "Sem script, sem pacote engessado."
- "A gente acompanha do embarque ao último pôr do sol."
- "Respondemos em até 24h, com gente de verdade."
- "Burocracia? Deixa com a gente."
- "Gente de verdade, não robô."
- "Conselho sobre a sua viagem, não sobre o catálogo."
- "Você curte os shows, a gente resolve o resto."
- "Hotel a distância do autódromo, transfer no horário certo, ingresso em mãos. Sem táxi às 23h. Sem susto na chegada."
- "Viajar com a Anhangá é viajar leve."

O que elas têm em comum: falam com uma pessoa, prometem algo concreto e tiram um peso do cliente.

## Calibragem por canal

A voz é a mesma em todo lugar; o que muda é a intensidade.

| Canal | Registro | Observações |
|---|---|---|
| Home e páginas institucionais | caloroso e confiante | Frase completa, sem gíria nem emoji. |
| Landings de evento | mais solto, com a energia do público | Pode ter humor e referência do nicho. Um CTA dominante por tela. |
| Chat (Guia Anhangá) | conversa de consultor | Uma pergunta por resposta. Nunca parecer formulário. Assume que é IA e lembra que um consultor de verdade assume o orçamento. A voz do chat vive no bloco `VOICE` de `lib/ai/prompt.ts`. Nome: "Guia Anhangá", sempre com "Assistente virtual" ao lado. "Guia" é uma função, não uma pessoa; nunca dar ao bot nome de gente. |
| WhatsApp | o mais próximo e pessoal | Nome do cliente, frases curtas, um emoji no máximo. |
| E-mail | caloroso e organizado | Abre pelo nome, termina com o próximo passo claro. |
| Formulários | guia gentil | Rótulo claro, placeholder com exemplo real ("Ex.: Orlando, Paris"). Explica por que pede dado sensível. |
| Blog | relato de quem esteve lá | Concreto, com números reais, segunda pessoa, opinião. |
| Textos jurídicos e LGPD | claro e respeitoso | Pode ser mais formal ("nós"), mas nunca juridiquês gratuito. |

## Situações delicadas

**Qualificação e orçamento.** Pergunte uma coisa por vez e trate o orçamento como faixa, nunca como valor exato. Nunca diga que o orçamento é "insuficiente" nem force o cliente a aumentar o valor. Se a faixa não encaixa, a conversa segue e o consultor humano ajusta.

- ✅ "Pra eu montar algo que faça sentido pra você, em qual faixa você pensa em investir?"
- ❌ "Com esse valor não conseguimos fazer essa viagem."

**Preço.** A gente não informa valor, cotação nem estimativa na conversa automatizada. Quem apresenta o valor é o consultor, junto com o roteiro.

**Recusa (fora do escopo ou destino bloqueado).** Recuse com educação, sem sermão, e ofereça um caminho.

- ✅ "Pra esse destino a gente não está montando viagens no momento, por segurança. Posso te sugerir lugares com uma vibe parecida?"

**Embarque em menos de 30 dias.** Passe para atendimento humano com a mensagem padrão:

> "Entendi e vou te ajudar com prazer. Para pedidos de passagem com embarque em menos de 30 dias, por segurança operacional, seguimos com atendimento humano. Posso te encaminhar agora para um consultor no WhatsApp para verificar pacotes para outras datas?"

**Pós-venda (reembolso, alteração, reclamação).** Reconheça o problema, diga que uma pessoa vai assumir e diga como. Não tente resolver no automático.

**Erro técnico.** Assuma o problema sem culpar o cliente, diga o que ele pode fazer agora e ofereça o WhatsApp como saída.

- ✅ "Tivemos um problema do nosso lado ao enviar seus dados. Pode tentar de novo em instantes ou, se preferir, falar com a gente direto no WhatsApp."
- ❌ "Ocorreu um erro inesperado." (não diz o que fazer)

**Esgotado e lista de espera.** Seja honesto sobre a disponibilidade e aponte o próximo passo, sem escassez inventada.

- ✅ "O Lolla 2026 esgotou, mas a lista de espera de 2027 já está aberta."

**Pós-viagem e NPS.** Tom de reencontro: pergunte sobre o momento marcante antes de pedir nota.

## Prova social e promessas

- Não invente depoimento, número de atendimentos, prêmio, selo ou menção na imprensa. Prova social só com evidência real fornecida pelo negócio (ver "Evidence on Hand" em `PRODUCT.md`).
- Promessas precisam ser cumpríveis: "respondemos em até 24h" só se a operação garante isso.
- Nada de superlativo vazio ("a melhor agência", "experiência inesquecível", "incrível"). Troque por um detalhe concreto.

## Checklist rápido antes de publicar

- [ ] Fala com **uma** pessoa ("você"), e a agência é "a gente"?
- [ ] Tem um lugar, detalhe ou promessa **concreta**, não só adjetivo?
- [ ] O próximo passo está claro, com **um** CTA dominante?
- [ ] Nenhuma urgência artificial, preço de vitrine ou prova social inventada?
- [ ] Títulos e botões em sentence case, travessões contados nos dedos?
- [ ] Soaria natural lido em voz alta por um consultor da Anhangá no WhatsApp?

## Pendências conhecidas

Pontos em que o que está no ar hoje diverge deste guia. Resolver em PRs próprias.

- **Title Case em CTAs e títulos** (ex.: "Quero Meu Pacote no WhatsApp", "Quiz: Descubra Seu Destino Ideal").
- **Mensagens de erro genéricas** (ex.: "Ocorreu um erro inesperado. Tente novamente.") sem oferecer o WhatsApp como saída.
- **Saudação "Oie! Vamos conversar?"**: fica no limite do "informal demais" para páginas que não são de evento.
