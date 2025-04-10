import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 10000,
    mockReset: false,
    deps: {
      inline: [/@acme\/.*/],
    }
  },
});
