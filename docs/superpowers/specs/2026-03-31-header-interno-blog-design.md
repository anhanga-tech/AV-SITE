# Header Interno Compacto e Correcoes de Hero no Blog

- Data: 2026-03-31
- Status: aprovado para planejamento
- Decisao visual: opcao A

## Contexto

O site principal usa um `Header` fixo compartilhado entre home, blog e paginas institucionais. Fora da home, esse header hoje e forcado para uma versao branca fixa com altura visual alta.

Na pratica, isso gera dois efeitos ruins:

1. o topo das paginas internas perde area util logo no primeiro viewport
2. no blog, especialmente em artigos com titulos longos, o header invade a leitura e reduz a legibilidade

Medicao do estado atual:

- home desktop: header com cerca de 152px no topo
- paginas internas desktop: header com cerca de 128px
- artigo do blog mobile `390x844`: o titulo entra aproximadamente 76px sob o header

## Objetivo

Reduzir a massa visual do header fixo nas paginas internas sem mexer na experiencia da home, preservando a navegacao persistente e devolvendo legibilidade ao topo do blog em mobile e desktop.

## Nao objetivos

- redesenhar o header da home
- trocar o comportamento fixo por header em fluxo normal nas paginas internas
- refatorar o shell inteiro do site
- alterar a linguagem visual central do blog alem do necessario para recuperar hierarquia e leitura

## Decisao

Adotar uma variante interna compacta e permanente do header para todas as paginas do shell principal fora da home.

Essa variante deve:

- manter fundo branco transluzido, blur e sombra leve
- usar menos altura vertical
- reduzir tamanho do logo, espacamento entre itens e densidade do CTA
- continuar fixa no topo durante a leitura

No blog, essa decisao sera acompanhada de compensacao explicita no hero e no topo da listagem, para que o conteudo comece abaixo do header com folga consistente.

## Direcao de UX

### 1. Header nas paginas internas

O header interno deve transmitir presenca e controle, mas sem competir com o conteudo principal. A leitura desejada e de uma barra editorial enxuta, nao de um bloco promocional alto.

Mudancas esperadas:

- reduzir `py` e altura visual geral
- reduzir altura do logo em paginas internas
- reduzir `gap` da navegacao desktop
- manter CTA visivel, mas com menos peso vertical
- manter menu mobile funcional com a mesma arquitetura atual

### 2. Blog list

A pagina de listagem nao deve depender de um `pt-32` ajustado no limite. O topo precisa respeitar a altura real do header compacto, com margem suficiente para que selo, titulo e busca respirem no primeiro viewport.

Resultado desejado:

- titulo da listagem claramente abaixo do header
- primeira dobra mais leve
- sensacao de pagina editorial, nao de conteudo empurrado para baixo arbitrariamente

### 3. Blog post

O hero do artigo precisa absorver a presenca do header fixo sem sacrificar o titulo.

Mudancas esperadas:

- aumentar o respiro superior util do bloco de conteudo do hero
- reduzir a escala do `h1` em mobile
- suavizar a escala do `h1` para titulos longos em desktop
- preservar a forca visual da imagem e da categoria sem deixar o titulo colidir com o topo

O artigo deve continuar abrindo com impacto, mas agora com leitura imediata.

## Estrategia tecnica

Arquivos provaveis:

- `components/Header/Header.tsx`
- `pages/BlogList.tsx`
- `pages/BlogPost.tsx`

Abordagem:

1. introduzir uma nocao clara de variante interna compacta no `Header`
2. manter a home com o comportamento atual
3. atualizar os espacamentos do topo do blog para responder a essa variante
4. adicionar regressao automatizada para garantir que o titulo do artigo nao fique sob o header

## Criterios de aceitacao

### Home

- a home preserva o comportamento atual do header transparente e expandido no topo

### Paginas internas

- o header fora da home fica visualmente menor que o estado atual
- a navegacao desktop continua funcional
- o menu mobile continua funcional
- o CTA continua visivel e acionavel

### Blog list

- em desktop e mobile, o `h1` da listagem aparece abaixo do header com folga visivel
- o topo da pagina nao parece comprimido pelo header

### Blog post

- em mobile `390x844`, o topo do `h1` fica abaixo da borda inferior do header com pelo menos `16px` de folga
- em desktop `1440x1100`, o topo do `h1` fica abaixo da borda inferior do header com pelo menos `24px` de folga
- titulos longos continuam legiveis sem parecerem esmagados no primeiro viewport

## Testes e validacao

- adicionar ou atualizar teste Playwright para validar a relacao espacial entre `site-header` e `h1` em artigo do blog
- rodar:
  - `pnpm typecheck`
  - `pnpm test:e2e`

Se o conjunto completo de `test:e2e` for pesado demais para o ciclo inicial, pelo menos a cobertura nova do bug deve ser executada antes de concluir a implementacao.

## Riscos

- reduzir demais o header pode enfraquecer a presenca da marca
- ajustar so o hero sem compactar o header resolveria o sintoma, mas nao o problema sistemico das paginas internas
- usar compensacoes diferentes demais entre listagem e artigo pode quebrar consistencia

## Guardrails

- manter a arquitetura atual de roteamento e shell
- evitar criar um segundo sistema de layout fora do `Header` atual
- aplicar apenas o necessario nas paginas tocadas
