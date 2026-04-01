type RuntimeImportMeta = ImportMeta & {
  env?: {
    BASE_URL?: string;
  };
};

const runtimeImportMeta = import.meta as RuntimeImportMeta;
const rawBaseUrl = runtimeImportMeta.env?.BASE_URL ?? '/';
const normalizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

const encodeAssetPath = (path: string): string =>
  path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const getStaticAssetUrl = (path: string): string =>
  `${normalizedBaseUrl}assets/${encodeAssetPath(path)}`;

export const NOISE_TEXTURE_URL = getStaticAssetUrl('noise.svg');
