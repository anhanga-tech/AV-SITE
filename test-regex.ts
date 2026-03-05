const text1 = `(Se preferir, pode informar a Cidade/UF)

[{"label": "São Paulo/SP", "value": "São Paulo/SP"}, {"label": "Rio de Janeiro/RJ", "value": "Rio de Janeiro/RJ"}, {"label": "Curitiba/PR", "value": "Curitiba/PR"}, {"label": "Brasília/DF", "value": "Brasília/DF"}]`;

const text2 = `**chips:** [{"text": "Opa"}, "Tudo bom?"]`;

function extractChipsFromText(text: string) {
    if (!text) return { text };

    const arrayPattern = /(\[(?:[^\[\]{]|\{[^{}]*\})*\])/;
    const chipsMatch = text.match(/\{\s*”chips”\s*:\s*(\[(?:[^\[\]{]|\{[^{}]*\})*\])\s*\}/i) ||
        text.match(/\*?\*?chips\*?\*?:?\*?\*?\s*(\[(?:[^\[\]{]|\{[^{}]*\})*\])/i) ||
        text.match(new RegExp('(?:\\n|^)\\s*' + arrayPattern.source + '\\s*$')); // Fallback: just an array at the end of the string

    if (!chipsMatch) return { text };

    try {
        const rawJsonString = chipsMatch[1].replace(/['””]/g, '”');
        const parsedArray = JSON.parse(rawJsonString);

        if (Array.isArray(parsedArray)) {
            // Map objects to simple strings
            const chipsArray = parsedArray.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                    return item.label || item.value || item.text || String(item);
                }
                return String(item);
            }).filter(Boolean);

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
