import { Type, type FunctionDeclaration } from "@google/genai";

export const budgetTool: FunctionDeclaration = {
    name: "generate_budget_link",
    description: "Gera um link para o WhatsApp quando o usuário concorda em solicitar um orçamento e já forneceu as informações básicas.",
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
            trip_scope: { type: Type.STRING, description: "Escopo da viagem: national, south_america ou international." },
            budget_range: { type: Type.STRING, description: "Faixa de orçamento total da viagem conforme taxonomia do escopo." },
            decision_role: { type: Type.STRING, description: "Papel de decisão do cliente (decisor principal, compartilha decisão, etc.)." },
            need_summary: { type: Type.STRING, description: "Resumo da necessidade principal (BANT - Need)." },
            timeline_window: { type: Type.STRING, description: "Janela de decisão/embarque (BANT - Timeline)." },
            baggage_preference: { type: Type.STRING, description: "Preferência de tarifa de bagagem quando houver trecho aéreo (mala de mão ou bagagem despachada)." },
            assumed_origin_br: { type: Type.BOOLEAN, description: "Use true quando origem não for informada e Brasil for assumido." },
            iata_code: { type: Type.STRING, description: "Código IATA (3 letras) do aeroporto principal mais próximo do destino pretendido (ex: MCZ para São Miguel dos Milagres, MCO para Orlando)." }
        },
        required: ["destination", "destination_city", "origin_city", "dates", "adults", "iata_code"]
    }
};
