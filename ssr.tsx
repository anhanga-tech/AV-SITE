import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream, renderToString } from 'react-dom/server';
import App from './App';
import { createHeadManager, renderHeadTags } from './lib/head';

export interface RenderResult {
  appHtml: string;
  headHtml: string;
}

const DEFAULT_SSR_TIMEOUT_MS = 30000;
const parsedTimeout = Number.parseInt(process.env.SSR_TIMEOUT_MS ?? '', 10);
const SSR_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : DEFAULT_SSR_TIMEOUT_MS;

function renderApp(url: string, headManager: ReturnType<typeof createHeadManager>): React.ReactElement {
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

function isHomeRoute(url: string): boolean {
  return url === '/' || url.replace(/\/+$/, '') === '';
}

async function renderStreamingHtml(url: string, headManager: ReturnType<typeof createHeadManager>): Promise<string> {
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
