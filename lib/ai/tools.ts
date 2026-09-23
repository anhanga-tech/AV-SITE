import { Type, type FunctionDeclaration } from "@google/genai";

export const budgetTool: FunctionDeclaration = {
    name: "generate_budget_link",
    description: "Registra o pré-atendimento estruturado do orçamento e abre para o cliente o formulário de contato com a equipe da Anhangá. Use quando o cliente concordou em seguir com o orçamento e os campos obrigatórios estão preenchidos (ou marcados 'a definir' após uma tentativa). Também é o caminho para encaminhar ao consultor humano, inclusive em embarque com menos de 30 dias. Não use para destinos bloqueados nem para destino nos EUA antes de confirmar o status do visto. O servidor valida os argumentos: se faltar campo obrigatório ou o destino estiver bloqueado, o handoff não acontece e o cliente recebe uma pergunta pedindo o dado faltante.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            destination: { type: Type.STRING, description: "Resumo do destino desejado para a viagem." },
            destination_city: { type: Type.STRING, description: "Cidade de destino. Use 'a definir' se o usuário não souber após uma tentativa." },
            destination_region: { type: Type.STRING, description: "UF (Brasil) ou país (internacional) do destino." },
            origin_city: { type: Type.STRING, description: "Cidade de origem. Use 'a definir' se o usuário não souber após uma tentativa." },
            origin_region: { type: Type.STRING, description: "UF (Brasil) ou país da origem. Se faltar, assuma Brasil." },
            dates: { type: Type.STRING, description: "Data aproximada da viagem ou mês/ano. Aceite 'a definir' quando necessário." },
            adults: { type: Type.INTEGER, description: "Quantidade de adultos viajando." },
            child_ages: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: "Lista com as idades das crianças. Se não houver crianças, envie um array vazio."
            },
            interests: { type: Type.STRING, description: "Interesses específicos (ex: luxo, aventura, família)." },
            trip_scope: { type: Type.STRING, enum: ["national", "south_america", "international"], description: "Escopo da viagem pelo par origem + destino: national (Brasil → Brasil), south_america (destino na América do Sul, fora do caso nacional) ou international (demais casos)." },
            budget_range: { type: Type.STRING, description: "Faixa de orçamento total da viagem conforme taxonomia do escopo." },
            decision_role: { type: Type.STRING, description: "Papel de decisão do cliente (decisor principal, compartilha decisão, etc.)." },
            need_summary: { type: Type.STRING, description: "Resumo da necessidade principal (BANT - Need)." },
            timeline_window: { type: Type.STRING, description: "Janela de decisão/embarque (BANT - Timeline)." },
            baggage_preference: { type: Type.STRING, description: "Preferência de tarifa de bagagem quando houver trecho aéreo (mala de mão ou bagagem despachada)." },
            assumed_origin_br: { type: Type.BOOLEAN, description: "Use true quando origem não for informada e Brasil for assumido." },
            iata_code: { type: Type.STRING, description: "Código IATA (3 letras) do aeroporto que a maioria dos pacotes de lazer usa para chegar ao destino; em cidade pequena ou com vários aeroportos, o hub mais comum da região (ex: MCZ para São Miguel dos Milagres, MCO para Orlando)." },
            // visa_status: only for USA destinations. "pendente" = traveler has no valid US visa yet; "ok" = traveler confirmed a valid visa.
            visa_status: { type: Type.STRING, enum: ["pendente", "ok"], description: "Status do visto americano (somente destino EUA). Use 'pendente' quando o viajante ainda não tem visto válido, ou 'ok' quando confirmou que já possui." }
        },
        required: ["destination", "destination_city", "origin_city", "dates", "adults", "iata_code"]
    }
};
