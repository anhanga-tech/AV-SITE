import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { buildPrerenderRoutes } from '../lib/prerender-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const SSR_OUT_DIR = path.resolve(__dirname, '../.prerender-ssr');
const SSR_ENTRY = path.resolve(__dirname, '../ssr.tsx');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');
const BLOG_DIR = path.resolve(__dirname, '../content/blog');

const REQUIRED_PATTERNS = [
  { label: 'title', pattern: /<title\b[^>]*>[\s\S]*?<\/title>/i },
  { label: 'meta description', pattern: /<meta\b[^>]*name="description"[^>]*content="[^"]+"/i },
  { label: 'canonical', pattern: /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/www\.anhanga\.tur\.br\/[^"?#]*"/i },
  { label: 'Open Graph', pattern: /<meta\b[^>]*property="og:title"[^>]*content="[^"]+"/i },
  { label: 'Twitter card', pattern: /<meta\b[^>]*name="twitter:title"[^>]*content="[^"]+"/i },
  { label: 'JSON-LD schema', pattern: /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i }
];
const MANAGED_TEMPLATE_HEAD_TAG_PATTERNS = [
  /<title\b[^>]*data-av-head="[^"]+"[^>]*>[\s\S]*?<\/title>\s*/gi,
  /<meta\b[^>]*data-av-head="[^"]+"[^>]*\/?>\s*/gi,
  /<link\b[^>]*data-av-head="[^"]+"[^>]*\/?>\s*/gi
];
// Recursos marcados como exclusivos da home no template. O prerender emite o mesmo
// index.html para toda rota, então sem esse strip o preload do hero da Home dispararia
// também em rotas que nunca renderizam o Hero: /links, a página de bio, baixava o
// candidato de 1200w em `fetchpriority="high"` competindo com o próprio JS.
// A justificativa mora aqui, e não num comentário do index.html, porque comentário de
// HTML é servido ao browser em toda resposta — este arquivo não.
const HOME_ONLY_PRELOAD_PATTERN = /<link\b[^>]*data-av-preload="home-hero"[^>]*>\s*/gi;

const UNIQUE_TAG_PATTERNS = [
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

const routeToOutputPath = (route) =>
  route === '/' ? path.join(DIST_DIR, 'index.html') : path.join(DIST_DIR, route.slice(1), 'index.html');

const normalizeRoute = (route) => (route === '/' ? '/' : route.replace(/\/+$/, ''));
const escapeHtmlAttribute = (value) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const ensurePrerenderMarker = (html, route) =>
  html.replace(/<html([^>]*)>/i, (_, attrs) => {
    const normalizedRoute = normalizeRoute(route);
    const escapedRoute = escapeHtmlAttribute(normalizedRoute);
    let nextAttrs = attrs;

    if (nextAttrs.includes('data-prerendered=')) {
      nextAttrs = nextAttrs.replace(/data-prerendered="[^"]*"/i, 'data-prerendered="true"');
    } else {
      nextAttrs += ' data-prerendered="true"';
    }

    if (nextAttrs.includes('data-prerender-route=')) {
      nextAttrs = nextAttrs.replace(/data-prerender-route="[^"]*"/i, `data-prerender-route="${escapedRoute}"`);
    } else {
      nextAttrs += ` data-prerender-route="${escapedRoute}"`;
    }

    return `<html${nextAttrs}>`;
  });

const stripManagedHeadTags = (template) => {
  let strippedTemplate = template;

  for (const pattern of MANAGED_TEMPLATE_HEAD_TAG_PATTERNS) {
    strippedTemplate = strippedTemplate.replace(pattern, '');
  }

  return strippedTemplate;
};

const stripHomeOnlyPreloads = (template, route) =>
  normalizeRoute(route) === '/' ? template : template.replace(HOME_ONLY_PRELOAD_PATTERN, '');

const injectRenderedHtml = (template, appHtml, headHtml, route) => {
  const withManagedHeadRemoved = stripHomeOnlyPreloads(stripManagedHeadTags(template), route);
  const withRoot = withManagedHeadRemoved.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  const withHead = withRoot.replace('</head>', `${headHtml}\n</head>`);
  return ensurePrerenderMarker(withHead, route);
};

const countMatches = (html, pattern) => Array.from(html.matchAll(pattern)).length;

const NOINDEX_META_PATTERN = /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i;

const validateHtml = (route, html) => {
  // Dado estruturado numa página `noindex` não tem consumidor: exigi-lo só forçaria
  // schema decorativo. Todo o resto do contrato de head continua valendo.
  const isNoindex = NOINDEX_META_PATTERN.test(html);

  for (const requirement of REQUIRED_PATTERNS) {
    if (isNoindex && requirement.label === 'JSON-LD schema') {
      continue;
    }
    if (!requirement.pattern.test(html)) {
      throw new Error(`Missing ${requirement.label} in prerendered output for route "${route}"`);
    }
  }

  for (const tag of UNIQUE_TAG_PATTERNS) {
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
          entryFileNames: 'entry-server.mjs',
          format: 'es'
        }
      }
    }
  });

  const serverEntryUrl = pathToFileURL(path.join(SSR_OUT_DIR, 'entry-server.mjs')).href;
  return import(serverEntryUrl);
}

async function prerender() {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error(`Missing client build output at ${INDEX_FILE}. Run "vite build" first.`);
  }

  console.log('Starting SSR prerender...');

  const template = fs.readFileSync(INDEX_FILE, 'utf8');
  const serverModule = await buildSsrBundle();
  const routes = await buildPrerenderRoutes(BLOG_DIR);

  if (typeof serverModule.render !== 'function') {
    throw new Error('SSR bundle does not export a render(url) function.');
  }

  for (const route of routes) {
    console.log(`Rendering ${route}`);
    const { appHtml, headHtml } = await serverModule.render(route);
    const html = injectRenderedHtml(template, appHtml, headHtml, route);

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
