import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Every handler in api/ must be reachable in production (a functions/api adapter)
// and under `pnpm dev` (a DEV_API_ROUTES entry in vite.config.ts). Both are easy to
// forget: submit-contact and submit-quiz shipped without dev routes.
const ROOT = process.cwd();

// Handlers deliberately left out of DEV_API_ROUTES, with the reason.
const DEV_ROUTE_EXCEPTIONS: Record<string, string> = {
    auth: 'Decap CMS OAuth; local CMS editing uses `pnpm cms:proxy` instead',
    'auth/callback': 'Decap CMS OAuth; local CMS editing uses `pnpm cms:proxy` instead',
    'purchase-dispatch': 'inbound n8n webhook; never called by the browser',
};

// Discovery endpoints are served under /.well-known/ rather than /api/.
const WELL_KNOWN_ROUTES: Record<string, string> = {
    'api-catalog': '/.well-known/api-catalog',
    'api-docs': '/.well-known/api-docs',
    openapi: '/.well-known/openapi.json',
};

function listHandlers(dir: string, prefix = ''): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        if (entry.isDirectory()) return listHandlers(path.join(dir, entry.name), `${prefix}${entry.name}/`);
        return entry.name.endsWith('.ts') ? [`${prefix}${entry.name.slice(0, -3)}`] : [];
    });
}

function readDevRoutes(): Set<string> {
    const source = readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8');
    const block = source.match(/const DEV_API_ROUTES[^{]*\{([\s\S]*?)\n\};/);
    assert.ok(block, 'DEV_API_ROUTES not found in vite.config.ts');
    return new Set([...block[1].matchAll(/'([^']+)':\s*\(\)\s*=>\s*import\(/g)].map((m) => m[1]));
}

const handlers = listHandlers(path.join(ROOT, 'api'));

test('every api handler has a Cloudflare Pages adapter in functions/api', () => {
    const missing = handlers.filter((name) => !existsSync(path.join(ROOT, 'functions', 'api', `${name}.ts`)));
    assert.deepEqual(missing, []);
});

test('every api handler has a DEV_API_ROUTES entry unless explicitly excepted', () => {
    const routes = readDevRoutes();
    const missing = handlers.filter((name) => {
        if (name in DEV_ROUTE_EXCEPTIONS) return false;
        return !routes.has(WELL_KNOWN_ROUTES[name] ?? `/api/${name}`);
    });
    assert.deepEqual(missing, []);
});

test('dev route exceptions refer to handlers that still exist', () => {
    const stale = Object.keys(DEV_ROUTE_EXCEPTIONS).filter((name) => !handlers.includes(name));
    assert.deepEqual(stale, []);
});
