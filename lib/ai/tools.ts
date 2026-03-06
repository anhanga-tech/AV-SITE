import { Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";
import type { ExtractChipsResult } from './types.ts';
import { extractRecord } from './utils.ts';

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

export function extractBudgetToolCallFromText(
    text?: string,
): { name: 'generate_budget_link'; args: Record<string, unknown> } | undefined {
    if (!text || !text.includes('generate_budget_link')) return undefined;

    const candidates: string[] = [text.trim()];

    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
        candidates.push(fencedMatch[1].trim());
    }

    if (text.includes('"tool_call"')) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            candidates.push(text.slice(start, end + 1).trim());
        }
    }

    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate);
            const record = extractRecord(parsed);
            if (!record) continue;

            const toolCall = typeof record.tool_call === 'string'
                ? record.tool_call
                : typeof record.name === 'string'
                    ? record.name
                    : undefined;
            if (toolCall !== 'generate_budget_link') continue;

            const args = extractRecord(record.arguments ?? record.args);
            if (!args) continue;

            return { name: 'generate_budget_link', args };
        } catch {
            // Ignore invalid candidates and keep scanning
        }
    }

    return undefined;
}

export function stripToolCallJsonBlock(text: string): string {
    return text
        .replace(/\{[\s\S]*"tool_call"\s*:\s*"generate_budget_link"[\s\S]*\}\s*$/m, '')
        .replace(/```(?:json)?[\s\S]*?```/gi, '')
        .trim();
}

export function extractChipsFromText(text: string): ExtractChipsResult {
    if (!text) return { text };

    // Match JSON with chips field, raw markdown arrays like "**chips:** [...]", "chips: [...]", or a trailing JSON array.
    const chipsMatch = text.match(/\{\s*"chips"\s*:\s*(\[[^\]]*\])\s*\}/i) ||
        text.match(/\*?\*?chips\*?\*?:?\*?\*?\s*(\[[^\]]*\])/i) ||
        text.match(/(?:\n|^)\s*(\[[^\]]*\])\s*$/); // Fallback: just an array at the end of the string

    if (!chipsMatch) return { text };

    try {
        // Handle smart quotes and single quotes often generated by Gemini's markdown
        const rawJsonString = chipsMatch[1].replace(/['“”]/g, '"').replace(/\s+/g, ' ');
        const parsedArray = JSON.parse(rawJsonString);

        if (Array.isArray(parsedArray)) {
            // Map objects (e.g. {"label": "x", "value": "x"}) to simple strings if Gemini hallucinates
            const chipsArray = parsedArray.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                    return item.label || item.value || item.text || String(item);
                }
                return String(item);
            }).filter(Boolean);

            if (chipsArray.length > 0) {
                // Remove the matched block and any residual newlines
                const cleanedText = text.replace(chipsMatch[0], '').trim();
                return { text: cleanedText, chips: chipsArray };
            }
        }
    } catch (error) {
        // Invalid JSON, log for debugging and return original text
        console.warn('Failed to parse chips from AI response', { error });
    }

    return { text };
}
