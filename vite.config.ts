import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import { DEFAULT_GEMINI_MODEL } from './lib/ai/constants.ts';
import { stripYamlFrontmatter } from './lib/mdx-frontmatter.ts';
import { logger } from './lib/logger.ts';

type ApiHandler = (request: Request) => Promise<Response> | Response;

const DEV_API_ROUTES: Record<string, () => Promise<{ default: ApiHandler }>> = {
  '/.well-known/api-catalog': () => import('./api/api-catalog.ts'),
  '/.well-known/api-docs': () => import('./api/api-docs.ts'),
  '/.well-known/openapi.json': () => import('./api/openapi.ts'),
  '/api/markdown': () => import('./api/markdown.ts'),
  '/api/generate': () => import('./api/generate.ts'),
  '/api/health': () => import('./api/health.ts'),
  '/api/submit-lead': () => import('./api/submit-lead.ts'),
  '/api/submit-waitlist': () => import('./api/submit-waitlist.ts'),
  '/api/hubspot-webhook': () => import('./api/hubspot-webhook.ts'),
  '/api/submit-nps': () => import('./api/submit-nps.ts'),
};

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function toWebRequest(req: IncomingMessage, origin: string): Promise<Request> {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  const method = req.method?.toUpperCase() || 'GET';
  const requestInit: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
  };

  if (METHODS_WITH_BODY.has(method)) {
    const body = await readRequestBody(req);

    if (body.length > 0) {
      requestInit.body = new Uint8Array(body);
      requestInit.duplex = 'half';
    }
  }

  return new Request(new URL(req.url || '/', origin), requestInit);
}

async function sendWebResponse(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}

function apiDevPlugin() {
  return {
    name: 'api-dev-plugin',
    apply: 'serve' as const,
    configureServer(server: { middlewares: { use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void | Promise<void>) => void }, ssrFixStacktrace?: (error: Error) => void }) {
      server.middlewares.use(async (req, res, next) => {
        let pathname = '/';
        if (req.url) {
          pathname = new URL(req.url, 'http://vite.local').pathname;
        }
        const loadHandler = DEV_API_ROUTES[pathname];

        if (!loadHandler) {
          next();
          return;
        }

        const protoHeader = req.headers['x-forwarded-proto'];
        const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || 'http';
        const origin = `${protocol}://${req.headers.host || 'localhost:3000'}`;

        try {
          const { default: handler } = await loadHandler();
          const request = await toWebRequest(req, origin);
          const response = await handler(request);

          await sendWebResponse(response, res);
        } catch (error) {
          if (error instanceof Error) {
            server.ssrFixStacktrace?.(error);
          }

          logger.error(`[vite-api] Failed to serve ${pathname}:`, error);

          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal dev server error' }));
          }
        }
      });
    },
  };
}

function adminHtmlDevPlugin() {
  const adminHtmlPath = path.resolve(__dirname, 'public/admin/index.html');

  return {
    name: 'admin-html-dev-plugin',
    apply: 'serve' as const,
    configureServer(server: { middlewares: { use: (handler: (req: IncomingMessage, res: ServerResponse, next: (error?: Error) => void) => void | Promise<void>) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://vite.local').pathname;

        if (pathname !== '/admin' && pathname !== '/admin/') {
          next();
          return;
        }

        try {
          const html = await readFile(adminHtmlPath, 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (error) {
          next(error instanceof Error ? error : new Error('Failed to serve /admin in Vite dev'));
        }
      });
    },
  };
}

function stripMdxFrontmatterPlugin() {
  return {
    name: 'strip-mdx-frontmatter',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const [filepath] = id.split('?');

      if (!filepath.endsWith('.mdx')) {
        return null;
      }

      const strippedCode = stripYamlFrontmatter(code);
      return strippedCode === code ? null : { code: strippedCode, map: null };
    },
  };
}

const visualizerModule = process.env.ANALYZE === 'true'
  ? await import('rollup-plugin-visualizer')
  : null;

export default defineConfig(({ mode, isSsrBuild }) => {
  // Carregar variáveis de ambiente do arquivo .env e do sistema
  // O segundo parâmetro '.' significa o diretório atual (raiz do projeto)
  // O terceiro parâmetro '' significa carregar TODAS as variáveis (não apenas VITE_*)
  const env = loadEnv(mode, '.', '');

  // Também verificar process.env diretamente (importante para Vercel/Netlify)
  // Isso garante que variáveis públicas/configuracionais sejam capturadas sem expor secrets no bundle
  const geminiModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  // Base path: '/' para Netlify/Vercel, ou '/repo-name/' para GitHub Pages
  // Para GitHub Pages, defina a variável de ambiente VITE_BASE_PATH
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/';
  const devHost = env.VITE_DEV_HOST || process.env.VITE_DEV_HOST || '0.0.0.0';
  const devPort = Number(env.VITE_DEV_PORT || process.env.VITE_DEV_PORT || '3000');
  const devStrictPort = (env.VITE_DEV_STRICT_PORT || process.env.VITE_DEV_STRICT_PORT || 'false') === 'true';
  const shouldAnalyze = (env.ANALYZE || process.env.ANALYZE) === 'true';
  const visualizerPlugin = visualizerModule && shouldAnalyze && !isSsrBuild
    ? visualizerModule.visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true })
    : null;

  // Logs de debug (útil para verificar se a variável está sendo carregada)
  logger.debug(`🔧 Building with base path: ${base}`);
  logger.debug(`🔧 Mode: ${mode}`);
  logger.debug(`🔧 GEMINI_MODEL: ${geminiModel}`);

  return {
    base,
    server: {
      port: devPort,
      host: devHost,
      strictPort: devStrictPort,
    },
    plugins: [
      stripMdxFrontmatterPlugin(),
      {
        enforce: 'pre',
        ...mdx({
          providerImportSource: '@mdx-js/react',
          remarkPlugins: [remarkGfm],
        }),
      },
      react({ include: /\.(jsx|tsx|mdx)$/ }),
      adminHtmlDevPlugin(),
      apiDevPlugin(),
      ...(visualizerPlugin ? [visualizerPlugin] : []),
    ],
    define: {
      'process.env.GEMINI_MODEL': JSON.stringify(geminiModel)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: isSsrBuild ? undefined : (id: string) => {
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('/node_modules/@google/genai/')) {
              return 'ai-vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 800,
    },
    preview: {
      port: 4173,
      host: true,
    }
  };
});
