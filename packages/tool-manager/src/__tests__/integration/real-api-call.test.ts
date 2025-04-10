import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import toolRoutes from '../../routes/tools.js';
// Import removed to fix linting error
import { tools } from '../../tools/index.js';

// This test makes real API calls to JSONPlaceholder
// It can be skipped in CI environments or when we don't want to make external calls

const runRealApiTests = process.env.RUN_REAL_API_TESTS === 'true';

// Conditionally describe the test suite
const testSuite = runRealApiTests ? describe : describe.skip;

testSuite('Tool Manager - Real API Integration Tests', () => {
  let fastify;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(toolRoutes);
  });

  afterAll(async () => {
    await fastify.close();
  });

  it('should successfully call a real JSONPlaceholder endpoint', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/mock_api/execute',
      payload: {
        params: {
          endpoint: '/posts/1',
          method: 'GET',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload).result;
    expect(result).toHaveProperty('status', 200);
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('id', 1);
    expect(result.data).toHaveProperty('title');
    expect(result.data).toHaveProperty('body');
    expect(result.data).toHaveProperty('userId');
  });

  it('should successfully create a post on JSONPlaceholder', async () => {
    const testPost = {
      title: 'Manis AI Test Post',
      body: 'This is a test post from the Manis AI integration tests',
      userId: 1,
    };

    const response = await fastify.inject({
      method: 'POST',
      url: '/mock_api/execute',
      payload: {
        params: {
          endpoint: '/posts',
          method: 'POST',
          data: testPost,
        },
      },
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload).result;
    expect(result).toHaveProperty('status', 201);
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('title', testPost.title);
    expect(result.data).toHaveProperty('body', testPost.body);
    expect(result.data).toHaveProperty('userId', testPost.userId);
  });

  it('should handle errors from non-existent endpoints', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/mock_api/execute',
      payload: {
        params: {
          endpoint: '/non-existent-endpoint',
          method: 'GET',
        },
      },
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.payload)).toHaveProperty('error', 'Internal server error');
  });

  // Direct tool tests without going through the API
  it('should directly use the mock_api tool to fetch data', async () => {
    const result = await tools.mock_api({
      endpoint: '/users/1',
      method: 'GET',
    });

    expect(result).toHaveProperty('status', 200);
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('id', 1);
    expect(result.data).toHaveProperty('name');
    expect(result.data).toHaveProperty('email');
  });
});
