import { describe, expect, it, vi, beforeEach } from 'vitest';
import MasterOrchestrator from '../src/masterOrchestrator';
import { RabbitMQClient } from '@acme/shared-utils';
import HybridPlanner from '../src/hybridPlanner';
import { TaskAssignment, StatusUpdate } from '@acme/shared-mcp';

vi.mock('@acme/shared-utils', () => ({
  RabbitMQClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    getChannel: vi.fn().mockReturnValue({
      assertExchange: vi.fn(),
      assertQueue: vi.fn(),
      bindQueue: vi.fn(),
      consume: vi.fn(),
      publish: vi.fn(),
    }),
    close: vi.fn(),
  })),
}));

vi.mock('../src/hybridPlanner', () => ({
  default: vi.fn().mockImplementation(() => ({
    decomposeGoal: vi.fn().mockResolvedValue([]),
  })),
}));

describe('MasterOrchestrator', () => {
  let orchestrator: MasterOrchestrator;
  const config = {
    rabbitmq: {
      url: 'amqp://localhost'
    },
    llmServiceUrl: 'http://llm-service',
    planningTimeout: 30000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new MasterOrchestrator(config);
  });

  it('should initialize correctly', async () => {
    await orchestrator.connect();
    expect(RabbitMQClient).toHaveBeenCalledTimes(1);
    expect(RabbitMQClient).toHaveBeenCalledWith(config.rabbitmq, expect.anything());
    expect(HybridPlanner).toHaveBeenCalledTimes(1);
    expect(HybridPlanner).toHaveBeenCalledWith({
      llmServiceUrl: config.llmServiceUrl,
      planningTimeout: config.planningTimeout,
    });
    expect(orchestrator['rabbitmqClient'].connect).toHaveBeenCalledTimes(1);
    expect(orchestrator['rabbitmqClient'].getChannel().consume).toHaveBeenCalledTimes(1);
  });

  it('should process user goal and generate task assignments', async () => {
    const goal = 'Test goal';
    const taskAssignments: TaskAssignment[] = [
      { jobId: 'job1', taskId: 'task1', taskType: 'test', description: 'Test task 1', parameters: {} },
      { jobId: 'job1', taskId: 'task2', taskType: 'test', description: 'Test task 2', parameters: {} },
    ];
    vi.spyOn(orchestrator['hybridPlanner'], 'decomposeGoal').mockResolvedValue(taskAssignments);

    const jobId = await orchestrator.processUserGoal(goal);
    expect(jobId).toBeDefined();
    expect(orchestrator['hybridPlanner'].decomposeGoal).toHaveBeenCalledTimes(1);
    expect(orchestrator['hybridPlanner'].decomposeGoal).toHaveBeenCalledWith(goal);
    expect(orchestrator['rabbitmqClient'].getChannel().publish).toHaveBeenCalledTimes(taskAssignments.length);
    taskAssignments.forEach((task) => {
      expect(orchestrator['rabbitmqClient'].getChannel().publish).toHaveBeenCalledWith(
        'tasks',
        `task.${task.taskType}`,
        expect.anything()
      );
    });
  });

  it('should handle status updates', async () => {
    const statusUpdate: StatusUpdate = {
      jobId: 'job1',
      taskId: 'task1',
      status: 'in-progress',
      timestamp: new Date().toISOString(),
    };

    await orchestrator.connect();
    const consumeCallback = (orchestrator['rabbitmqClient'].getChannel().consume as ReturnType<typeof vi.fn>).mock.calls[0][1];
    await consumeCallback({ content: Buffer.from(JSON.stringify(statusUpdate)) });

    expect(orchestrator.getTaskStatus('task1')).toEqual(statusUpdate);
  });

  it('should retrieve task status', async () => {
    const taskId = 'task1';
    const statusUpdate: StatusUpdate = {
      jobId: 'job1',
      taskId,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    orchestrator['taskStatus'].set(taskId, statusUpdate);

    expect(orchestrator.getTaskStatus(taskId)).toEqual(statusUpdate);
  });

  it('should throw an error if configuration is invalid', () => {
    const invalidConfig = { rabbitmq: { url: '' }, llmServiceUrl: '' } as any;
    expect(() => new MasterOrchestrator(invalidConfig)).toThrowError(
      'Invalid configuration provided to MasterOrchestrator',
    );
  });

  it('should handle error when publishing task assignment fails', async () => {
    const goal = 'Test goal';
    const taskAssignments: TaskAssignment[] = [
      { jobId: 'job1', taskId: 'task1', taskType: 'test', description: 'Test task', parameters: {} },
    ];
    vi.spyOn(orchestrator['hybridPlanner'], 'decomposeGoal').mockResolvedValue(taskAssignments);
    vi.spyOn(orchestrator['rabbitmqClient'].getChannel(), 'publish').mockRejectedValue(new Error('Failed to publish task assignment'));

    await expect(orchestrator.processUserGoal(goal)).rejects.toThrowError(
      'Failed to publish task assignments',
    );
  });
});