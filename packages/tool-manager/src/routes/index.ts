import { FastifyPluginAsync } from 'fastify';
import toolRoutes from './tools.js';

const routes: FastifyPluginAsync = async (fastify, _options) => {
  // Register tool routes
  fastify.register(toolRoutes, { prefix: '/v1/tools' });

  // Health check route
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['system'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async (_request, _reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    },
  });

  // List available tools
  fastify.get('/v1/tools', {
    schema: {
      description: 'List all available tools',
      tags: ['tools'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              parameters: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    handler: async (_request, _reply) => {
      // For now, return a static list of available tools
      return [
        {
          name: 'mock_api',
          description: 'Mock API for testing tool integration',
          parameters: {
            endpoint: { type: 'string', description: 'API endpoint to call' },
            method: { type: 'string', enum: ['GET', 'POST'], default: 'GET', description: 'HTTP method' },
            data: { type: 'object', description: 'Data to send with POST requests', optional: true },
          },
        },
      ];
    },
  });
};

export default routes;
