import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import MasterOrchestrator from '@acme/orchestrator-master';

declare module 'fastify' {
  interface FastifyInstance {
    orchestrator: MasterOrchestrator;
  }
}

const fastifyPlugin: FastifyPluginAsync = async (fastify, _options) => {
  const orchestrator = new MasterOrchestrator({
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    },
    llmServiceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:3001',
    planningTimeout: process.env.PLANNING_TIMEOUT ? parseInt(process.env.PLANNING_TIMEOUT, 10) : 30000,
  });

  // Connect to RabbitMQ
  await orchestrator.connect();

  // Add orchestrator to Fastify instance
  fastify.decorate('orchestrator', orchestrator);

  // Close connection when Fastify closes
  fastify.addHook('onClose', async (_instance) => {
    // Add any cleanup logic when needed
  });
};

export default fp(fastifyPlugin, { name: 'orchestrator' });
