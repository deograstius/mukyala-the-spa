import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
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
