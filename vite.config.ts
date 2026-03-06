import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, isSsrBuild }) => {
  // Carregar variáveis de ambiente do arquivo .env e do sistema
  // O segundo parâmetro '.' significa o diretório atual (raiz do projeto)
  // O terceiro parâmetro '' significa carregar TODAS as variáveis (não apenas VITE_*)
  const env = loadEnv(mode, '.', '');

  // Também verificar process.env diretamente (importante para Vercel/Netlify)
  // Isso garante que variáveis de ambiente do sistema sejam capturadas
  const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const geminiModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

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
    plugins: [react()],
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
