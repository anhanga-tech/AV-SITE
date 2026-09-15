function normalizeRoute(route: string): string {
  if (route === '/') {
    return '/';
  }

  const normalized = route.replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : '/';
}

/*
  O 404 custom (`dist/404.html`) é o único artefato servido para um path que não é o dele:
  o Cloudflare Pages o entrega em QUALQUER URL sem asset correspondente, então seu marcador
  (`/404`) nunca casa com `location.pathname`. Sem esta exceção ele cairia no ramo "markup
  de outra rota" do index.tsx, que chama `replaceChildren()` — e o HTML correto que acabou
  de chegar seria descartado até o chunk lazy do NotFound baixar.

  Medido em Chromium contra o build servido pelo runtime do Pages, antes desta exceção: o
  conteúdo do 404 aparecia aos 177ms, SUMIA por ~300ms e voltava aos 576ms (com CPU 6x
  lenta: some por ~230ms). Um flicker — pior que o atraso simples de antes da rota existir.

  O markup casa quando o path cai no catch-all do React Router, que é o que gerou este HTML
  — o caso comum de URL inexistente. Nem todo path servido pelo 404 cai nele, porém, e
  nesses a hidratação diverge de propósito (medido em Chromium contra o build servido pelo
  runtime do Pages):

    /rota-que-nao-existe    catch-all → casa o markup, hidrata limpo
    /Sobre                  o Router casa rota sem diferenciar caixa → renderiza Sobre
    /blog/post-inexistente  casa `/blog/:slug`, não o catch-all → BlogPost renderiza o
                            próprio "Artigo não encontrado"

  Nos dois últimos o React descarta o markup e re-renderiza no cliente — mesmo resultado
  visível que havia antes desta exceção, e a página certa aparece nos três casos. O que
  muda é que a divergência passa a ser reportada; por isso index.tsx silencia o
  `onRecoverableError` SÓ sob este marcador (ver isNotFoundPrerenderMarker). Em troca, o
  caso comum para de perder o markup — era um flicker de ~300ms, medido.
*/
const NOT_FOUND_PRERENDER_MARKER = '/404';

export function shouldHydratePrerenderedRoute(
  prerenderedRoute: string | null | undefined,
  currentPath: string
): boolean {
  if (!prerenderedRoute) {
    return false;
  }

  if (isNotFoundPrerenderMarker(prerenderedRoute)) {
    return true;
  }

  return normalizeRoute(prerenderedRoute) === normalizeRoute(currentPath);
}

/**
 * `true` quando o HTML servido é o 404 custom (`dist/404.html`).
 *
 * Usado por index.tsx para decidir se uma divergência de hidratação naquela página é
 * esperada. Ela é o único artefato servido para paths que não são o dele, e um deles
 * diverge de propósito: uma URL que só difere de uma rota real na caixa (`/Sobre`) recebe
 * o 404 da borda, mas o React Router — que casa rota sem diferenciar caixa — renderiza a
 * página real. Medido em Chromium contra o build servido pelo runtime do Pages:
 *
 *   /Sobre                → React error #418 (hydration mismatch)
 *   /rota-que-nao-existe  → nenhum erro; o catch-all casa o mesmo markup do 404
 *
 * Sem tratar esse caso, o `onRecoverableError` default do `hydrateRoot` faz `console.error`,
 * que `lib/sentry-client.ts` encaminha (`consoleLoggingIntegration`) — ou seja, cada visita
 * a uma URL com caixa trocada viraria ruído no Sentry. A supressão vale só enquanto o
 * marcador for o do 404; em qualquer outra rota o comportamento default continua intacto.
 */
export function isNotFoundPrerenderMarker(
  prerenderedRoute: string | null | undefined
): boolean {
  return Boolean(prerenderedRoute) &&
    normalizeRoute(prerenderedRoute as string) === NOT_FOUND_PRERENDER_MARKER;
}
