import type { SyntheticEvent } from 'react';
import { getMediaUrl } from '../../../data/mediaConfig';

/*
  Nem todo original aceita transform. O `magic-kingdom.png` (11502×1942, 22,3
  megapixels) devolve HTTP 422 / "ERROR 9516: error during decoding" no
  `/cdn-cgi/image` — o arquivo cru serve normalmente, mas o resizer não o
  decodifica. Sem este fallback o logo simplesmente não apareceria.

  A causa raiz é o arquivo, não o código: precisa ser reencodado no R2 (mesmo
  bloqueio de acesso ao bucket da issue #1333). Até lá o fallback vale para
  qualquer transform que falhe, não só este.

  Mora fora do arquivo do componente porque exportar não-componentes de um
  módulo de componente quebra o Fast Refresh (react-doctor/only-export-components).
*/
export const handleLogoTransformError =
  (logo: string) =>
  (event: SyntheticEvent<HTMLImageElement>): void => {
    const img = event.currentTarget;
    const raw = getMediaUrl(logo);
    // Guarda contra loop: se o próprio original falhar, não tenta de novo.
    if (img.src !== raw) img.src = raw;
  };
