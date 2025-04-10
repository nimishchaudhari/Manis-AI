import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createLogger } from '@acme/shared-utils';
import routes from './routes/index.js';
import fastifyPlugin from './plugins/index.js';
import { swaggerOptions, swaggerUiOptions } from './swagger.js';

const logger = createLogger('api-gateway');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
await fastify.register(cors, {
  origin: true,
});

// Register Swagger
await fastify.register(swagger, swaggerOptions);
await fastify.register(swaggerUi, swaggerUiOptions);

// Register custom plugins
await fastify.register(fastifyPlugin);

// Register routes
await fastify.register(routes);

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(`Server listening on ${HOST}:${PORT}`);
    logger.info(`API documentation available at http://${HOST}:${PORT}/documentation`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
