import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Second website in this repo: the staff back-office served at
// admin[.staging].mukyala.com (NOTES/inventory-app-spec.md — in-repo second
// Vite build, decision #12). Deliberately NOT the customer config:
//   - no prerender plugin (staff tool, no SEO surface)
//   - no GTM injection; the app mounts no telemetry/cookie banner
//   - own entry (admin/index.html + src/admin/**), own output (dist-admin/)
// The customer build never imports src/admin/**, so the customer bundle is
// structurally unaffected by this app.
//
// publicDir reuses the customer public/ because the design system's
// global.css @imports /css/*.css from it (and the logo/favicons live there).
// The plugin below overwrites the CUSTOMER robots.txt/sitemap so the staff
// origin is never crawlable.
//
// API base: none is baked for staging — src/app/config.ts's host fallback
// maps *.staging.mukyala.com to api.staging.mukyala.com. The prod image bakes
// VITE_API_BASE_URL=https://api.mukyala.com (deploy workflow, at prod go).

export default defineConfig({
  root: path.resolve(__dirname, 'admin'),
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [
    react(),
    {
      name: 'admin-robots-override',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist-admin');
        if (!fs.existsSync(outDir)) return;
        fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
        fs.rmSync(path.join(outDir, 'sitemap.xml'), { force: true });
      },
    },
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist-admin'),
    emptyOutDir: true,
  },
  server: {
    // 5174 so the customer dev server (5173) can run alongside.
    port: 5174,
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
});
