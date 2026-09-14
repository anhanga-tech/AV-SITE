---
name: legendas-redes
description: Adapta legendas de redes sociais (Instagram, X, Threads) para a voz da Anhangá, passa o humanizer-pt-br, gera variações por plataforma com contagem de caracteres, revisa os slides de carrossel da agência e organiza os arquivos para postar. Use quando o usuário mandar uma legenda para melhorar, pedir versão para X/Threads, mandar slides de carrossel ou pedir feedback para a agência de marketing ("melhora essa legenda", "adapta pra voz da Anhangá", "faz a versão pro X", "renomeia os slides").
---

# Legendas para redes sociais

Transforma a legenda que a agência ou o time manda num texto com a voz da Anhangá, pronto para Instagram, X e Threads. Os slides são feitos por uma agência de marketing externa: **não se reescrevem os slides**. Problemas neles são resolvidos pela legenda e anotados para o feedback à agência.

## Antes de começar

1. Ler `docs/marketing/guia-de-voz.md`. Ele manda na voz. Em caso de conflito, `PRODUCT.md` ("Brand Personality") prevalece.
2. Se ainda não houver, pedir junto com a legenda: formato (Reels, feed, carrossel), CTA desejado e se há hashtags a manter. Não travar o trabalho por isso: na falta, assumir e dizer o que foi assumido.

## Fluxo por legenda

### 1. Entender o post

- **Com slides:** ler todos, anotar a ordem e extrair os destinos, frases e temas. A legenda deve acompanhar o que os slides mostram.
- **Sem slides e com lugares vagos** ("arquitetura europeia", "praias de água doce"): não inventar destino como se fosse certo. Propor o mais provável e marcar como **pendente de confirmação**, ou pedir os slides.
- **Conferir se o conteúdo bate com o tema.** Post de verão com destino fora de temporada (ex.: Mediterrâneo no verão brasileiro), feriado com destino que não cabe no prazo etc. Se não bater, contornar pela legenda ("o Mediterrâneo fica para as férias de julho") e avisar o usuário.

### 2. Reescrever na voz da Anhangá

Regras que mais aparecem na prática:

- **"A gente" é só a agência.** Se o original usa "a gente" no sentido de "as pessoas", trocar.
- **O cliente é "você", no singular.**
- **Lugar concreto em vez de categoria ou adjetivo.** Cada destino citado ganha um detalhe real (moais no meio do Pacífico, casas enxaimel, praia de água doce no Tapajós).
- **Nada de superlativo vazio** ("experiência única", "incrível", "inesquecível"), **urgência inventada** ou **prova social sem evidência** ("tanta gente embarca e já pensa na próxima").
- **No máximo um emoji por legenda**, ligado ao tema (✈️ em post de navio não faz sentido).
- **Sentence case, aspas retas e poucos travessões.**
- **Registro por público:** landing ou post de nicho pode ser mais solto. Para o público 50+ (Melhor Idade), usar "para" em vez de "pra" e evitar gíria.
- **Um CTA principal.** Pergunta para comentar e mais um pedido leve (salvar, enviar, seguir) é o máximo.
- **Hashtags:** tirar as genéricas (#Destinos, #Brasil, #DicasDeViagem quando não há dica) e trocar pelos destinos citados. Manter #AnhangaViagens. Entre 4 e 7 no total.
- **Mostrar opinião de curadora quando couber** ("os Lençóis e o Jalapão não lembram país nenhum"), em vez de só listar.

### 3. Passar o humanizer

Invocar a skill `humanizer-pt-br` sobre o texto reescrito. Os padrões que mais aparecem nessas legendas:

- Frase de efeito ou citação motivacional ("o mundo é grande demais para…")
- Paralelismo negativo ("não é só sobre X, é Y")
- Lista de três genérica ("paisagens, culturas e experiências")
- Intervalo falso ("do charme da serra às paisagens da Amazônia")
- Frase que não diz nada ("cada lugar tem sua própria história e identidade")

Dar a pontuação do humanizer (5 dimensões, total /50).

### 4. Variações para X e Threads

Fazer quando o usuário pedir, ou oferecer se o histórico da conversa indicar que ele quer.

| Plataforma | Limite | Ajustes |
|---|---|---|
| X | 280 (emoji conta 2, link conta 23) | Versão condensada. Sem hashtags. Sem "Reels", "salva", "arrasta". |
| Threads | 500 | Quase a legenda do Instagram, sem hashtags e sem CTA específico do Instagram. |

Sempre contar com script, nunca de cabeça:

```bash
python3 - <<'EOF'
textos = {"x": """...""", "threads": """..."""}
peso_x = lambda s: sum(2 if ord(c) > 0x2FFF else 1 for c in s)
for nome, s in textos.items():
    print(nome, "len:", len(s), "peso X:", peso_x(s))
EOF
```

Indicar a contagem no título da seção (ex.: `### X (257/280)`). Se ficar a menos de 5 caracteres do limite, avisar.

### 5. Salvar

Acrescentar ao arquivo `docs/marketing/legendas-redes-sociais.md`. Ele está no `.gitignore`, então fica só na máquina local. Formato de cada post:

````markdown
## Carrossel: <tema>

**Revisada em:** DD/MM/AAAA · **Slides:** <lista, se houver> · **Pendente:** <se houver>

### Instagram (<formato>)

```text
<legenda>
```

### X (<n>/280)

```text
<versão>
```

### Threads (<n>/500)

```text
<versão>
```
````

O texto fica em bloco `text` para copiar sem formatação de markdown.

### 6. Organizar os slides (carrossel)

Quando os slides vierem de `~/Downloads` (ou outra pasta):

1. Mapear cada arquivo ao slide, pela ordem dos anexos e pelo conteúdo. Não supor que o nome do arquivo é a ordem.
2. Checar duplicados com `md5sum` (a agência já mandou `3.png` e `3(1).png` iguais).
3. Mover para uma pasta própria com nomes na ordem de postagem, usando `mv -n` para não sobrescrever:
   `~/Downloads/carrossel-<tema>/01-capa.png`, `02-<destino>.png`, …, `NN-final.png`
4. Não apagar duplicados. Avisar o usuário e deixar no lugar original.

## O que entregar ao usuário

1. A legenda final (e as variações, se pedidas)
2. **O que mudou:** bullets curtos, cada um com o motivo ligado ao guia de voz ou ao humanizer
3. Pontuação do humanizer
4. **Pontos nos slides**, se houver (gramática, maiúsculas, frases genéricas, tema x temporada), como anotação para a agência, sem pedir retrabalho da peça atual
5. Onde o arquivo foi salvo

## Feedback para a agência

Quando o usuário pedir, criar `docs/marketing/feedback-agencia-<assunto>-<mesAAAA>.md` (também no `.gitignore`). Tom de parceria:

- Começar pelo que funcionou
- Deixar claro que as peças atuais vão ao ar e que os pontos valem para as próximas
- Agrupar por tipo: conferência de tema/temporada, gramática, frases genéricas (tabela com exemplo do slide e sugestão), emoji/bandeira, CTA do último slide e processo (mandar o texto antes da arte, numerar arquivos, não exportar duplicado)
- Não linkar arquivos do repo, porque a agência não tem acesso. Sugerir enviar o `guia-de-voz.md` junto.

## Não fazer

- Reescrever ou pedir para refazer slides já prontos
- Inventar destino, dado, depoimento ou escassez
- Commitar `legendas-redes-sociais.md` ou os arquivos de feedback
- Estourar o limite de caracteres por confiar numa contagem de cabeça
