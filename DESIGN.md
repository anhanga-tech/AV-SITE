---
name: Anhangá Viagens
description: Agência boutique de viagens — cada roteiro nasce de uma conversa.
colors:
  action: "#0ea5e9"
  action-dark: "#0284c7"
  brand-blue: "#0056D2"
  brand-blue-deep: "#003B8E"
  brand-yellow: "#FFD600"
  brand-yellow-hover: "#E5C000"
  dark: "#0f172a"
  light: "#F4F8FF"
  surface: "#fffdf5"
  gray-text: "#6b7280"
  gray-border: "#e5e7eb"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(3rem, 6vw, 5rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.1
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    letterSpacing: "0.1em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.dark}"
    textColor: "#f8fafc"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.dark}"
    textColor: "#f8fafc"
    rounded: "{rounded.md}"
    padding: "14px 28px"
  button-action:
    backgroundColor: "{colors.action}"
    textColor: "#f8fafc"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-action-hover:
    backgroundColor: "{colors.action-dark}"
    textColor: "#f8fafc"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-cta:
    backgroundColor: "{colors.brand-yellow}"
    textColor: "{colors.dark}"
    rounded: "{rounded.lg}"
    padding: "16px 32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.gray-text}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  input-default:
    backgroundColor: "#ffffff"
    textColor: "{colors.dark}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  badge-default:
    backgroundColor: "#ffffff"
    textColor: "{colors.dark}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: Anhangá Viagens

## 1. Overview

**Creative North Star: "O Diário de Bordo"**

O design system da Anhangá Viagens parte de uma imagem: o caderno de viagem de alguém que viajou muito e tem histórias para contar. Não é um catálogo de destinos — é um relato pessoal, guardado com cuidado, com marcas de uso e afeto. Cada tela carrega esse peso emocional: tipografia que respira, sombras que têm presença física, cores que remetem a lugares reais (o azul do oceano, o amarelo do sol de tarde).

O sistema é ao mesmo tempo íntimo e confiante. Íntimo porque a Anhangá conhece seus clientes pelo nome; cada interação é projetada como uma conversa, não uma transação. Confiante porque a agência tem autoridade: os componentes são tácteis, têm peso, respondem ao toque com feedback visual claro. O botão CTA não apenas chama atenção — ele afunda ao pressionar, como um carimbo num passaporte.

O contexto de uso molda o visual. Clientes acessam formulários pós-viagem pelo celular à noite, em trânsito, em estado emocional receptivo. O fundo escuro (Ardósia Profunda #0f172a) não é uma escolha de categoria — é a resposta certa para esse momento de intimidade noturna. Em seções de conteúdo aberto, o sistema respira com fundos claros (Névoa de Amanhecer #F4F8FF).

Este sistema rejeita explicitamente: formulário corporativo frio, cinza neutro sem identidade, fonte do sistema, espaçamento mecânico uniforme. Também recusa o SaaS genérico de gradiente azul-roxo, glassmorphism decorativo, e o template de métricas com número grande sobre fundo gradient.

**Key Characteristics:**
- Escuro e íntimo: Ardósia Profunda (#0f172a) como base noturna em fluxos de conversação
- Sombras hard neo-brutalistas exclusivamente nos pontos de ação, nunca decorativas
- Poppins como voz única da marca: geométrica, amigável, confiante sem ser agressiva
- Âmbar Vivo (#FFD600) como sinal de urgência e calor, usado com parcimônia máxima
- Touch targets 44px+, mobile-first absoluto, acessível por padrão (WCAG AA)
- Animações com `ease-out-quart` — nada de bounce ou elastic em layout

## 2. Colors: A Paleta do Diário

Uma paleta que evoca lugares reais, não categorias de produto. Azul de oceano profundo como cor de ação; amarelo de sol de tarde como acento de energia; ardósia noturna como base que cria intimidade.

### Primary
- **Céu Vivo** (#0ea5e9): Cor de ação principal. Botões `action`, links ativos, ring de foco, border de input em foco. Referência visual imediata de que algo responde ao toque. Sky 500 no Tailwind; OKLCH canonical: `oklch(66% 0.17 233)`.
- **Céu Fundo** (#0284c7): Estado hover e pressed de Céu Vivo. Sempre acompanha como par de profundidade. Sky 600; OKLCH: `oklch(57% 0.17 235)`.

### Secondary
- **Safira Profunda** (#0056D2): Cor de identidade institucional. Presente no logo, badges azuis, superfícies que precisam de peso de marca sem a leveza do Céu Vivo. OKLCH: `oklch(45% 0.19 262)`.
- **Safira Noturna** (#003B8E): Par escuro da Safira Profunda. Hover em contextos de identidade, degradê de fundos institucionais. OKLCH: `oklch(34% 0.17 264)`.

### Tertiary
- **Âmbar Vivo** (#FFD600): O acento de energia. Exclusivo em botões CTA de alta prioridade e na variante `shadow-hard-yellow` do botão primary. Sua raridade é o que faz funcionar. OKLCH: `oklch(89% 0.19 98)`.
- **Âmbar Quente** (#E5C000): Hover e pressed do Âmbar Vivo. OKLCH: `oklch(81% 0.17 96)`.

### Neutral
- **Ardósia Profunda** (#0f172a): Fundo principal em contextos dark. Também cor de texto dos botões primary e dos labels em contexto light. Tinted neutral — não é preto. OKLCH: `oklch(18% 0.012 264)`.
- **Névoa de Amanhecer** (#F4F8FF): Fundo de seções de conteúdo aberto. Tom azulado sutilíssimo que harmoniza com a paleta de ação.
- **Superfície Quente** (#fffdf5): Separadores e superfícies com toque de calor. Usada no wave separator do Hero.
- **Cinza Texto** (#6b7280): Texto secundário, subtítulos, legendas. Nunca em headings.
- **Cinza Borda** (#e5e7eb): Bordas de inputs em repouso, divisores suaves.

### Named Rules
**A Regra do Âmbar.** O Âmbar Vivo (#FFD600) aparece em no máximo 1 elemento por tela. Ele é o grito, não o fundo. Colocado em dois lugares ao mesmo tempo, perde todo o efeito.

**A Regra do Branco Rebaixado.** Em contextos com fundo Ardósia Profunda, texto "branco" é sempre `rgba(255,255,255,0.9)` ou equivalente — nunca #ffffff pleno. O rebaixamento elimina a dureza e aumenta a sensação de profundidade.

**A Regra do Tint Neutral.** Todos os fundos neutros têm um toque da paleta de ação (o azul da Safira ou o ciano do Céu Vivo). Cinza puro sem tint é proibido em superfícies principais.

## 3. Typography

**Display & Body Font:** Poppins (com fallback `sans-serif`) — uma única família carregando toda a interface, do Hero ao parágrafo, diferenciada por peso.
**Editorial Font:** Merriweather (serif — exclusivo para blog e conteúdo longo)

**Character:** Poppins é o rosto da marca: geométrica, calorosa, confiante. O sistema usa uma família só na interface e cria hierarquia por contraste de peso (400 → 700 → 800 → 900), não por troca de tipo — disciplina que mantém a identidade coesa em telas pequenas. Merriweather guarda o blog: um registro diferente, mais lento, editorial, que só aparece em conteúdo longo. Pesos carregados: Poppins 400/600/700/900 e Merriweather 400/700 (+ itálico).

### Hierarchy
- **Display** (900, clamp(3rem, 6vw, 5rem), line-height 0.9, letter-spacing -0.02em): H1 do Hero. Ocupa espaço físico com intenção. Ênfase tipográfica via cor sólida (`text-anhanga-yellow`), nunca gradient text.
- **Headline** (800, clamp(1.5rem, 3vw, 2.5rem), line-height 1.1): Títulos de seção (H2), cabeçalhos de página (`font-display font-extrabold`). Contraste mínimo 1.25× com o nível abaixo.
- **Title** (700, 1.25rem / 20px, line-height 1.3): Subtítulos de card, labels de destaque. Poppins bold.
- **Body** (400–500, 1rem / 16px, line-height 1.6): Parágrafos corridos. Poppins peso 400. Máximo 65–75ch de largura de coluna.
- **Label** (900, 0.75rem / 12px, letter-spacing 0.1em, UPPERCASE): Badges, chips, rótulos categóricos. Poppins black com tracking largo. Nunca em texto corrido.

### Named Rules
**A Regra do Peso Duplo.** Hierarquia é criada por weight e scale juntos. Um elemento body-weight-700 ao lado de um headline cria colisão visual. Salto mínimo entre níveis adjacentes: 1.25× no tamanho OU 200 de diferença no peso.

**A Regra da Voz da Marca.** Poppins é a única voz da interface: headings, body, badges, labels, botões e inputs falam todos em Poppins. Merriweather é permitida apenas em conteúdo editorial de blog (`prose`). Trocar por fonte do sistema em qualquer posição da UI quebra a identidade.

## 4. Elevation

O sistema usa duas linguagens de sombra com papéis semanticamente distintos: **hard offset** (neo-brutalista) para elementos que demandam ação, e **float** (difusa, ambientada) para superfícies de conteúdo em repouso.

Hard shadows comunicam interatividade com peso físico. Ao interagir, o botão se move: `translate(2px, 2px)` enquanto a sombra encolhe proporcionalmente, simulando pressão real. No estado `active`, a sombra desaparece e o translate chega a `(4px, 4px)` — o carimbo foi pressionado. Superfícies que não convidam ao clique são planas ou usam `shadow-float`.

O `shadow-glow` (brilho ciano) é reservado para highlights de estado ativo em elementos específicos de marca — não usado em fluxos funcionais gerais.

### Shadow Vocabulary
- **hard** (`4px 4px 0px 0px #0f172a`): Botões CTA em repouso sobre fundos claros. Sinal de "clicável com peso físico".
- **hard-yellow** (`4px 4px 0px 0px #FFD600`): Variante do hard para o botão primary. O Âmbar Vivo como assinatura press.
- **hard-lg** (`8px 8px 0px 0px #0f172a`): Hard ampliado para elementos hero ou cards de destaque de grande formato.
- **hard-hover** (`6px 6px 0px 0px #0f172a`): Token definido para tratamentos de *lift-on-hover* (sombra cresce de 4px → 6px). Distinto do press-down dos botões, que usa offset inline `2px 2px`.
- **float** (`0 10px 40px -10px rgba(0,0,0,0.15)`): Cards, painéis, dropdowns em repouso. Presença sutil, sem peso direcional.
- **float-lg** (`0 20px 60px -15px rgba(0,0,0,0.2)`): Cards elevados, banners flutuantes de destaque.
- **glow** (`0 0 20px rgba(14,165,233,0.5)`): Highlights ciano. Somente em elementos de identidade premium ou estados de sucesso.

### Named Rules
**A Regra Hard-Only nas Ações.** Sombras com offset direcional são proibidas em qualquer elemento não-interativo. Se tem hard shadow, o usuário espera e merece poder clicar.

**A Regra do Feedback Físico.** Todo botão com hard shadow executa a sequência completa: rest `(0,0) shadow-hard` → hover `translate(2px,2px) shadow-[2px_2px]` → active `translate(4px,4px) shadow-none`. Ausência de qualquer passo quebra a ilusão de pressão física.

## 5. Components

### Buttons
*Tácteis e confiantes — botões que têm peso real e traduzem o toque em resposta física.*

- **Shape:** Varia por variante. Primary: arredondado médio (12px / `rounded-xl`). Action: pílula completa (9999px / `rounded-full`). CTA: arredondado generoso (16px / `rounded-2xl`). Ghost: arredondado suave (8px / `rounded-lg`).
- **Primary** (Ardósia Profunda, texto branco, `shadow-hard-yellow`): Para ações importantes em contexto light. Press-down com Âmbar Vivo. Tamanhos: `sm` (text-xs, px-4 py-2), `md` (text-sm, px-5 py-2.5), `lg` (text-base, px-7 py-3.5).
- **Action** (Céu Vivo, texto branco, pílula): Ações de fluxo, navegação, CTAs em contexto dark. `hover:bg-action-dark`. Sem hard shadow — a pílula já comunica interatividade.
- **CTA** (Âmbar Vivo, texto Ardósia, `shadow-hard`): O botão de conversão máxima. Reservado para o principal call-to-action de cada tela — nunca dois CTAs na mesma tela.
- **Ghost** (transparente, texto Cinza): Ações terciárias e navegação discreta. `hover:text-action`. Sem sombra, sem borda.
- **Estados:** `disabled:opacity-50 disabled:cursor-not-allowed`. Foco: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action` em todas as variantes. Loading: ícone spin `CircleNotch` do `@phosphor-icons/react`.

### Badges / Chips
*Rótulos categóricos com identidade tipográfica forte.*

- **Style:** Pílula (`rounded-full`), borda 1px, Poppins 900 12px uppercase letter-spacing 0.1em. Padding: `4px 12px`.
- **Variantes:** `default` (bg branco, borda cinza-200, texto Ardósia), `blue` (bg blue-50, borda blue-200, texto Safira Profunda), `yellow` (bg yellow-50, borda yellow-200, texto yellow-800).
- **Uso:** Rótulos de categoria no SectionHeader. Nunca como elemento de filtro clicável sem estado de foco e active explícitos.

### Cards / Containers
*Superfícies de conteúdo leve — presença sem agressividade.*

- **Corner Style:** Arredondado generoso (16px / `rounded-2xl`).
- **Background:** Branco em contexto light. Em contexto dark, não usar cards isolados — preferir seções com fundo próprio.
- **Shadow Strategy:** `shadow-float` por padrão (passivo). `shadow-hard` apenas quando o card é o CTA principal da seção. Nunca `shadow-hard` em card informativo.
- **Border:** Nenhuma. Separação via sombra ou fundo tonalizado, nunca border.
- **Internal Padding:** `p-6` (24px) padrão; `p-4` em cards compactos mobile.

### Inputs / Fields
*Campos com presença — não um retângulo genérico.*

- **Style:** Borda `2px border-gray-200`, bg branco, `rounded-xl` (12px), Poppins medium 14px, texto Ardósia.
- **Foco:** `border-action` (Céu Vivo 2px) + `outline-2 outline-action/50` via `focus-visible`. Dois sinais simultâneos de foco garantem visibilidade mesmo em contexto de alto contraste.
- **Erro:** `border-red-400`, mensagem abaixo: `text-red-500 font-semibold 12px`, com `role="alert"` para screen readers.
- **Placeholder:** `text-gray-300` — mais claro que o padrão; o label explicita o campo, o placeholder é secundário.
- **Label:** Poppins 900 12px uppercase acima do campo. Gap 6px entre label e input.

### Navigation
*Chameleon confiante — adapta o tom sem perder identidade.*

- **Hero state** (fundo transparente): texto `white/90`, botão de contato `bg-white/20 border-white/30 backdrop-blur-sm`.
- **Scrolled / internal state** (bg `white/90 backdrop-blur-md shadow-lg`): texto `gray-600 hover:text-action`, botão `bg-action hover:bg-action-dark`.
- **Typography:** Poppins medium (500) 14px, gap 6–8 entre links de navegação.
- **Transição:** `duration-500 ease-in-out` — a troca de estado é perceptível mas nunca brusca.
- **Mobile:** Menu drawer com fundo branco, botão CTA `bg-anhanga-action` (Céu Vivo) de largura total, gap 16px entre itens.

### SectionHeader (Signature Component)
*O padrão de entrada visual para cada seção — badge + headline + subtítulo com ritmo consistente.*

Badge colorido (pílula pequena) acima do H2 `font-black text-4xl leading-tight text-anhanga-dark`. Subtítulo em `text-gray-500 font-medium text-base`. Os três elementos em coluna com `gap-3`. Alinhamento center (seções completas) ou left (seções com texto corrido). O badge comunica a categoria antes que o headline revele o conteúdo.

## 6. Do's and Don'ts

### Do:
- **Do** usar Poppins em toda a interface — headings, body, badges, labels, botões e inputs. Merriweather é exclusiva para conteúdo editorial de blog.
- **Do** aplicar hard shadows exclusivamente em botões primary e CTA. O peso físico comunica interatividade — não usá-lo como decoração.
- **Do** usar o Âmbar Vivo (#FFD600) em no máximo 1 elemento por tela. Sua raridade é sua eficácia.
- **Do** manter touch targets mínimos de 44×44px em todos os elementos interativos — o acesso mobile é prioridade absoluta.
- **Do** rebaixar branco puro para `white/90` em texto sobre Ardósia Profunda. Nunca #ffffff pleno no contexto dark.
- **Do** adicionar `prefers-reduced-motion` em todas as animações de entrada (`fade-in-up`, `float`, `blob`, `popIn`).
- **Do** executar a sequência completa de press-down (rest → hover → active) em todo botão com hard shadow.
- **Do** tratar cada touchpoint como uma conversa: segunda pessoa do singular, nome do cliente quando disponível, tom caloroso sem ser informal.

### Don't:
- **Don't** usar formulário corporativo frio: cinza neutro, campos sem identidade, fonte do sistema, grid mecânico uniforme. A Anhangá não é uma OTA genérica.
- **Don't** aplicar glassmorphism decorativamente. Blur + transparência são permitidos apenas com propósito funcional claro (header sobre hero, overlay sobre mídia).
- **Don't** usar `border-left` maior que 1px como acento colorido decorativo em cards ou listas. Substituir por fundo tonalizado, borda completa, ou ícone líder.
- **Don't** usar gradient text (`background-clip: text` + `background-image: gradient`). Ênfase tipográfica via cor sólida ou peso, nunca gradiente.
- **Don't** repetir o template hero-métrica: número grande + label pequeno + gradient de fundo. É o oposto do que a Anhangá representa.
- **Don't** colocar hard shadow em elementos passivos: banners informativos, cards de conteúdo não-clicável, tooltips, dividers.
- **Don't** usar cards idênticos em grade repetida. Variar dimensão, peso tipográfico, ou hierarquia visual entre os itens.
- **Don't** ignorar o modo dark nativo. Em fluxos pós-viagem e quiz, o fundo Ardósia Profunda é intencional — não substituir por branco "para ser seguro".
