import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

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
const PORT = 3001;

async function prerender() {
  console.log('🚀 Starting pre-rendering...');

  // Start a simple static server
  const { createServer } = await import('http');
  const sirv = (await import('sirv')).default;
  const handler = sirv(DIST_DIR, { single: true });
  const server = createServer((req, res) => handler(req, res));
  
  server.listen(PORT);
  console.log(`📡 Static server running at http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const keepLast = (html, tagPattern) => {
    const matches = [...html.matchAll(tagPattern)];
    if (matches.length > 1) {
      const lastMatch = matches[matches.length - 1][0];
      html = html.replace(tagPattern, '');
      html = html.replace('<head>', `<head>${lastMatch}`);
    }
    return html;
  };

  const cleanTags = (html, tagPattern, fallbackValue = null) => {
    const matches = [...html.matchAll(tagPattern)];
    if (matches.length > 1) {
      let bestMatch = matches[matches.length - 1][0];
      if (fallbackValue) {
        const nonFallback = matches.find(m => !m[0].includes(fallbackValue));
        if (nonFallback) {
          bestMatch = nonFallback[0];
        }
      }
      html = html.replace(tagPattern, '');
      html = html.replace('<head>', `<head>${bestMatch}`);
    }
    return html;
  };

  for (const route of ROUTES) {
    console.log(`📄 Prerendering: ${route}`);
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'networkidle0'
    });

    await page.waitForSelector('#root', { timeout: 10000 });

    let html = await page.content();

    // Keep in sync with SEO.tsx default title prop
    const DEFAULT_TITLE = 'Anhangá Viagens | Agência de Viagens Personalizadas';
    html = cleanTags(html, /<title>[\s\S]*?<\/title>/gi, DEFAULT_TITLE);
    html = keepLast(html, /<meta name="description" content="[\s\S]*?">/gi);
    html = keepLast(html, /<meta name="keywords" content="[\s\S]*?">/gi);
    html = keepLast(html, /<link rel="canonical" href="[\s\S]*?"\/?>/gi);
    html = keepLast(html, /<meta property="og:[^"]+" content="[^"]+">/gi);
    html = keepLast(html, /<meta name="twitter:[^"]+" content="[^"]+">/gi);
    
    const routePath = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`;
    const filePath = path.join(DIST_DIR, routePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
    
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('✅ Pre-rendering complete!');
}

prerender().catch(err => {
  console.warn('⚠️  Pre-rendering failed (build will continue without pre-rendered pages):', err.message);
  process.exit(0);
});
