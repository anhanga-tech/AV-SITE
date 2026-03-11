export default async function handler() {
    const results: Record<string, string> = {};

    const modules: [string, string][] = [
        ['@google/genai', '@google/genai'],
        ['rate-limit', '../lib/rate-limit'],
        ['network', '../lib/network'],
        ['ai/tools', '../lib/ai/tools'],
        ['ai/prompt', '../lib/ai/prompt'],
        ['ai/constants', '../lib/ai/constants'],
        ['ai/utils', '../lib/ai/utils'],
        ['ai/validation', '../lib/ai/validation'],
    ];

    for (const [label, path] of modules) {
        try {
            await import(path);
            results[label] = 'OK';
        } catch (err: unknown) {
            results[label] = err instanceof Error ? err.message : String(err);
        }
    }

    return new Response(JSON.stringify(results, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
