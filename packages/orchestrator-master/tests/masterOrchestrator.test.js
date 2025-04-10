"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const masterOrchestrator_1 = __importDefault(require("../src/masterOrchestrator"));
const shared_utils_1 = require("@acme/shared-utils");
const hybridPlanner_1 = __importDefault(require("../src/hybridPlanner"));
vitest_1.vi.mock('@acme/shared-utils', () => ({
    RabbitMQClient: vitest_1.vi.fn().mockImplementation(() => ({
        connect: vitest_1.vi.fn(),
        getChannel: vitest_1.vi.fn().mockReturnValue({
            assertExchange: vitest_1.vi.fn(),
            assertQueue: vitest_1.vi.fn(),
            bindQueue: vitest_1.vi.fn(),
            consume: vitest_1.vi.fn(),
            publish: vitest_1.vi.fn(),
        }),
        close: vitest_1.vi.fn(),
    })),
}));
vitest_1.vi.mock('../src/hybridPlanner', () => ({
    default: vitest_1.vi.fn().mockImplementation(() => ({
        decomposeGoal: vitest_1.vi.fn().mockResolvedValue([]),
    })),
}));
(0, vitest_1.describe)('MasterOrchestrator', () => {
    let orchestrator;
    const config = {
        rabbitmq: {
            url: 'amqp://localhost'
        },
        llmServiceUrl: 'http://llm-service',
        planningTimeout: 30000,
    };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        orchestrator = new masterOrchestrator_1.default(config);
    });
    (0, vitest_1.it)('should initialize correctly', async () => {
        await orchestrator.connect();
        (0, vitest_1.expect)(shared_utils_1.RabbitMQClient).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(shared_utils_1.RabbitMQClient).toHaveBeenCalledWith(config.rabbitmq, vitest_1.expect.anything());
        (0, vitest_1.expect)(hybridPlanner_1.default).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(hybridPlanner_1.default).toHaveBeenCalledWith({
            llmServiceUrl: config.llmServiceUrl,
            planningTimeout: config.planningTimeout,
        });
        (0, vitest_1.expect)(orchestrator['rabbitmqClient'].connect).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(orchestrator['rabbitmqClient'].getChannel().consume).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should process user goal and generate task assignments', async () => {
        const goal = 'Test goal';
        const taskAssignments = [
            { jobId: 'job1', taskId: 'task1', taskType: 'test', description: 'Test task 1', parameters: {} },
            { jobId: 'job1', taskId: 'task2', taskType: 'test', description: 'Test task 2', parameters: {} },
        ];
        vitest_1.vi.spyOn(orchestrator['hybridPlanner'], 'decomposeGoal').mockResolvedValue(taskAssignments);
        const jobId = await orchestrator.processUserGoal(goal);
        (0, vitest_1.expect)(jobId).toBeDefined();
        (0, vitest_1.expect)(orchestrator['hybridPlanner'].decomposeGoal).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(orchestrator['hybridPlanner'].decomposeGoal).toHaveBeenCalledWith(goal);
        (0, vitest_1.expect)(orchestrator['rabbitmqClient'].getChannel().publish).toHaveBeenCalledTimes(taskAssignments.length);
        taskAssignments.forEach((task) => {
            (0, vitest_1.expect)(orchestrator['rabbitmqClient'].getChannel().publish).toHaveBeenCalledWith('tasks', `task.${task.taskType}`, vitest_1.expect.anything());
        });
    });
    (0, vitest_1.it)('should handle status updates', async () => {
        const statusUpdate = {
            jobId: 'job1',
            taskId: 'task1',
            status: 'in-progress',
            timestamp: new Date().toISOString(),
        };
        await orchestrator.connect();
        const consumeCallback = orchestrator['rabbitmqClient'].getChannel().consume.mock.calls[0][1];
        await consumeCallback({ content: Buffer.from(JSON.stringify(statusUpdate)) });
        (0, vitest_1.expect)(orchestrator.getTaskStatus('task1')).toEqual(statusUpdate);
    });
    (0, vitest_1.it)('should retrieve task status', async () => {
        const taskId = 'task1';
        const statusUpdate = {
            jobId: 'job1',
            taskId,
            status: 'completed',
            timestamp: new Date().toISOString(),
        };
        orchestrator['taskStatus'].set(taskId, statusUpdate);
        (0, vitest_1.expect)(orchestrator.getTaskStatus(taskId)).toEqual(statusUpdate);
    });
    (0, vitest_1.it)('should throw an error if configuration is invalid', () => {
        const invalidConfig = { rabbitmq: { url: '' }, llmServiceUrl: '' };
        (0, vitest_1.expect)(() => new masterOrchestrator_1.default(invalidConfig)).toThrowError('Invalid configuration provided to MasterOrchestrator');
    });
    (0, vitest_1.it)('should handle error when publishing task assignment fails', async () => {
        const goal = 'Test goal';
        const taskAssignments = [
            { jobId: 'job1', taskId: 'task1', taskType: 'test', description: 'Test task', parameters: {} },
        ];
        vitest_1.vi.spyOn(orchestrator['hybridPlanner'], 'decomposeGoal').mockResolvedValue(taskAssignments);
        vitest_1.vi.spyOn(orchestrator['rabbitmqClient'].getChannel(), 'publish').mockRejectedValue(new Error('Failed to publish task assignment'));
        await (0, vitest_1.expect)(orchestrator.processUserGoal(goal)).rejects.toThrowError('Failed to publish task assignments');
    });
});
