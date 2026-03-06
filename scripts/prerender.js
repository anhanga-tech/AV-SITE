import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES = [
  '/',
  '/orlando',
  '/beto-carrero',
  '/lollapalooza-2026',
  '/mapa-do-site',
  '/termos-de-uso',
  '/politica-privacidade'
];

const DIST_DIR = path.resolve(__dirname, '../dist');
const SSR_OUT_DIR = path.resolve(__dirname, '../.prerender-ssr');
const SSR_ENTRY = path.resolve(__dirname, '../ssr.tsx');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

const REQUIRED_PATTERNS = [
  { label: 'title', pattern: /<title\b[^>]*>[\s\S]*?<\/title>/i },
  { label: 'meta description', pattern: /<meta\b[^>]*name="description"[^>]*content="[^"]+"/i },
  { label: 'canonical', pattern: /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/www\.anhanga\.tur\.br\/[^"?#]*"/i },
  { label: 'Open Graph', pattern: /<meta\b[^>]*property="og:title"[^>]*content="[^"]+"/i },
  { label: 'Twitter card', pattern: /<meta\b[^>]*name="twitter:title"[^>]*content="[^"]+"/i },
  { label: 'JSON-LD schema', pattern: /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i }
];

const routeToOutputPath = (route) =>
  route === '/' ? path.join(DIST_DIR, 'index.html') : path.join(DIST_DIR, route.slice(1), 'index.html');

const ensurePrerenderMarker = (html) =>
  html.replace(/<html([^>]*)>/i, (match, attrs) =>
    attrs.includes('data-prerendered=') ? match : `<html${attrs} data-prerendered="true">`
  );

const stripManagedHeadTags = (template) =>
  template.replace(/\n?[ \t]*<(title|meta|link|script)\b[^>]*data-av-head="[^"]+"[^>]*>(?:[\s\S]*?<\/title>|[\s\S]*?<\/script>)?/gi, '');

const injectRenderedHtml = (template, appHtml, headHtml) => {
  const withManagedHeadRemoved = stripManagedHeadTags(template);
  const withRoot = withManagedHeadRemoved.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  const withHead = withRoot.replace('</head>', `${headHtml}\n</head>`);
  return ensurePrerenderMarker(withHead);
};

const countMatches = (html, pattern) => Array.from(html.matchAll(pattern)).length;

const validateHtml = (route, html) => {
  for (const requirement of REQUIRED_PATTERNS) {
    if (!requirement.pattern.test(html)) {
      throw new Error(`Missing ${requirement.label} in prerendered output for route "${route}"`);
    }
  }

  const uniqueTagPatterns = [
    { label: 'title', pattern: /<title\b[^>]*>/gi },
    { label: 'meta description', pattern: /<meta\b[^>]*name="description"[^>]*>/gi },
    { label: 'canonical', pattern: /<link\b[^>]*rel="canonical"[^>]*>/gi },
    { label: 'og:title', pattern: /<meta\b[^>]*property="og:title"[^>]*>/gi },
    { label: 'og:description', pattern: /<meta\b[^>]*property="og:description"[^>]*>/gi },
    { label: 'og:image', pattern: /<meta\b[^>]*property="og:image"[^>]*>/gi },
    { label: 'og:type', pattern: /<meta\b[^>]*property="og:type"[^>]*>/gi },
    { label: 'og:url', pattern: /<meta\b[^>]*property="og:url"[^>]*>/gi },
    { label: 'twitter:card', pattern: /<meta\b[^>]*name="twitter:card"[^>]*>/gi },
    { label: 'twitter:title', pattern: /<meta\b[^>]*name="twitter:title"[^>]*>/gi },
    { label: 'twitter:description', pattern: /<meta\b[^>]*name="twitter:description"[^>]*>/gi },
    { label: 'twitter:image', pattern: /<meta\b[^>]*name="twitter:image"[^>]*>/gi }
  ];

  for (const tag of uniqueTagPatterns) {
    const matchCount = countMatches(html, tag.pattern);
    if (matchCount !== 1) {
      throw new Error(`Expected exactly 1 ${tag.label} tag in prerendered output for route "${route}", found ${matchCount}`);
    }
  }
};

const removeDirectory = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true, force: true });
  }
};

async function buildSsrBundle() {
  removeDirectory(SSR_OUT_DIR);

  await build({
    configFile: path.resolve(__dirname, '../vite.config.ts'),
    mode: process.env.NODE_ENV || 'production',
    build: {
      ssr: SSR_ENTRY,
      outDir: SSR_OUT_DIR,
      emptyOutDir: false,
      minify: false,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: 'entry-server.js',
          format: 'es'
        }
      }
    }
  });

  const serverEntryUrl = pathToFileURL(path.join(SSR_OUT_DIR, 'entry-server.js')).href;
  return import(serverEntryUrl);
}

async function prerender() {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error(`Missing client build output at ${INDEX_FILE}. Run "vite build" first.`);
  }

  console.log('Starting SSR prerender...');

  const template = fs.readFileSync(INDEX_FILE, 'utf8');
  const serverModule = await buildSsrBundle();

  if (typeof serverModule.render !== 'function') {
    throw new Error('SSR bundle does not export a render(url) function.');
  }

  for (const route of ROUTES) {
    console.log(`Rendering ${route}`);
    const { appHtml, headHtml } = await serverModule.render(route);
    const html = injectRenderedHtml(template, appHtml, headHtml);

    validateHtml(route, html);

    const outputPath = routeToOutputPath(route);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
  }

  removeDirectory(SSR_OUT_DIR);
  console.log('SSR prerender complete.');
}

prerender().catch((error) => {
  removeDirectory(SSR_OUT_DIR);
  console.error('Prerender failed:', error);
  process.exit(1);
});
