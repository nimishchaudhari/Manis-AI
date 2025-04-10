import amqplib from 'amqplib';
import { TaskAssignment, StatusUpdate, CoTLog } from '@acme/shared-mcp';
import { RabbitMQConfig, Logger, RabbitMQClient } from '@acme/shared-utils';

interface IAgent {
    /**
     * Initializes the agent, connects to message bus, registers capabilities.
     */
    initialize(): Promise<void>;
    /**
     * Starts listening for tasks on the message bus.
     */
    start(): Promise<void>;
    /**
     * Handles an incoming task assignment. This is typically called by the message bus listener.
     * @param task The task assignment details.
     */
    handleTask(task: TaskAssignment): Promise<void>;
    /**
     * Performs the actual work for the task.
     * @param task The task assignment details.
     * @returns The result of the task execution.
     */
    executeTask(task: TaskAssignment): Promise<unknown>;
    /**
     * Sends a status update message via the message bus.
     * @param update The status update payload.
     */
    sendStatusUpdate(update: Omit<StatusUpdate, 'timestamp' | 'jobId' | 'taskId'> & Partial<Pick<StatusUpdate, 'error'>>): Promise<void>;
    /**
     * Sends a Chain-of-Thought log message via the message bus.
     * @param log The CoT log payload.
     */
    sendCoTLog(log: Omit<CoTLog, 'timestamp' | 'jobId' | 'taskId' | 'agentId'>): Promise<void>;
    /**
     * Gracefully shuts down the agent.
     */
    shutdown(): Promise<void>;
}
declare abstract class AgentService implements IAgent {
    protected config: RabbitMQConfig;
    protected logger: Logger;
    protected rabbitMQClient: RabbitMQClient;
    protected channel: amqplib.Channel | null;
    protected agentId: string;
    protected taskQueue: string;
    constructor(config: RabbitMQConfig, agentId: string, taskQueue: string);
    initialize(): Promise<void>;
    start(): Promise<void>;
    abstract handleTask(task: TaskAssignment): Promise<void>;
    abstract executeTask(task: TaskAssignment): Promise<unknown>;
    sendStatusUpdate(update: Omit<StatusUpdate, 'timestamp' | 'jobId' | 'taskId'> & Partial<Pick<StatusUpdate, 'error'>>): Promise<void>;
    sendCoTLog(log: Omit<CoTLog, 'timestamp' | 'jobId' | 'taskId' | 'agentId'>): Promise<void>;
    shutdown(): Promise<void>;
}

export { AgentService, type IAgent };
