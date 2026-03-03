import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

export default defineConfig({
  plugins: [
    react(),
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
      additionalPrerenderRoutes: ['/privacy', '/terms', '/sms-disclosures', '/reservation'],
    }),
  ],
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
