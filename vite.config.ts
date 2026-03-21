import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import { DEFAULT_GEMINI_MODEL } from './lib/ai/constants.ts';
import { stripYamlFrontmatter } from './lib/mdx-frontmatter.ts';

type ApiHandler = (request: Request) => Promise<Response> | Response;

const DEV_API_ROUTES: Record<string, () => Promise<{ default: ApiHandler }>> = {
  '/api/blog-posts': () => import('./api/blog-posts.ts'),
  '/api/generate': () => import('./api/generate.ts'),
  '/api/submit-lead': () => import('./api/submit-lead.ts'),
  '/api/submit-waitlist': () => import('./api/submit-waitlist.ts'),
  '/api/hubspot-webhook': () => import('./api/hubspot-webhook.ts'),
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
        if (!req.url?.startsWith('/api/')) {
          next();
          return;
        }

        const pathname = new URL(req.url, 'http://vite.local').pathname;
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

          console.error('[vite-api] Failed to serve %s:', pathname, error);

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

export default defineConfig(({ mode, isSsrBuild }) => {
  // Carregar variáveis de ambiente do arquivo .env e do sistema
  // O segundo parâmetro '.' significa o diretório atual (raiz do projeto)
  // O terceiro parâmetro '' significa carregar TODAS as variáveis (não apenas VITE_*)
  const env = loadEnv(mode, '.', '');

  // Também verificar process.env diretamente (importante para Vercel/Netlify)
  // Isso garante que variáveis de ambiente do sistema sejam capturadas
  const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const geminiModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  // Base path: '/' para Netlify/Vercel, ou '/repo-name/' para GitHub Pages
  // Para GitHub Pages, defina a variável de ambiente VITE_BASE_PATH
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/';

  // Logs de debug (útil para verificar se a variável está sendo carregada)
  console.log(`🔧 Building with base path: ${base}`);
  console.log(`🔧 Mode: ${mode}`);
  console.log(`🔧 GEMINI_MODEL: ${geminiModel}`);

  return {
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
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
      apiDevPlugin(),
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
          manualChunks: isSsrBuild ? undefined : {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ai-vendor': ['@google/genai'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    preview: {
      port: 4173,
      host: true,
    }
  };
});
