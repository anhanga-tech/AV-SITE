import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream, renderToString } from 'react-dom/server';
import App from './App';
import { createHeadManager, renderHeadTags, type HeadManager } from './lib/head';

export interface RenderResult {
  appHtml: string;
  headHtml: string;
}

const DEFAULT_SSR_TIMEOUT_MS = 30000;
const parsedTimeout = Number.parseInt(process.env.SSR_TIMEOUT_MS ?? '', 10);
const SSR_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : DEFAULT_SSR_TIMEOUT_MS;
const QUERY_HASH_REGEX = /[?#]/;
const TRAILING_SLASH_REGEX = /\/+$/;

function renderApp(url: string, headManager: HeadManager): React.ReactElement {
  return (
    <React.StrictMode>
      <App
        router="memory"
        initialEntries={[url]}
        headManager={headManager}
        includeClientFeatures={false}
      />
    </React.StrictMode>
  );
}

// `/` está preso ao caminho síncrono (`renderToString`) desde a #582 ("Fix home prerender
// CLS"). Causa raiz, confirmada via `git log -S isHomeRoute -- ssr.tsx` + o teste que a PR
// adicionou (tests/hydration.test.ts): `pages/Home.tsx` embrulha suas seções abaixo da dobra
// (Destinations/Testimonials/CallToAction) em `lazy()` + `<Suspense>` próprios. Quando `/`
// passava por `renderStreamingHtml` (que usa `onAllReady`, ou seja, só chama `pipe()` depois
// que TODO Suspense já resolveu), o HTML gerado ainda assim continha o mecanismo de streaming
// fora de ordem do React — fallback inicial + blocos ocultos (`hidden id="S:n"`) com o script
// de swap que injeta o conteúdo real depois. `onAllReady` só atrasa o `pipe()`; não reescreve
// essa estrutura de dois estágios, porque ela é decidida durante o render, não no envio. No
// browser isso é dois paints: o fallback (`min-h-[900px]` etc.) pinta primeiro, o script de
// swap troca pelo conteúdo real depois — e como o Footer vem logo abaixo dessas seções no
// MainSiteShell, esse swap empurrava o Footer, reportado em CLS de campo real.
//
// `renderToString` evita esse mecanismo por completo (não tem conceito de streaming fora de
// ordem), ao custo de nunca resolver `lazy()` — por isso o `dist/index.html` de hoje mostra
// `<section class="min-h-[900px] ..."></section>` vazio onde Destinations deveria estar
// (confirmado inspecionando o build; content real só chega via hidratação client-side).
// Essa perda de conteúdo abaixo da dobra no HTML estático já é uma troca aceita — não
// introduzida por esta issue.
//
// Consequência prática para #1513: QUALQUER novo Suspense boundary na árvore de `/` reabre o
// mesmo risco, não só tornar o `Home` de cima em si `lazy()`. Header e Footer são renderizados
// incondicionalmente dentro do mesmo `MainSiteShell` que envolve `Home` — torná-los `lazy()`
// exigiria mover `/` para `renderStreamingHtml` de novo, reproduzindo o bug de CLS de campo
// que a #582 corrigiu (ou perdendo Header/Footer do HTML estático da home, pior ainda: eles
// são navegação/rodapé, não conteúdo secundário abaixo da dobra). Por isso, nesta PR, Header e
// Footer continuam import estático em App.tsx — só os componentes que a SSR já pula
// incondicionalmente (AIChat, ContactModal, BackToTop, CookieConsentBanner — todos atrás de
// `includeClientFeatures`/`ClientOnly`, nunca renderizados no servidor) viraram `lazy()`. Se
// alguém quiser desbloquear Header/Footer/Home lazy no futuro, o caminho é resolver esse
// mecanismo de streaming (ex.: "aquecer" os `lazy()` da árvore de `/` com um render de
// streaming descartável antes do `renderToString` final, para que `React.lazy` os devolva já
// resolvidos e nunca suspenda) — não tentado aqui por ser uma mudança de arquitetura no
// prerender da página mais importante do site, sem cobertura de teste ainda para validar.
function isHomeRoute(url: string): boolean {
  const pathname = url.split(QUERY_HASH_REGEX)[0];
  return pathname.replace(TRAILING_SLASH_REGEX, '') === '';
}

async function renderStreamingHtml(url: string, headManager: HeadManager): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const stream = new PassThrough();
    let html = '';
    let settled = false;
    let startedPiping = false;
    let firstError: unknown;

    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      abort();
      reject(new Error(`SSR timed out while rendering ${url} after ${SSR_TIMEOUT_MS}ms`));
    }, SSR_TIMEOUT_MS);

    stream.on('data', (chunk) => {
      html += chunk.toString();
    });

    stream.on('end', () => {
      if (settled) {
        return;
      }
      clearTimeout(timeout);
      settled = true;
      if (firstError) {
        reject(firstError);
        return;
      }
      resolve(html);
    });

    stream.on('error', (error) => {
      if (settled) {
        return;
      }
      clearTimeout(timeout);
      settled = true;
      reject(error);
    });

    const { pipe, abort } = renderToPipeableStream(
      renderApp(url, headManager),
      {
        onAllReady() {
          if (startedPiping) {
            return;
          }
          startedPiping = true;
          pipe(stream);
        },
        onShellError(error) {
          if (settled) {
            return;
          }
          clearTimeout(timeout);
          settled = true;
          reject(error);
        },
        onError(error) {
          firstError ??= error;
        }
      }
    );
  });
}

export async function render(url: string): Promise<RenderResult> {
  const headManager = createHeadManager();
  const appHtml = isHomeRoute(url)
    ? renderToString(renderApp(url, headManager))
    : await renderStreamingHtml(url, headManager);

  return {
    appHtml,
    headHtml: renderHeadTags(headManager.getTags())
  };
}
