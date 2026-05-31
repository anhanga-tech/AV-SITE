// /cookies was removed (merged into /politica-privacidade). Return 410 Gone.
export const onRequest = () =>
  new Response(
    '<!DOCTYPE html><html lang="pt-BR"><head><meta name="robots" content="noindex"></head><body><h1>410 Gone</h1><p>Esta página foi removida. Consulte nossa <a href="/politica-privacidade/">Política de Privacidade</a>.</p></body></html>',
    {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
