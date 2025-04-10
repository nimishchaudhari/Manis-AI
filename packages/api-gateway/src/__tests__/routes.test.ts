import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jobRoutes from '../routes/jobs.js';

describe('Job Routes', () => {
  it('should create a new job successfully', async () => {
    // Mock orchestrator
    const mockProcessUserGoal = vi.fn().mockResolvedValue('test-job-id');
    
    const fastify = Fastify();
    fastify.decorate('orchestrator', {
      processUserGoal: mockProcessUserGoal,
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
    const mockProcessUserGoal = vi.fn().mockResolvedValue('test-job-id');
    
    const fastify = Fastify();
    fastify.decorate('orchestrator', {
      processUserGoal: mockProcessUserGoal,
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
    expect(mockProcessUserGoal).not.toHaveBeenCalled();
  });
});
