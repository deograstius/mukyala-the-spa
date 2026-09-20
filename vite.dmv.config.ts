import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Third website in this repo: the DMV event site served at
// dmv[.staging].mukyala.com (NOTES/dmv-event-spec.md decision #17 — own site,
// admin-app precedent). Deliberately NOT the customer spa config:
//   - no prerender plugin, no GTM injection, no cart, no cookie banner
//   - own entry (dmv/index.html + src/dmv/**), own output (dist-dmv/)
// The customer build never imports src/dmv/**, so the www bundle is
// structurally unaffected by this app.
//
// publicDir reuses the customer public/ because the design system's
// global.css @imports /css/*.css from it (and icons + the dmv image set live
// there). The plugin below replaces the CUSTOMER robots/sitemap: the event
// site is indexable but must not claim the spa's sitemap.
//
// API base: none is baked for staging — src/app/config.ts's host fallback
// maps *.staging.mukyala.com to api.staging.mukyala.com.

export default defineConfig({
  root: path.resolve(__dirname, 'dmv'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [
    react(),
    {
      name: 'dmv-robots-override',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist-dmv');
        if (!fs.existsSync(outDir)) return;
        fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /\n');
        fs.rmSync(path.join(outDir, 'sitemap.xml'), { force: true });
      },
    },
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist-dmv'),
    emptyOutDir: true,
  },
  server: {
    // 5175 so the customer (5173) and admin (5174) dev servers can run alongside.
    port: 5175,
    proxy: {
      '/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/orders': {
        target: 'http://localhost:4300',
        changeOrigin: true,
      },
      '/inventory': {
        target: 'http://localhost:4200',
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
});
