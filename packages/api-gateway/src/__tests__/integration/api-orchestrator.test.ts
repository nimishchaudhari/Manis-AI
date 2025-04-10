import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import jobRoutes from '../../routes/jobs.js';
import MasterOrchestrator from '@acme/orchestrator-master';

// Mock the RabbitMQ connection
vi.mock('@acme/shared-utils', () => {
  const original = vi.importActual('@acme/shared-utils');
  return {
    ...original,
    RabbitMQClient: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      getChannel: vi.fn().mockReturnValue({
        assertExchange: vi.fn().mockResolvedValue(undefined),
        assertQueue: vi.fn().mockResolvedValue(undefined),
        bindQueue: vi.fn().mockResolvedValue(undefined),
        consume: vi.fn().mockResolvedValue(undefined),
        publish: vi.fn().mockResolvedValue(undefined),
        ack: vi.fn(),
        nack: vi.fn(),
      }),
    })),
  };
});

// Mock the HybridPlanner to not actually call any LLM
vi.mock('@acme/orchestrator-master/src/hybridPlanner', () => {
  return {
    default: class HybridPlanner {
      decomposeGoal = vi.fn().mockImplementation(async (goal: string) => {
        // Return some mock task assignments
        return [
          {
            jobId: uuidv4(),
            taskId: uuidv4(),
            taskType: 'web_search',
            description: `Search for information about ${goal}`,
            parameters: { query: goal },
          },
          {
            jobId: uuidv4(),
            taskId: uuidv4(),
            taskType: 'data_analysis',
            description: `Analyze data related to ${goal}`,
            parameters: { subject: goal },
          },
        ];
      });
    },
  };
});

// Create custom config to avoid connecting to real RabbitMQ
const testConfig = {
  rabbitmq: {
    url: 'amqp://localhost:5672', // This won't actually connect due to mocking
  },
  llmServiceUrl: 'http://localhost:3001',
  planningTimeout: 1000,
};

describe('API Gateway - Orchestrator Integration', () => {
  let fastify;
  let orchestrator;

  beforeAll(async () => {
    // Create a real orchestrator instance with mocked dependencies
    orchestrator = new MasterOrchestrator(testConfig);
    await orchestrator.connect(); // This won't actually connect due to mocking

    // Create Fastify instance
    fastify = Fastify();
    fastify.decorate('orchestrator', orchestrator);
    await fastify.register(jobRoutes);
  });

  afterAll(async () => {
    await fastify.close();
  });

  it('should submit a goal and return a job ID', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/',
      payload: {
        goal: 'Analyze the impact of AI on healthcare',
      },
    });

    expect(response.statusCode).toBe(202);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('jobId');
    expect(typeof payload.jobId).toBe('string');
    // UUID validation pattern
    expect(payload.jobId).toMatch(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    );
  });

  it('should get the status of a submitted job', async () => {
    // First submit a job
    const submitResponse = await fastify.inject({
      method: 'POST',
      url: '/',
      payload: {
        goal: 'Research recent advancements in robotics',
      },
    });

    const { jobId } = JSON.parse(submitResponse.payload);

    // Then get its status
    const statusResponse = await fastify.inject({
      method: 'GET',
      url: `/${jobId}/status`,
    });

    expect(statusResponse.statusCode).toBe(200);
    const status = JSON.parse(statusResponse.payload);
    expect(status).toHaveProperty('jobId', jobId);
    expect(status).toHaveProperty('goal', 'Research recent advancements in robotics');
    expect(status).toHaveProperty('status');
    expect(['pending', 'in-progress', 'completed', 'failed']).toContain(status.status);
    expect(status).toHaveProperty('tasks');
    expect(Array.isArray(status.tasks)).toBe(true);
  });

  it('should return 404 for non-existent job', async () => {
    const nonExistentJobId = uuidv4();
    const response = await fastify.inject({
      method: 'GET',
      url: `/${nonExistentJobId}/status`,
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.payload)).toEqual({ error: 'Job not found' });
  });
});
