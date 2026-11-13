import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['**/*.spec.ts', '**/node_modules/**', '**/dist/**', '**/.agents/**', '**/e2e/**'],
    testTimeout: 30000,
  },
});
