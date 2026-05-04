export const config = { runtime: 'edge' };

import { FAQ_SCHEMA_ITEMS } from '../data/faqData';

const SITE_BASE = 'https://www.anhanga.tur.br';

function tokenCount(text: string): number {
    return Math.ceil(text.length / 4);
}

function markdownResponse(body: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'x-markdown-tokens': String(tokenCount(body)),
            'Vary': 'Accept',
            'Cache-Control': status === 200
                ? 'public, max-age=3600, stale-while-revalidate=86400'
                : 'no-cache, no-store, must-revalidate',
        },
    });
}

// Content duplicated from JSX components intentionally — separate Markdown source for LLM/agent consumption
function homePage(): string {
    const faqSection = FAQ_SCHEMA_ITEMS.map(
        ({ question, answer }) => `### ${question}\n\n${answer}`
    ).join('\n\n');

    return `# Anhangá Viagens — Agência de Turismo Boutique

**Site:** ${SITE_BASE}
**Cadastur:** 37.036.732/0001-41
**Atendimento:** chatbot IA + especialistas humanos, disponível 24h

Agência boutique especializada em roteiros 100% personalizados para destinos nacionais e internacionais.

## Serviços

- Roteiros 100% personalizados — sem pacotes prontos
- Atendimento humano por especialistas de viagem
- Suporte 24/7 via WhatsApp (botão de pânico disponível)
- Emissão de passagens, hotéis, ingressos e passeios
- Tratamento de vistos e documentação internacional
- Turismo 50+ / Melhor Idade — ritmo desacelerado, conforto e acessibilidade
- Pacotes para festivais (Lollapalooza) e parques temáticos (Beto Carrero World, Hopi Hari)

## Destinos

| Destino | País | Avaliação | A partir de |
|---------|------|-----------|-------------|
| Orlando | EUA | ⭐ 4.98 | R$ 15.000 |
| Punta Cana | Rep. Dominicana | ⭐ 4.95 | R$ 3.800 |
| Cancún | México | ⭐ 4.89 | R$ 4.100 |
| Beto Carrero World | Brasil | ⭐ 4.92 | R$ 1.200 |
| Gramado | Brasil | ⭐ 4.91 | R$ 2.200 |
| Rio de Janeiro | Brasil | ⭐ 4.93 | R$ 1.900 |
| Natal | Brasil | ⭐ 4.92 | R$ 2.300 |
| Cusco / Machu Picchu | Peru | ⭐ 4.98 | R$ 4.200 |
| Santiago | Chile | ⭐ 4.88 | R$ 3.500 |
| Cartagena | Colômbia | ⭐ 4.90 | R$ 3.900 |
| Paris | França | ⭐ 4.92 | R$ 6.200 |
| Lisboa | Portugal | ⭐ 4.96 | R$ 5.500 |

## Como funciona (4 passos)

1. **Oie! Vamos conversar?** — Você nos conta seus sonhos e orçamento via chatbot IA
2. **Desenhando o Sonho** — Especialistas criam um roteiro dia a dia personalizado
3. **Burocracia? Deixa com a gente** — Emitimos voos, hotéis e passeios, parcelamos
4. **Fui! Partiu Viajar** — Você recebe os vouchers organizados com suporte de plantão 24h

## Perguntas Frequentes

${faqSection}

## Páginas Especializadas

- Beto Carrero World: ${SITE_BASE}/beto-carrero
- Lollapalooza Brasil: ${SITE_BASE}/lollapalooza
- Orlando / Disney / Universal: ${SITE_BASE}/orlando
- Turismo Melhor Idade (50+): ${SITE_BASE}/melhor-idade
`;
}

function lollapaloozaPage(): string {
    return `# Lollapalooza Brasil — Anhangá Viagens

**URL:** ${SITE_BASE}/lollapalooza
**Status:** Campanha 2026 encerrada. Lista de espera para 2027 aberta.

## Sobre

A Anhangá Viagens é especialista em pacotes para o Lollapalooza Brasil. A operação da edição 2026 foi encerrada com sucesso e disponibilidade esgotada. Esta página concentra a lista de espera para a próxima edição.

## Lista de espera 2027

Quem se cadastra nesta página recebe aviso prioritário quando os pacotes para o Lollapalooza Brasil 2027 abrirem. Cadastro disponível em: ${SITE_BASE}/lollapalooza

## Perguntas Frequentes

### Os pacotes para o Lollapalooza 2026 estão esgotados?

Sim. A campanha de pacotes 2026 foi encerrada com disponibilidade esgotada. Mantivemos esta página ativa para orientar quem pesquisou pela edição atual e abrir a lista de espera da edição 2027.

### Como funciona a Lista de Espera Lolla 2027?

Você deixa nome e e-mail nesta página e a Anhangá entra em contato quando a próxima campanha abrir. Isso ajuda a priorizar quem já demonstrou interesse na experiência do festival.

### Qual a melhor região para se hospedar durante o festival?

As regiões com acesso facilitado à Linha 9 - Esmeralda, além de bairros como Pinheiros e Vila Olímpia, seguem sendo as mais estratégicas para quem quer logística inteligente nos dias de evento.

### Posso montar um pacote personalizado para 2027?

Sim. A lista de espera serve justamente para identificar quem quer prioridade quando retomarmos orçamento, hospedagem e operação para a próxima edição do Lollapalooza.
`;
}

function betoCarreroPage(): string {
    return `# Pacote Beto Carrero World — Anhangá Viagens

**URL:** ${SITE_BASE}/beto-carrero
**A partir de:** R$ 1.200 a R$ 1.800 por pessoa
**Avaliação:** ⭐ 5.0

## Sobre

Beto Carrero World é o maior parque temático da América Latina, localizado em Penha, Santa Catarina. A Anhangá oferece pacotes completos com hotel próximo, ingressos e, opcionalmente, transfers. Somos parceiros credenciados oficiais do parque.

## O que está incluído nos pacotes

- Ingressos oficiais Beto Carrero World (parceiro credenciado)
- Hospedagem em hotéis próximos ao parque (várias categorias)
- Opção de transfer privativo ou coletivo
- Roteiro sugerido por especialistas
- Suporte 24h via WhatsApp durante a viagem

## Principais atrações

- Hot Wheels (família e crianças)
- FireWhip (montanha-russa radical)
- Zoológico interno
- Área temática Madagascar

## Perguntas Frequentes

### Quanto custa em média um pacote para o Beto Carrero?

O valor varia conforme a temporada e o tipo de hospedagem, mas pacotes personalizados que incluem hotel próximo e ingressos costumam começar em torno de R$ 1.200 a R$ 1.800 por pessoa, dependendo da origem e duração.

### Qual a idade recomendada para visitar o parque?

O Beto Carrero World possui atrações para todas as idades. Desde a área temática da Hot Wheels e Madagascar para os pequenos, até montanhas-russas radicais como a FireWhip para os mais velhos. É um destino perfeito para famílias com crianças de todas as faixas etárias.

### Como funciona o estacionamento no Beto Carrero?

O parque oferece um amplo estacionamento oficial pago e seguro. Para quem quer mais comodidade, nossos pacotes podem incluir transfers privativos ou coletivos saindo direto do hotel, eliminando preocupações com trânsito e vagas.

### Qual a duração ideal para viajar ao Beto Carrero?

Para aproveitar o parque com conforto e conhecer as principais atrações, recomendamos roteiros de 3 a 4 dias, permitindo pelo menos 2 dias inteiros dentro do parque.
`;
}

function orlandoPage(): string {
    return `# Pacotes para Orlando — Anhangá Viagens

**URL:** ${SITE_BASE}/orlando
**A partir de:** R$ 15.000
**Avaliação:** ⭐ 4.98

## Sobre

Orlando é a capital mundial da diversão. A Anhangá planeja viagens completas incluindo Disney World, Universal Studios, compras nos outlets e toda a logística para que você foque apenas em aproveitar.

## O que está incluído nos pacotes

- Passagens aéreas (consultadas para o melhor preço do dia)
- Hospedagem em hotéis próximos aos parques ou resorts dentro da Disney
- Ingressos para Disney e Universal (com orientação sobre Genie+ e Lightning Lane)
- Roteiro personalizado dia a dia
- Orientação para visto americano (documentação e prazos)
- Suporte 24h via WhatsApp durante a viagem

## Perguntas Frequentes

### Qual a melhor época para viajar para Orlando?

Para quem busca economia e parques menos cheios, os meses de maio, setembro e final de outubro são excelentes. Se o foco for clima agradável e eventos sazonais, novembro e dezembro oferecem a magia das festas, embora com maior movimento.

### Preciso de visto americano para viajar para Orlando?

Sim, cidadãos brasileiros necessitam de visto americano válido. Nossa equipe orienta sobre os passos necessários e prazos recomendados para que você organize sua documentação com antecedência e segurança.

### A Anhangá oferece suporte se eu tiver algum problema lá fora?

Sim. Nosso diferencial é o suporte especializado 24h via WhatsApp. Seja um ajuste no roteiro, dúvida em um hotel ou qualquer imprevisto, nossa equipe está pronta para te atender em tempo real.

### É a nossa primeira viagem. Vocês ajudam com o roteiro detalhado?

Com certeza. Entregamos um roteiro personalizado dia a dia, indicando quais parques visitar primeiro, dicas de filas (Genie+ e Lightning Lane) e até sugestões de restaurantes onde as crianças mais se divertem.

### Qual a duração ideal de uma viagem para Orlando?

Para conseguir visitar os principais parques da Disney e Universal com calma, recomendamos uma estadia de 10 a 14 dias. Isso permite intercalar dias intensos de parque com dias de descanso ou compras.
`;
}

function melhorIdadePage(): string {
    return `# Turismo 50+ / Melhor Idade — Anhangá Viagens

**URL:** ${SITE_BASE}/melhor-idade
**Avaliação:** ⭐ 4.96 (18 avaliações)

## Sobre

A Anhangá é especialista em viagens para o público 50+. Nossos roteiros focam em ritmo desacelerado, conforto extremo, hotéis com acessibilidade, suporte 24h e curadoria de experiências culturais enriquecedoras, sem o estresse de deslocamentos exaustivos.

## Diferenciais para o público 50+

- Ritmo de viagem desacelerado — sem correria
- Hotéis com boa acessibilidade e conforto premium
- Curadoria cultural: gastronomia, história, arte
- Suporte 24h via WhatsApp durante toda a viagem
- Guias acompanhantes especializados (para grupos)
- Atenção a restrições alimentares e de mobilidade

## Destinos favoritos para o público 50+

- Portugal (Lisboa, Porto, Douro) — infraestrutura e cultura
- Itália (Toscana, Roma, Veneza) — riqueza histórica
- Gramado (Brasil) — clima europeu, conforto e romanticismo
- Cruzeiros de luxo — logística simplificada
- Orlando (adaptado) — com foco em conforto e ritmo adequado

## Perguntas Frequentes

### O que define uma viagem para a melhor idade na Anhangá?

Nossos roteiros focam em ritmo desacelerado, conforto extremo, hotéis com acessibilidade, suporte 24h e curadoria de experiências que valorizam a cultura e a gastronomia local, sem o estresse de deslocamentos exaustivos.

### A agência oferece acompanhamento durante a viagem?

Oferecemos suporte remoto 24h via WhatsApp para qualquer imprevisto. Para grupos específicos, podemos organizar guias acompanhantes especializados no público 50+ que cuidam de toda a logística e bem-estar do grupo.

### Quais os destinos mais recomendados para o público 50+?

Destinos como Portugal, Itália (especialmente Toscana), Gramado no Brasil, e cruzeiros de luxo são favoritos pela infraestrutura e riqueza cultural. Também adaptamos destinos como Orlando com foco em ritmo adequado e conforto.

### Como funciona o atendimento personalizado?

Realizamos uma conversa detalhada para entender preferências de mobilidade, restrições alimentares e interesses culturais. A partir disso, desenhamos um roteiro que respeita o seu tempo e prioriza sua segurança.
`;
}

export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const rawPath = url.searchParams.get('path') ?? '/';

    // Normalize: single leading slash, no trailing slash, lowercase for case-insensitive matching
    const path = ('/' + rawPath.replace(/^\/+/, '').replace(/\/+$/, '')).toLowerCase();

    switch (path) {
        case '/':
            return markdownResponse(homePage());
        case '/lollapalooza':
            return markdownResponse(lollapaloozaPage());
        case '/beto-carrero':
            return markdownResponse(betoCarreroPage());
        case '/orlando':
            return markdownResponse(orlandoPage());
        case '/melhor-idade':
            return markdownResponse(melhorIdadePage());
        default: {
            // Sanitize before including in response body
            const safeDisplay = rawPath.slice(0, 80).replace(/[^\w\-\/]/g, '');
            return markdownResponse(
                `# Página não encontrada\n\nNão há versão em Markdown para o caminho \`${safeDisplay}\`.\n\nConsulte [${SITE_BASE}](${SITE_BASE}) para o conteúdo completo.\n`,
                404
            );
        }
    }
}
