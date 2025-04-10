import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jobRoutes from '../routes/jobs.js';

// Mock the orchestrator
const mockProcessUserGoal = vi.fn();
const mockGetJobStatus = vi.fn();

// Create a mock Fastify instance with the orchestrator
beforeEach(() => {
  vi.resetAllMocks();
  mockProcessUserGoal.mockResolvedValue('test-job-id');
  mockGetJobStatus.mockReturnValue({
    jobId: 'test-job-id',
    goal: 'Test goal',
    status: 'in-progress',
    timestamp: new Date().toISOString(),
    tasks: [],
  });
});

describe('Job Routes', () => {
  it('should create a new job successfully', async () => {
    const fastify = Fastify();
    fastify.decorate('orchestrator', {
      processUserGoal: mockProcessUserGoal,
      getJobStatus: mockGetJobStatus,
    });

    await fastify.register(jobRoutes);

    const response = await fastify.inject({
      method: 'POST',
      url: '/',
      payload: {
        goal: 'This is a test goal with at least 10 characters',
      },
    });

    expect(response.statusCode).toBe(202);
    expect(JSON.parse(response.payload)).toEqual({ jobId: 'test-job-id' });
    expect(mockProcessUserGoal).toHaveBeenCalledWith('This is a test goal with at least 10 characters');
  });

  it('should return 400 for invalid goal', async () => {
    const fastify = Fastify();
    fastify.decorate('orchestrator', {
      processUserGoal: mockProcessUserGoal,
      getJobStatus: mockGetJobStatus,
    });

    await fastify.register(jobRoutes);

    const response = await fastify.inject({
      method: 'POST',
      url: '/',
      payload: {
        goal: 'short', // less than 10 characters
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toHaveProperty('error', 'Invalid input');
    expect(mockProcessUserGoal).not.toHaveBeenCalled();
  });

  it('should get job status successfully', async () => {
    const fastify = Fastify();
    fastify.decorate('orchestrator', {
      processUserGoal: mockProcessUserGoal,
      getJobStatus: mockGetJobStatus,
    });

    await fastify.register(jobRoutes);

    const response = await fastify.inject({
      method: 'GET',
      url: '/test-job-id/status',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({
      jobId: 'test-job-id',
      goal: 'Test goal',
      status: 'in-progress',
      timestamp: expect.any(String),
      tasks: [],
    });
    expect(mockGetJobStatus).toHaveBeenCalledWith('test-job-id');
  });

  it('should return 404 for non-existent job', async () => {
    const fastify = Fastify();
    fastify.decorate('orchestrator', {
      processUserGoal: mockProcessUserGoal,
      getJobStatus: () => undefined, // Simulate job not found
    });

    await fastify.register(jobRoutes);

    const response = await fastify.inject({
      method: 'GET',
      url: '/non-existent-job-id/status',
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.payload)).toEqual({ error: 'Job not found' });
  });
});
