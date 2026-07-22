# Credencial Pastore na landing Melhor Idade

## Objetivo

Adicionar uma prova de confiança específica para o público 50+ à landing
`/melhor-idade/`, comunicando a parceria comercial já confirmada entre a
Anhangá Viagens e a Pastore Turismo.

## Escopo

- Exibir somente a credencial textual `Parceira Pastore Turismo`.
- Posicioná-la na seção `Por que planejar sua viagem 50+ com a Anhangá?`,
  imediatamente abaixo do título e antes do conteúdo editorial.
- Reutilizar o padrão visual das credenciais de `/consultoria-de-viagem/`:
  pill branca, borda fina, cantos totalmente arredondados, ícone de confirmação
  e nenhuma sombra.
- Usar os tokens Tailwind canônicos `anhanga-*` no novo código.

## Fora do escopo

- Alterar o FAQ ou outro conteúdo editorial da landing.
- Adicionar todas as demais parcerias da Anhangá. Cadastur, Beto Carrero World,
  Hopi Hari e Norwegian Cruise Line já são apresentados no contexto institucional
  da página `/sobre/`; repeti-los aqui diluiria a credencial relevante ao público
  50+.
- Criar um componente compartilhado ou um novo padrão visual para uma única pill.
- Adicionar logotipo, link externo ou alegações além do wording confirmado pela
  issue.

## Comportamento e acessibilidade

A credencial será conteúdo informativo, não um controle interativo. Ela será
renderizada como texto com ícone decorativo marcado com `aria-hidden="true"`.
O contêiner será centralizado e dimensionado pelo conteúdo, sem largura fixa,
para não provocar overflow em telas estreitas.

## Testes e validação

O fluxo será implementado com TDD:

1. Adicionar um teste de regressão que exija a credencial na landing e valide o
   padrão sem sombra; confirmar que ele falha antes da implementação.
2. Inserir a pill na seção definida e confirmar que o teste passa.
3. Executar o teste focado, a suíte de regressão, `pnpm typecheck` e
   `pnpm lint:changed`.
4. Fazer uma verificação browser-visible em viewport mobile estreita para
   confirmar visibilidade e ausência de overflow horizontal.

## Critérios de aceite

- `Parceira Pastore Turismo` aparece na seção `Por que planejar sua viagem 50+
  com a Anhangá?`.
- A credencial segue a linguagem visual de pill com borda e sem sombra já usada
  na landing de consultoria.
- A landing não apresenta overflow nem quebra de layout em mobile estreito.
- Nenhum FAQ ou conteúdo fora da credencial é alterado.
