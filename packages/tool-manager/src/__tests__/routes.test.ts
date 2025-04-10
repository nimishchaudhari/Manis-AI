import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import toolRoutes from '../routes/tools.js';

// Mock the tools
vi.mock('../tools/index.js', () => {
  return {
    tools: {
      mock_api: vi.fn(),
    },
    ToolName: undefined,
  };
});

import { tools } from '../tools/index.js';

describe('Tool Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tools.mock_api as any).mockResolvedValue({
      status: 200,
      data: { id: 1, title: 'Test Data' },
    });
  });

  it('should execute a tool successfully', async () => {
    const fastify = Fastify();
    await fastify.register(toolRoutes);

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
    expect(JSON.parse(response.payload)).toEqual({
      result: {
        status: 200,
        data: { id: 1, title: 'Test Data' },
      },
    });
    expect(tools.mock_api).toHaveBeenCalledWith({
      endpoint: '/posts/1',
      method: 'GET',
    });
  });

  it('should return 400 for invalid params', async () => {
    const fastify = Fastify();
    await fastify.register(toolRoutes);

    const response = await fastify.inject({
      method: 'POST',
      url: '/mock_api/execute',
      payload: {
        // Missing params field
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toHaveProperty('error', 'Invalid input');
    expect(tools.mock_api).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent tool', async () => {
    const fastify = Fastify();
    await fastify.register(toolRoutes);

    const response = await fastify.inject({
      method: 'POST',
      url: '/non_existent_tool/execute',
      payload: {
        params: {},
      },
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.payload)).toEqual({ error: "Tool 'non_existent_tool' not found" });
    expect(tools.mock_api).not.toHaveBeenCalled();
  });

  it('should handle tool execution errors', async () => {
    const fastify = Fastify();
    await fastify.register(toolRoutes);

    (tools.mock_api as any).mockRejectedValueOnce(new Error('Tool execution failed'));

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

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.payload)).toHaveProperty('error', 'Internal server error');
    expect(tools.mock_api).toHaveBeenCalledWith({
      endpoint: '/posts/1',
      method: 'GET',
    });
  });
});
