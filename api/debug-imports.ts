export default async function handler() {
    return new Response(JSON.stringify({
        ok: true,
        node: process.version,
        type: typeof import.meta?.url,
        cwd: process.cwd(),
        env_keys: Object.keys(process.env).filter(k => k.startsWith('GEMINI') || k.startsWith('UPSTASH')).map(k => k + '=' + (process.env[k] ? 'SET' : 'UNSET')),
    }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
