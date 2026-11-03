// Keep in sync with Faq.tsx whenever questions or answers change: the exact visible text,
// in order, with list items and cards joined by a space (tests/faq-schema-sync.test.ts).
// Scanners reject a FAQPage that drifts from the page, even in case or punctuation.

export interface FAQSchemaItem {
  question: string;
  answer: string;
}

export const FAQ_SCHEMA_ITEMS: FAQSchemaItem[] = [
  {
    question: 'Quanto custa um roteiro personalizado?',
    answer:
      'O preço varia conforme a complexidade, duração e destino. Nossos roteiros começam em R$ 3.800 e podem chegar a R$ 50.000+ para experiências premium. Fatores que influenciam o preço: Passagens aéreas (variável conforme data e companhia) Hospedagem (economia a luxo) Experiências e passeios Duração da viagem Sazonalidade do destino Receba uma cotação personalizada gratuitamente! Comece pelo chat e nossa equipe continua o atendimento com você.',
  },
  {
    question: 'Como funciona a estrutura de preço da Anhangá?',
    answer:
      'Nós montamos seu roteiro dia-a-dia conforme seu estilo e orçamento. Você recebe uma proposta com todos os custos listados: Passagens aéreas (consultamos o melhor preço do dia) Hospedagem (você escolhe o nível de conforto) Entradas em atrações Transporte terrestre Refeições recomendadas (opcionais) Só avançamos após sua aprovação. Sem surpresas!',
  },
  {
    question: 'Quanto tempo antes devo planejar minha viagem?',
    answer:
      'Recomendamos começar com 3-6 meses de antecedência para viagens internacionais. Isso nos permite: Consultar as melhores tarifas de passagens aéreas Garantir hospedagem em alta temporada Organizar vistos (se necessário) Ajustar o roteiro conforme preferências Mas não se preocupe! Somos especialistas em "milagres de última hora" também - conseguimos viagens em 48 horas em casos urgentes.',
  },
  {
    question: 'Por que a Anhangá em vez de outra agência?',
    answer:
      '1. Roteiros 100% personalizados: Não vendemos pacotes prontos. 2. Sem burocracia: Cuidamos de vistos, formulários, tudo. 3. Concierge humano: O chat agiliza o início, mas seu roteiro é conduzido por especialistas. 4. Suporte 24/7: Temos um "botão de pânico" no WhatsApp. 5. Especialistas em transformação: Viagens que mudam vidas, não apenas destinos.',
  },
  {
    question: 'Como funciona o processo? É complicado?',
    answer:
      '4 passos simples: Vamos conversar? Você começa pelo chat, conta seus sonhos e informa quanto quer investir Desenhando o sonho Nossos especialistas criam um roteiro dia-a-dia personalizado Burocracia? Deixa com a gente Emitimos voos, hotéis, passeios e parcelamos Fui! Partiu viajar Você recebe vouchers organizados. A gente fica de plantão 24h',
  },
  {
    question: 'Como funciona a página do Lollapalooza Brasil na Anhangá?',
    answer:
      'Somos especialistas em grandes festivais. A landing do Lollapalooza Brasil concentra as atualizações da campanha vigente, histórico da operação e a lista de espera para a próxima abertura quando a edição atual já estiver encerrada. Quem se cadastra primeiro recebe aviso prioritário quando a próxima edição abre.',
  },
  {
    question: 'Vocês têm viagens para quem tem 50+ (Melhor Idade)?',
    answer:
      'Sim! O Turismo 50+ é um de nossos pilares. Criamos roteiros com ritmo desacelerado, foco em conforto, acessibilidade e experiências culturais enriquecedoras, tanto no Brasil quanto no exterior. Nossa curadoria seleciona hotéis e passeios que priorizam o bem-estar e a segurança deste público exigente.',
  },
  {
    question: 'A Anhangá Viagens é uma agência credenciada?',
    answer:
      'Com certeza. Somos uma agência de turismo com Certificado Cadastur (37.036.732/0001-41) e parceiros credenciados dos maiores parques do Brasil, como Beto Carrero World e Hopi Hari. Isso garante segurança jurídica e oficialidade em todos os ingressos e serviços que comercializamos.',
  },
];
