import jobRoutes from './jobs.js';
const routes = async (fastify, _options) => {
    // Register job routes
    fastify.register(jobRoutes, { prefix: '/v1/jobs' });
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
};
export default routes;
