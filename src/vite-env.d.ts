/// <reference types="vite/client" />

// Self-hosted zxing WASM binary for the retail barcode scanner (?url makes
// Vite emit it as an asset and hand back its URL).
declare module 'zxing-wasm/reader/zxing_reader.wasm?url' {
  const src: string;
  export default src;
}
