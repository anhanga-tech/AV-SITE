// All /experiencias/* pages were removed. Return 410 Gone so search engines deindex them.
export const onRequest = () =>
  new Response(
    '<!DOCTYPE html><html><head><meta name="robots" content="noindex"></head><body><h1>410 Gone</h1><p>Esta página foi removida permanentemente.</p></body></html>',
    {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
