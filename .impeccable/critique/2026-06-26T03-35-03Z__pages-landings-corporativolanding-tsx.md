---
target: a página corporativo
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-06-26T03-35-03Z
slug: pages-landings-corporativolanding-tsx
---
## Design Health Score — /corporativo

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Form cobre submitting/success/error; globe sem indicação de loading |
| 2 | Match System / Real World | 4 | PT-BR claro e direto, sem jargão |
| 3 | User Control and Freedom | 3 | Dois caminhos (WhatsApp/form); globe auto-rotaciona sem controle |
| 4 | Consistency and Standards | 3 | Botões consistentes; proliferação de tons pastel quebra a paleta |
| 5 | Error Prevention | 3 | Validação + LGPD obrigatório |
| 6 | Recognition Rather Than Recall | 4 | Fluxo simples, nada a memorizar |
| 7 | Flexibility and Efficiency | 3 | Atalho WhatsApp + form |
| 8 | Aesthetic and Minimalist Design | 2 | Hero sobrecarregado (globe+arcos+grid+noise+type gigante); excesso de acentos |
| 9 | Error Recovery | 3 | Mensagens de erro presentes, genéricas |
| 10 | Help and Documentation | 3 | Contato visível; launcher "Roteiro IA" global |
| **Total** | | **31/40** | **Sólido, com teto claro no hero** |

## Anti-Patterns Verdict

**Não parece "feito por IA".** A página tem identidade própria e comprometida: botões neo-brutalistas com sombra dura de 4px, cards de pilares em estética "scrapbook" (fita washi no topo, rotação leve, número ordinal gigante atrás), hero com globo WebGL e paleta navy+amarelo confiante. Nada de card-grid genérico nem hero-metric template.

**Scan determinístico (detect.mjs):** 0 ocorrências em `components/landings/corporativo`, `pages/landings/CorporativoLanding.tsx` e `components/landings/shared` (exit 0). Nenhum padrão de slop (gradient-text, side-stripe, eyebrow automático, glassmorphism) detectado no markup.

**Evidência de browser:** screenshots desktop (1280/1600×900) e mobile (375×812), checagem de dobra e contraste via estilos computados. O overlay visual não rodou de forma confiável fora do hero (a camada WebGL do globo produz frames pretos no compositor de screenshot); a verificação das seções inferiores foi feita por estilos computados + medições de DOM, que renderizam corretamente.

## Overall Impression

Uma landing B2B com craft acima da média e personalidade real — raro. O problema não é falta de talento, é **dosagem no hero**: o headline de 96px em 5 linhas + o globo estourado de brilho consomem a dobra inteira no desktop e empurram os CTAs principais para baixo dela. A maior oportunidade é disciplinar o hero (tipo menor, globo mais contido) para que a primeira ação caiba na primeira tela — sem tocar na identidade.

## What's Working

1. **Sistema de botão neo-brutalista coeso.** A sombra dura de 4px com deslocamento no hover/active (`translate-x/y` + `shadow` reduzindo) dá feedback tátil consistente em nav, hero, banda e form. É uma assinatura, não enfeite.
2. **Cards de pilares com voz.** Fita washi, rotação `rotateDeg` por card, número ordinal atrás e hover com spring são um partido autoral que escapa do card-grid idêntico. Bom uso de motion com propósito.
3. **Hero mobile.** Em 375px o headline encaixa sem overflow (48px), CTAs prominentes e badges logo abaixo. Hierarquia limpa e conversão clara — é o hero que o desktop deveria espelhar.

## Priority Issues

### [P1] CTAs do hero abaixo da dobra no desktop
- **O que:** Headline em `xl:text-8xl` (96px) × 5 linhas com `leading-[0.9]` ocupa a viewport inteira. Medido: topo do botão "Falar no WhatsApp" do hero em ~826px; abaixo da dobra em 900px e 720px. Acima da dobra só sobra o botão do nav.
- **Por que importa:** É uma landing de geração de lead. A ação primária precisa estar visível sem rolar. No desktop, o visitante vê só tipografia gigante e o globo — a primeira chamada para ação exige scroll.
- **Fix:** Reduzir o teto do clamp do H1 (cap em ~`text-6xl`/`text-7xl`, 60–72px), e/ou reescrever para 3–4 linhas, e enxugar `pt-24 pb-28`. Meta: subtexto + os dois CTAs + badges acima de ~820px de altura.
- **Comando sugerido:** `/impeccable layout`

### [P2] O globo domina e estoura as cores de marca
- **O que:** Globo dimensionado em 1520px com `right:-600px` ocupa ~55–60% da largura do hero e avança visualmente sobre o headline. O `filter: brightness(2.8) contrast(1.1) saturate(1.4)` lava os arcos (definidos em amarelo + ciano no código) para quase-branco e cria uma zona de alto brilho (limbo solar da textura earth-night) competindo com o título.
- **Por que importa:** O globo deveria contar a história "conectamos sua empresa a destinos"; estourado, vira textura decorativa e os arcos perdem a cor da marca. Soma-se a grid + noise + badges + tipo gigante = hero ocupado demais.
- **Fix:** Baixar `brightness` para ≤1.6, reduzir escala/reposicionar para que o globo seja claramente ~1/3, reforçar a máscara à esquerda e deixar os arcos manterem amarelo/ciano.
- **Comando sugerido:** `/impeccable quieter`

### [P2] Proliferação de acentos pastel dilui o navy+amarelo
- **O que:** Pilares usam azul/esmeralda/laranja; processo usa sky/âmbar/esmeralda; mais o ciano e amarelo de marca. São 6+ matizes pastel de peso igual ao longo da página.
- **Por que importa:** A identidade forte é navy + amarelo. O acúmulo de pastéis "amigáveis" puxa a página para o genérico-SaaS-simpático e enfraquece a voz que o hero estabelece.
- **Fix:** Restringir os acentos às 2–3 cores próprias da marca (navy/ciano/amarelo) ou usar um único acento por seção em vez de três por seção.
- **Comando sugerido:** `/impeccable colorize`

### [P2] Eyebrow repetido como gramática de seção
- **O que:** Toda seção abre com o mesmo micro-label skewed em caixa-alta tracked: "VIAGENS PARA EMPRESAS" → "O JEITO ANHANGÁ" → "SIMPLES ASSIM" → "BATE-PAPO RÁPIDO" → "FALE COM A GENTE".
- **Por que importa:** É um device de marca deliberado (não slop puro), mas 5 em sequência viram andaime. O guia trata "eyebrow acima de toda seção" como gramática de IA quando vira reflexo.
- **Fix:** Variar a cadência — manter o eyebrow só onde ele carrega informação (hero, contato) e deixar pilares/processo entrarem direto pelo H2.
- **Comando sugerido:** `/impeccable distill`

### [P3] Contraste do placeholder dos campos
- **O que:** Inputs usam `placeholder-zinc-400` (#9f9fa9) = **2,62:1** sobre branco. Abaixo do mínimo 4,5:1.
- **Por que importa:** Placeholder precisa do mesmo 4,5:1 de texto de corpo; abaixo disso some para quem tem baixa visão.
- **Fix:** Subir para `placeholder-zinc-500` (4,74:1).
- **Comando sugerido:** `/impeccable polish`

## Persona Red Flags

**Sofia (Sócia/RH de pequena empresa, decisora, no desktop):** chega pela campanha, vê um headline lindo e um globo — mas precisa rolar para achar "Falar no WhatsApp" ou "Prefiro ser contatado". O caminho de conversão exige scroll na primeira interação. O botão do nav salva parcialmente, mas a intenção do hero (dois CTAs grandes) está escondida.

**Marina (Assistente, mobile, com pressa):** experiência boa. Headline encaixa, CTAs grandes e claros. Único ruído: o launcher de chat flutuante "Roteiro IA" + a seta voltar-ao-topo sobrepõem os badges do hero no canto inferior, somando uma 3ª/4ª chamada de ação que compete com os CTAs da própria página.

## Minor Observations

- **Eyebrow do hero está "barrento":** `bg-brand-yellow/30` sobre o navy vira um oliva opaco; o amarelo perde a força. Os outros eyebrows (esmeralda sobre branco) ficam limpos. Considere fundo amarelo sólido ou um tratamento diferente só no hero.
- **Dois widgets fixos globais com z-index arbitrário (9990 e 9980):** o guia desaconselha valores como 999/9999; idealmente uma escala semântica de z-index. São elementos globais, provavelmente fora do escopo direto da página, mas competem com os CTAs.
- **`fadeUp` usa `whileInView` com `initial="hidden"` (opacity 0):** o conteúdo das seções inferiores depende do reveal por scroll; em renderizadores headless/prerender o reveal pode não disparar. Vale confirmar que o prerender entrega o conteúdo visível por padrão.
- **Globe carrega textura de `//unpkg.com`** (`earth-night.jpg`) — dependência de CDN de terceiros no caminho do hero; um host próprio (R2) seria mais resiliente.

## Questions to Consider

- E se o headline fosse 30% menor — o hero perderia impacto, ou ganharia foco ao deixar os CTAs respirarem na dobra?
- O globo precisa ser tão grande e brilhante para comunicar "destinos no mundo", ou um globo menor e mais escuro com arcos amarelos vivos contaria melhor a história?
- A página tem três/quatro canais de ação (WhatsApp no nav, WhatsApp no hero, "ser contatado", launcher de chat global). Qual é o caminho que vocês querem que 80% converta — e os outros estão ajudando ou competindo?
