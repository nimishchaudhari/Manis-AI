import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    deps: {
      inline: ['@acme/shared-mcp', '@acme/shared-utils']
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    mockReset: true,
    testTimeout: 10000,
    env: {
      // Mock environment variables for tests
      PORT: '3002',
      MOCK_API_BASE_URL: 'https://jsonplaceholder.typicode.com',
      RUN_REAL_API_TESTS: 'false', // Don't run real API tests in CI
    },
  },
});
