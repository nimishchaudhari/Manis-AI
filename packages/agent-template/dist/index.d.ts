import amqplib from 'amqplib';
import { TaskAssignment, StatusUpdate, CoTLog } from '@acme/shared-mcp';
import { RabbitMQConfig, RabbitMQClient, Logger, ToolManagerClient, ToolManagerConfig } from '@acme/shared-utils';
export interface IAgent {
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
export interface AgentConfig {
    rabbitmq: RabbitMQConfig;
    toolManager?: ToolManagerConfig;
}
export declare abstract class AgentService implements IAgent {
    protected config: AgentConfig;
    protected logger: Logger;
    protected rabbitMQClient: RabbitMQClient;
    protected toolManagerClient?: ToolManagerClient;
    protected channel: amqplib.Channel | null;
    protected agentId: string;
    protected taskQueue: string;
    protected capabilities: string[];
    protected currentJobId: string | null;
    protected currentTaskId: string | null;
    constructor(config: AgentConfig, agentId: string, taskQueue: string, capabilities?: string[]);
    initialize(): Promise<void>;
    registerCapabilities(): Promise<void>;
    start(): Promise<void>;
    handleTask(task: TaskAssignment): Promise<void>;
    abstract executeTask(task: TaskAssignment): Promise<unknown>;
    /**
     * Helper method to execute a tool via the Tool Manager
     * @param toolName Name of the tool to execute
     * @param params Parameters for the tool
     */
    executeTool(toolName: string, params: Record<string, unknown>): Promise<unknown>;
    sendStatusUpdate(update: Omit<StatusUpdate, 'timestamp' | 'jobId' | 'taskId'> & Partial<Pick<StatusUpdate, 'error'>>): Promise<void>;
    sendCoTLog(log: Omit<CoTLog, 'timestamp' | 'jobId' | 'taskId' | 'agentId'>): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map