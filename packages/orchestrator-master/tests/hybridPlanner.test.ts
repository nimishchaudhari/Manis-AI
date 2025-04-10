import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import HybridPlanner, { HybridPlannerConfig } from '../src/hybridPlanner';
import { TaskAssignmentSchema } from '@acme/shared-mcp';

vi.mock('axios');

describe('HybridPlanner', () => {
  const llmServiceUrl = 'http://mock-llm-service.com';
  const planningTimeout = 10000;
  let hybridPlanner: HybridPlanner;
  let config: HybridPlannerConfig;

  beforeEach(() => {
    config = { llmServiceUrl, planningTimeout };
    hybridPlanner = new HybridPlanner(config);
    vi.clearAllMocks();
  });

  it('should create HybridPlanner instance with correct configuration', () => {
    expect(hybridPlanner).toBeInstanceOf(HybridPlanner);
    expect(hybridPlanner['config'].llmServiceUrl).toBe(llmServiceUrl);
    expect(hybridPlanner['config'].planningTimeout).toBe(planningTimeout);
      });

  it('should decompose goal successfully', async () => {
    const goal = 'Test goal';
    const taskAssignments = [
      {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        taskId: '123e4567-e89b-12d3-a456-426614174001',
        taskType: 'test',
        description: 'Test task',
        parameters: {},
      },
    ];

    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 200,
      data: { taskAssignments },
    });

    const result = await hybridPlanner.decomposeGoal(goal);
    expect(result).toEqual(taskAssignments);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(`${llmServiceUrl}/decompose`, { goal }, { timeout: planningTimeout });
  });

  it('should throw error on non-200 response from LLM service', async () => {
    const goal = 'Test goal';
    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 400,
      statusText: 'Bad Request',
    });

    await expect(hybridPlanner.decomposeGoal(goal)).rejects.toThrow('Failed to decompose goal: Bad Request');
  });

  it('should throw error on invalid TaskAssignment received', async () => {
    const goal = 'Test goal';
    const taskAssignments = [{ invalid: 'task' }];

    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 200,
      data: { taskAssignments },
    });

    await expect(hybridPlanner.decomposeGoal(goal)).rejects.toThrow('Invalid TaskAssignment received from LLM service');
  });

  it('should handle axios error', async () => {
    const goal = 'Test goal';
    const errorMessage = 'Network Error';
    vi.mocked(axios.post).mockRejectedValueOnce(new AxiosError(errorMessage));

    await expect(hybridPlanner.decomposeGoal(goal)).rejects.toThrow(`Error decomposing goal: ${errorMessage}`);
  });

  it('should handle non-axios error', async () => {
    const goal = 'Test goal';
    const error = new Error('Unexpected error');
    vi.mocked(axios.post).mockRejectedValueOnce(error);

    await expect(hybridPlanner.decomposeGoal(goal)).rejects.toThrow(error);
  });
});