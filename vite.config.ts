import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import gtmInjection from './scripts/vite-plugin-gtm.mjs';

// Dev-only `/v1` proxy: forwards SPA fetches that build origin-relative URLs
// (e.g. `apiPost('/v1/consultations')`) from the Vite dev server (`:5173`)
// to the local `mukyala-core-api` (`:4000`, see `mukyala-core-api/.env.example`
// `PORT=4000`). Without this, `/v1/*` requests 404 against the Vite dev
// server, which does not implement those routes.
//
// Production/staging SPA builds resolve absolute API URLs from
// `VITE_API_BASE_URL` (see `src/app/config.ts`); `server.proxy` is ignored by
// `vite build`/`vite preview`, so prod behavior is unaffected.
//
// Single rule covers `/v1/consultations`, `/v1/services`, `/v1/home`,
// `/v1/notification-preferences/*`, etc. Telemetry collector and any non-`/v1`
// upstreams are intentionally out of scope; add sibling entries when needed.
//
// chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
// `gtmInjection()` is a no-op when `VITE_GTM_ID` is unset (zero-network in dev
// + prod). When set + valid, it injects the Consent Mode v2 default state +
// GTM loader into <head> and the <noscript> iframe into <body>. Placed BEFORE
// `react()` so the head injection runs early relative to the React refresh
// pre-amble.

export default defineConfig({
  plugins: [
    gtmInjection(),
    react(),
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
      additionalPrerenderRoutes: ['/privacy', '/terms', '/sms-disclosures', '/reservation'],
    }),
  ],
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@app-types': path.resolve(__dirname, 'src/types'),
      '@generated': path.resolve(__dirname, 'src/generated'),
    },
  },
  // @ts-expect-error – vitest config not yet part of `vite` types
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.tsx',
    css: true,
    include: ['src/**/*.test.{js,ts,jsx,tsx}', 'src/**/*.spec.{js,ts,jsx,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**'],
      exclude: ['src/test/**', '**/*.d.ts'],
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 80,
    },
  },
});
