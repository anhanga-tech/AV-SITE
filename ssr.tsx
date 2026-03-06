import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import App from './App';
import { createHeadManager, renderHeadTags } from './lib/head';

export interface RenderResult {
  appHtml: string;
  headHtml: string;
}

export async function render(url: string): Promise<RenderResult> {
  const headManager = createHeadManager();

  const appHtml = await new Promise<string>((resolve, reject) => {
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
      reject(new Error(`SSR timed out while rendering ${url}`));
    }, 30000);

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
      <React.StrictMode>
        <App
          router="memory"
          initialEntries={[url]}
          headManager={headManager}
          includeClientFeatures={false}
        />
      </React.StrictMode>,
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

  return {
    appHtml,
    headHtml: renderHeadTags(headManager.getTags())
  };
}
