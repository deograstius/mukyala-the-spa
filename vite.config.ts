import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
// Casting to 'any' avoids strict type errors for the Vitest-specific `test`
// field until the official Vite types include it.

export default defineConfig({
  plugins: [react()],
  // @ts-expect-error – vitest config not yet part of `vite` types
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.test.{js,ts,jsx,tsx}', 'src/**/*.spec.{js,ts,jsx,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
