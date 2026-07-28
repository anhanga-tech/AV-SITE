# Créditos das imagens — `/melhor-idade`

Fotos do Pexels (licença Pexels: uso comercial livre, atribuição não obrigatória).
Registradas aqui para rastreabilidade e para facilitar a substituição por fotos
reais de clientes quando houver acervo próprio com autorização de uso.

| Arquivo | Origem | Descrição |
|---|---|---|
| `hero-desktop-1600.webp` / `hero-desktop-1100.webp` | https://www.pexels.com/photo/11299597/ | Recorte paisagem: casal apontando para a vista de uma cidade, céu aberto à esquerda para o texto do hero |
| `hero-mobile-800.webp` | https://www.pexels.com/photo/11299597/ | Recorte retrato da mesma foto, enquadrado no casal |
| `ritmo-ferry-1400.webp` / `-700.webp` | https://www.pexels.com/photo/32638510/ | Casal num ferry ao entardecer, apontando para a orla |
| `curadoria-loja-1400.webp` / `-700.webp` | https://www.pexels.com/photo/8201182/ | Casal escolhendo chapéu numa loja durante a viagem |

## Critério de seleção

Pessoas **em atividade e em momentos concretos de viagem**, nunca posando para a câmera
nem em cenário de "terceira idade" estereotipado. É o mesmo critério que sustenta a
fotografia de operadoras especializadas em 50+ como Road Scholar e Saga, usadas como
referência na curadoria que originou este pivô de design.

## Por que dois recortes do hero

A foto original é retrato. Servida como asset único num hero largo e baixo, o
`object-cover` cortava as cabeças do casal e todo o céu que segura o texto em viewports
de 1440px ou mais. O `<picture>` alterna entre o recorte paisagem (desktop) e o retrato
(mobile), e o mobile carrega 16 KB em vez dos 300 KB do JPG original.

## Substituição futura

O ideal é trocar por fotos de clientes reais da Anhangá. Mantendo os mesmos nomes de
arquivo e proporções, nenhum código precisa mudar.

## Pendência conhecida

Estes arquivos estão versionados em `public/` em vez de servidos pelo bucket R2
(`media.anhanga.tur.br` + `optimizeRemoteImageUrl`), que é o padrão das demais landings.
A migração para o R2 depende de acesso ao bucket e está registrada como follow-up na
PR #1316.
