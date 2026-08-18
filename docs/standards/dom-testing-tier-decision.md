# Decisão — Terceiro nível de teste: happy-dom + @testing-library/react

**Status:** decisão de ferramental tomada e implementada (proof of concept migrado); adoção incremental caso a caso, não migração em massa.
**Origem:** issue #1362, levantada durante o grilling da unificação do módulo de FAQ (issue irmã #1358).
**Autor:** spike de engenharia solo (agente), com medições locais (Node 22.22.2 — o repo roda CI em Node 24; sem indício de que a escolha mude entre versões).

## Problema

O repo tinha dois níveis de teste: `node:test` puro (sem DOM, lógica pura) e Playwright (browser real). Não existia um nível intermediário — renderizar um componente em memória e checar o DOM real sem subir browser. Na ausência dessa opção, alguns testes faziam regex sobre o **texto-fonte** do componente em vez de sobre o comportamento renderizado (ver #1358, já corrigido via PR #1437 usando `ssr.tsx` + extração de JSON-LD — sem precisar de DOM em memória) e `tests/orlando-imagens.test.ts` (regex sobre `OrlandoParksGallery.tsx` para provar ausência de `srcSet` e presença do nome do parque como `<h3>`).

## Decisão

Adotar **happy-dom + `@testing-library/react`** como terceiro nível, para o caso específico de "componente renderiza X no DOM" quando esse comportamento não depende de rota/SSR completo (que já é coberto por `ssr.tsx` + `node:test`, sem DOM) nem de acessibilidade real de browser (que só Playwright prova).

### jsdom vs. happy-dom — medição

Ambos foram instalados e testados de verdade contra `OrlandoParksGallery.tsx` (render real + clique com `fireEvent`, via `@testing-library/react`) rodando sob `tsx --test`, o test runner deste repo (não Vitest/Jest):

| | jsdom | happy-dom |
|---|---|---|
| Tamanho em disco (`node_modules/`) | 9.1 MB | 20 MB |
| Dependências diretas | 21 pacotes | 7 pacotes |
| Tempo de wall-clock do mesmo arquivo de teste (3 execuções) | 3.23s / 3.40s / 3.41s | 2.17s / 2.23s / 2.39s |
| Compatibilidade no smoke test (render, `fireEvent.click`, `aria-hidden`, `h3` visível) | ✅ sem ajuste além do setup padrão | ✅ sem ajuste além do setup padrão |

happy-dom venceu em velocidade por ~1s por arquivo (~30-40%) apesar de ser maior em disco — a diferença vem do número de módulos resolvidos no import (happy-dom é um pacote mais monolítico; jsdom se apoia em ~20 dependências menores como `whatwg-url`, `cssstyle`, `tough-cookie`). Como `node:test` roda cada arquivo de teste em processo separado (isolamento default do runner), esse custo de import é pago **por arquivo**, não uma vez só — importa mais aqui do que num runner com processo compartilhado (Vitest/Jest).

Nenhum dos dois implementa `IntersectionObserver`/`ResizeObserver` nativamente — ambos exigiriam mock manual no setup para os componentes que dependem disso (`components/ui/LazyImage.tsx`, `components/landings/lollapalooza/hooks/useIntersectionObserver.ts`, etc.). Isso não diferencia a escolha; é um custo de qualquer DOM em memória, jsdom incluso.

**Por que happy-dom, apesar de jsdom ser o padrão mais usado (Jest, ecossistema RTL em geral):** o adendo do próprio issue já descarta a fidelidade de acessibilidade como critério de desempate — nenhum dos dois reproduz a árvore de acessibilidade de um browser real com fidelidade suficiente para provas do tipo "o painel realmente sai da árvore de acessibilidade" (`tests/e2e/orlando-a11y.spec.ts` continua sendo a fonte de verdade para isso, não este nível). Com esse critério fora da mesa, a decisão fica entre velocidade (happy-dom) e maturidade/robustez em casos de borda (jsdom, mais anos de bugs de compatibilidade resolvidos, base de uso muito maior). Como o uso pretendido aqui é deliberadamente pequeno — não uma migração de suíte inteira — a maturidade extra de jsdom pesa menos do que o tempo pago em CI por arquivo. Se um componente específico expuser uma lacuna de compatibilidade do happy-dom (foram documentadas historicamente em formulários complexos, `<canvas>`, certas APIs de CSSOM), a mitigação é trocar `tests/helpers/dom-setup.ts` por jsdom **só naquele arquivo de teste** — nada no design impede misturar, já que cada arquivo `node:test` é isolado em processo próprio.

### Impacto medido no tempo de CI

`pnpm test:regression` completo (1041 testes, incluindo o arquivo migrado), 3 execuções em cada estado, mesma máquina, cache quente em ambos:

| | antes (regex, sem DOM) | depois (happy-dom, 1 arquivo migrado) |
|---|---|---|
| wall-clock | 36.8s / 33.5s | 31.6s / 31.9s / 33.6s |
| `duration_ms` reportado pelo runner | 27.7s / 28.8s | 26.9s / 27.1s / 29.1s |

Diferença não mensurável acima do ruído de execução-a-execução — para uma migração pontual de um arquivo, o custo de CI é irrelevante. Isso é esperado: `node:test` já paga o custo de spawnar um processo por arquivo independente de haver DOM ou não; o `render()` em si soma dezenas de milissegundos por teste (ver tabela de smoke test acima), não segundos.

## O que migrou nesta PR (prova de conceito)

`tests/orlando-imagens.test.ts`: os dois testes que provam comportamento renderizado (`srcSet` ausente, nome do parque como `<h3>` visível) passaram a montar `OrlandoParksGallery` de verdade via `render()` e checar o DOM, em vez de regex sobre o texto-fonte do componente. Verificado que o teste migrado **pega a regressão real**: reintroduzir `srcSet={optimizeRemoteImageUrl(...)}` no componente faz o teste falhar (checado manualmente, revertido antes do commit).

## Limites — o que não migra bem para este nível

O terceiro teste do mesmo arquivo (`"a foto do parque é pedida sem height..."`) **permanece em regex de propósito** — não é um caso de migração adiada, é um caso que este nível não resolve. A asserção é sobre qual **argumento** o componente passa para `optimizeRemoteImageUrl` (a largura, sem height), não sobre o que aparece no DOM: com `VITE_MEDIA_ENABLE_TRANSFORMS` desligado (o padrão fora do Vite, incluindo este processo de teste), a URL renderizada é idêntica não importa qual preset a chamada resolveria — nem DOM em memória nem Playwright enxergam essa diferença, só o texto-fonte prova o argumento real.

`node:test` tem `mock.module()` (via a flag `--experimental-test-module-mocks`) que resolveria isso interceptando `optimizeRemoteImageUrl` e checando os argumentos da chamada real — testado à parte neste spike, funciona. Mas a flag é global ao processo `tsx --test`, então adicioná-la ao `test:regression` para beneficiar um único teste é uma mudança de escopo maior (nova capacidade de mock em toda a suíte) do que o que esta issue pediu para avaliar. Fica registrado como follow-up condicional, não como parte desta decisão.

## Como usar (para quem for adicionar o próximo teste deste nível)

1. Arquivo de teste normal em `tests/*.test.ts` (mesmo padrão dos outros — sem extensão `.tsx`: os testes existentes usam `React.createElement` em vez de JSX porque o `test:regression` roda contra `tests/*.test.ts`, e JSX exige `.tsx` para o parser do `tsx`/esbuild).
2. Primeira linha do arquivo: `import './helpers/dom-setup.ts';` — precisa rodar antes de qualquer `render()`, mas não precisa ser literalmente a primeira declaração de import (o setup só precisa terminar de avaliar antes da fase de execução dos testes, que já acontece depois de todos os imports do módulo).
3. `import { render, cleanup, fireEvent } from '@testing-library/react';` e `import { afterEach } from 'node:test'; afterEach(cleanup);` no topo do arquivo — sem isso, DOM de um teste vaza para o próximo dentro do mesmo arquivo.
4. Preferir os mesmos princípios de `docs/standards/testing.md` (testar comportamento observável, não detalhe de implementação): buscar por texto/role visível (`container.querySelector('h3')`, `getByRole`), não por classes CSS ou estrutura interna frágil.
5. Use este nível quando o comportamento depende de **render + interação de componente isolado** (estado local, toggle, o que aparece como texto/atributo no DOM) e não depende de composição de rota inteira (isso já é coberto por `ssr.tsx` sem precisar de DOM em memória, ver `tests/parques-brasil-hub.test.ts`) nem de semântica de acessibilidade real de browser (Playwright, `tests/e2e/*-a11y.spec.ts`).

## O que não fazer

Esta issue foi deliberadamente escopada como avaliação de ferramental, não como migração de suíte. Não se deve, como efeito colateral de nenhuma feature futura, reescrever em massa os testes `node:test` existentes que já funcionam bem sem DOM (a maioria da suíte é lógica pura, validação e contrato de API — nenhum desses precisa de DOM em memória). Este nível existe para o caso específico onde a alternativa hoje é regex sobre texto-fonte ou subir Playwright para algo que não precisa de browser real.
