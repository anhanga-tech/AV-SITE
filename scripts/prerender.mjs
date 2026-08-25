import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { buildPrerenderRoutes } from '../lib/prerender-routes.js';
import { normalizeRoute, stripHomeOnlyPreloads, validateHtml } from '../lib/prerender-html.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const SSR_OUT_DIR = path.resolve(__dirname, '../.prerender-ssr');
const SSR_ENTRY = path.resolve(__dirname, '../ssr.tsx');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');
const BLOG_DIR = path.resolve(__dirname, '../content/blog');

const MANAGED_TEMPLATE_HEAD_TAG_PATTERNS = [
  /<title\b[^>]*data-av-head="[^"]+"[^>]*>[\s\S]*?<\/title>\s*/gi,
  /<meta\b[^>]*data-av-head="[^"]+"[^>]*\/?>\s*/gi,
  /<link\b[^>]*data-av-head="[^"]+"[^>]*\/?>\s*/gi
];

const routeToOutputPath = (route) =>
  route === '/' ? path.join(DIST_DIR, 'index.html') : path.join(DIST_DIR, route.slice(1), 'index.html');

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

const injectRenderedHtml = (template, appHtml, headHtml, route) => {
  const withManagedHeadRemoved = stripHomeOnlyPreloads(stripManagedHeadTags(template), route);
  const withRoot = withManagedHeadRemoved.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  const withHead = withRoot.replace('</head>', `${headHtml}\n</head>`);
  return ensurePrerenderMarker(withHead, route);
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
