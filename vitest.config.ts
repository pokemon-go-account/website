import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Run test files one at a time (not in parallel workers) to prevent
    // MongoDB state conflicts: concurrent cleanup between files corrupts shared DB
    fileParallelism: false,
    server: {
      deps: {
        inline: ['next-auth', 'next'],
      },
    },
  },
});
