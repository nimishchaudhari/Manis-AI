import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    deps: {
      inline: ['@acme/shared-mcp', '@acme/shared-utils', '@acme/agent-template']
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    mockReset: true,
    testTimeout: 10000,
  },
});
