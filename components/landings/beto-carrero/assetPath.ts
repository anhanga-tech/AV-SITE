const rawBaseUrl = import.meta.env.BASE_URL || '/';
const normalizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

export const getBetoAssetUrl = (filename: string): string =>
  `${normalizedBaseUrl}landing/beto-carrero/${encodeURIComponent(filename)}`;
