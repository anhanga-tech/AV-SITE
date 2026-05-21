const text1 = `(Se preferir, pode informar a Cidade/UF)

[{"label": "São Paulo/SP", "value": "São Paulo/SP"}, {"label": "Rio de Janeiro/RJ", "value": "Rio de Janeiro/RJ"}, {"label": "Curitiba/PR", "value": "Curitiba/PR"}, {"label": "Brasília/DF", "value": "Brasília/DF"}]`;

const text2 = `**chips:** [{"text": "Opa"}, "Tudo bom?"]`;

function extractChipsFromText(text: string) {
    if (!text) return { text };

    const chipsMatch = text.match(/\{\s*"chips"\s*:\s*(\[[^\]]*\])\s*\}/i) ||
        text.match(/\*?\*?chips\*?\*?:?\*?\*?\s*(\[[^\]]*\])/i) ||
        text.match(/(?:\n|^)\s*(\[[^\]]*\])\s*$/); // Fallback: just an array at the end of the string

    if (!chipsMatch) return { text };

    try {
        const rawJsonString = chipsMatch[1].replace(/['“”]/g, '"').replace(/\s+/g, ' ');
        const parsedArray = JSON.parse(rawJsonString);

        if (Array.isArray(parsedArray)) {
            // Map objects to simple strings
            const chipsArray = parsedArray.flatMap(item => {
                const val = typeof item === 'string'
                    ? item
                    : typeof item === 'object' && item !== null
                        ? (item.label || item.value || item.text || String(item))
                        : String(item);
                return val ? [val] : [];
            });

            if (chipsArray.length > 0) {
                const cleanedText = text.replace(chipsMatch[0], '').trim();
                return { text: cleanedText, chips: chipsArray };
            }
        }
    } catch (error) {
        console.warn('Failed', { error });
    }
    return { text };
}

console.log("Test 1:", extractChipsFromText(text1));
console.log("Test 2:", extractChipsFromText(text2));
