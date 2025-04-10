import amqplib, { Channel } from 'amqplib';
import { TaskAssignment, StatusUpdate, CoTLog } from '@acme/shared-mcp';
import { RabbitMQConfig, RabbitMQClient, Logger, createLogger } from '@acme/shared-utils';

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
  sendStatusUpdate(update: Omit<StatusUpdate, 'timestamp' | 'jobId' | 'taskId'> & Partial<Pick<StatusUpdate, 'error'>>): Promise<void>; // Auto-fill common fields

  /**
   * Sends a Chain-of-Thought log message via the message bus.
   * @param log The CoT log payload.
   */
  sendCoTLog(log: Omit<CoTLog, 'timestamp' | 'jobId' | 'taskId' | 'agentId'>): Promise<void>; // Auto-fill common fields

  /**
   * Gracefully shuts down the agent.
   */
  shutdown(): Promise<void>;
}

export abstract class AgentService implements IAgent {
  protected config: RabbitMQConfig;
  protected logger: Logger;
  protected rabbitMQClient: RabbitMQClient;
  protected channel: amqplib.Channel | null = null;
  protected agentId: string;
  protected taskQueue: string;

  constructor(config: RabbitMQConfig, agentId: string, taskQueue: string) {
    this.config = config;
    this.logger = createLogger(`agent-${agentId}`);
    this.rabbitMQClient = new RabbitMQClient(this.config, this.logger);
    this.agentId = agentId;
    this.taskQueue = taskQueue;
  }

  async initialize(): Promise<void> {
    await this.rabbitMQClient.connect();
    if (this.channel) {
        this.channel = this.rabbitMQClient.getChannel();
        await this.channel?.assertQueue(this.taskQueue, { durable: true });
    }
    this.logger.info(`Agent ${this.agentId} initialized and listening for tasks on queue: ${this.taskQueue}`);
  }

  async start(): Promise<void> {
    if (this.channel) {
      this.channel.consume(this.taskQueue, async (msg: any) => {
        if (msg) {
          try {
            const task: TaskAssignment = JSON.parse(msg.content.toString());
            this.logger.info(`Received task: ${task.taskId} for job: ${task.jobId}`);
            await this.handleTask(task);
            this.channel?.ack(msg);
          } catch (error: any) {
            this.logger.error(`Error processing message: ${error.message}`, error);
            this.channel?.nack(msg, false, false); // Reject and don't requeue
          }
        }
      }, { noAck: false });
    }
  }

  abstract handleTask(task: TaskAssignment): Promise<void>;
  abstract executeTask(task: TaskAssignment): Promise<unknown>;

  async sendStatusUpdate(update: Omit<StatusUpdate, 'timestamp' | 'jobId' | 'taskId'> & Partial<Pick<StatusUpdate, 'error'>>): Promise<void> {
    const jobId = 'test-job-id'; // Replace with actual jobId
    const taskId = 'test-task-id'; // Replace with actual taskId
    const statusUpdate: StatusUpdate = {
      jobId,
      taskId,
      ...update,
      timestamp: new Date().toISOString(),
    };
    const channel = this.rabbitMQClient.getChannel();
    channel.publish('status', `agent.${this.agentId}.status`, Buffer.from(JSON.stringify(statusUpdate)));
    this.logger.info(`Sent status update: ${statusUpdate.status} for task: ${taskId} job: ${jobId}`);
  }

  async sendCoTLog(log: Omit<CoTLog, 'timestamp' | 'jobId' | 'taskId' | 'agentId'>): Promise<void> {
    const jobId = 'test-job-id'; // Replace with actual jobId
    const taskId = 'test-task-id'; // Replace with actual taskId
    const coTLog: CoTLog = {
      agentId: this.agentId,
      jobId,
      taskId,
      ...log,
      timestamp: new Date().toISOString(),
    };
    const channel = this.rabbitMQClient.getChannel();
    channel.publish('logs', `agent.${this.agentId}.logs`,  Buffer.from(JSON.stringify(coTLog)));
    this.logger.info(`Sent CoT log for task: ${taskId} job: ${jobId}`);
  }

  async shutdown(): Promise<void> {
    await this.rabbitMQClient.close();
    this.logger.info(`Agent ${this.agentId} shut down`);
  }
}