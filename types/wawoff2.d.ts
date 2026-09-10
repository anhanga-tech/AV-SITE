// O wawoff2 (build WASM do woff2 do Google) não publica tipos. Só usamos as duas
// funções de conversão, em scripts/build-fonts.mjs e no teste que lê a tabela `name`
// dos WOFF2 versionados.
declare module 'wawoff2' {
  export function compress(sfnt: Uint8Array): Promise<Uint8Array>;
  export function decompress(woff2: Uint8Array): Promise<Uint8Array>;
}
