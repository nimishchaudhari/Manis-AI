import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    deps: {
      inline: true,
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    mockReset: true,
    testTimeout: 10000,
  },
});