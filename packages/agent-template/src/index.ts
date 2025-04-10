import amqplib from 'amqplib';
import { TaskAssignment, StatusUpdate, CoTLog } from '@acme/shared-mcp';
import { 
  RabbitMQConfig, 
  RabbitMQClient, 
  Logger, 
  createLogger, 
  ToolManagerClient,
  ToolManagerConfig
} from '@acme/shared-utils';

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

export interface AgentConfig {
  rabbitmq: RabbitMQConfig;
  toolManager?: ToolManagerConfig;
}

export abstract class AgentService implements IAgent {
  protected config: AgentConfig;
  protected logger: Logger;
  protected rabbitMQClient: RabbitMQClient;
  protected toolManagerClient?: ToolManagerClient;
  protected channel: amqplib.Channel | null = null;
  protected agentId: string;
  protected taskQueue: string;
  protected capabilities: string[];
  
  // Track current task context
  protected currentJobId: string | null = null;
  protected currentTaskId: string | null = null;

  constructor(config: AgentConfig, agentId: string, taskQueue: string, capabilities: string[] = []) {
    this.config = config;
    this.logger = createLogger(`agent-${agentId}`);
    this.rabbitMQClient = new RabbitMQClient(this.config.rabbitmq, this.logger);
    
    // Initialize Tool Manager client if config is provided
    if (config.toolManager) {
      this.toolManagerClient = new ToolManagerClient(config.toolManager, this.logger);
    }
    
    this.agentId = agentId;
    this.taskQueue = taskQueue;
    this.capabilities = capabilities;
  }

  async initialize(): Promise<void> {
    await this.rabbitMQClient.connect();
    this.channel = this.rabbitMQClient.getChannel();
    
    if (!this.channel) {
      throw new Error('Failed to get channel from RabbitMQ client');
    }
    
    // Set up messaging infrastructure
    await this.channel.assertExchange('tasks', 'direct', { durable: true });
    await this.channel.assertExchange('status', 'direct', { durable: true });
    await this.channel.assertExchange('logs', 'direct', { durable: true });
    
    // Create and bind task queue
    await this.channel.assertQueue(this.taskQueue, { durable: true });
    
    // Each agent binds to its specific task type
    for (const capability of this.capabilities) {
      await this.channel.bindQueue(this.taskQueue, 'tasks', `task.${capability}`);
    }
    
    this.logger.info(`Agent ${this.agentId} initialized with capabilities: ${this.capabilities.join(', ')}`);
    
    // Register capabilities
    await this.registerCapabilities();
  }

  async registerCapabilities(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    
    const capabilityMessage = {
      agentId: this.agentId,
      capabilities: this.capabilities,
      timestamp: new Date().toISOString(),
    };
    
    this.channel.publish(
      'capabilities', 
      'agent.capabilities', 
      Buffer.from(JSON.stringify(capabilityMessage))
    );
    
    this.logger.info(`Registered capabilities: ${this.capabilities.join(', ')}`);
  }

  async start(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    
    this.logger.info(`Starting to consume messages from queue: ${this.taskQueue}`);
    
    // Using 'channel' directly from scope since we've already checked it's not null
    const channel = this.channel;
    
    channel.consume(this.taskQueue, async (msg: amqplib.ConsumeMessage | null) => {
      if (msg) {
        try {
          const task: TaskAssignment = JSON.parse(msg.content.toString());
          this.logger.info(`Received task: ${task.taskId} for job: ${task.jobId}`);
          
          // Store current task context
          this.currentJobId = task.jobId;
          this.currentTaskId = task.taskId;
          
          // Send in-progress status update
          await this.sendStatusUpdate({ status: 'in-progress' });
          
          // Handle task
          await this.handleTask(task);
          
          // Acknowledge message
          if (channel) {
            channel.ack(msg);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error processing message: ${errorMessage}`);
          
          // Send failure status update if we have task context
          if (this.currentJobId && this.currentTaskId) {
            await this.sendStatusUpdate({ 
              status: 'failed', 
              message: `Error: ${errorMessage}`,
              error: errorMessage
            });
          }
          
          // Negative acknowledge message (don't requeue to avoid infinite loop)
          if (channel) {
            channel.nack(msg, false, false);
          }
        } finally {
          // Clear task context
          this.currentJobId = null;
          this.currentTaskId = null;
        }
      }
    }, { noAck: false });
    
    this.logger.info(`Agent ${this.agentId} started and is listening for tasks`);
  }

  async handleTask(task: TaskAssignment): Promise<void> {
    try {
      this.logger.info(`Handling task: ${task.taskId}, type: ${task.taskType}`);
      
      // Log the start of task execution
      await this.sendCoTLog({
        step: 'task_started',
        details: {
          taskType: task.taskType,
          description: task.description,
        },
      });
      
      // Execute the task
      const result = await this.executeTask(task);
      
      // Log the completion of task execution
      await this.sendCoTLog({
        step: 'task_completed',
        details: {
          taskType: task.taskType,
          result: result,
        },
      });
      
      // Send successful status update
      await this.sendStatusUpdate({
        status: 'completed',
        result: result,
      });
      
      this.logger.info(`Task ${task.taskId} completed successfully`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error executing task ${task.taskId}: ${errorMessage}`);
      
      // Log the error
      await this.sendCoTLog({
        step: 'task_failed',
        details: {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      
      // Send failure status update
      await this.sendStatusUpdate({
        status: 'failed',
        message: `Task execution failed: ${errorMessage}`,
        error: errorMessage,
      });
      
      // Re-throw to propagate error up
      throw error;
    }
  }

  abstract executeTask(task: TaskAssignment): Promise<unknown>;

  /**
   * Helper method to execute a tool via the Tool Manager
   * @param toolName Name of the tool to execute
   * @param params Parameters for the tool
   */
  async executeTool(toolName: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.toolManagerClient) {
      throw new Error('Tool Manager client not initialized');
    }
    
    // Log tool execution
    await this.sendCoTLog({
      step: 'executing_tool',
      details: {
        toolName,
        params,
      },
    });
    
    try {
      const toolResult = await this.toolManagerClient.executeTool(toolName, params);
      
      // Log tool execution result
      await this.sendCoTLog({
        step: 'tool_execution_completed',
        details: {
          toolName,
          result: toolResult,
        },
      });
      
      return toolResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log tool execution error
      await this.sendCoTLog({
        step: 'tool_execution_failed',
        details: {
          toolName,
          error: errorMessage,
        },
      });
      
      throw error;
    }
  }

  async sendStatusUpdate(update: Omit<StatusUpdate, 'timestamp' | 'jobId' | 'taskId'> & Partial<Pick<StatusUpdate, 'error'>>): Promise<void> {
    if (!this.currentJobId || !this.currentTaskId) {
      throw new Error('No active task context for status update');
    }
    
    const statusUpdate: StatusUpdate = {
      jobId: this.currentJobId,
      taskId: this.currentTaskId,
      ...update,
      timestamp: new Date().toISOString(),
    };
    
    const channel = this.rabbitMQClient.getChannel();
    if (!channel) {
      throw new Error('Channel not available for status update');
    }
    channel.publish(
      'status', 
      `agent.${this.agentId}.status`, 
      Buffer.from(JSON.stringify(statusUpdate))
    );
    
    this.logger.info(`Sent status update: ${statusUpdate.status} for task: ${this.currentTaskId}`);
  }

  async sendCoTLog(log: Omit<CoTLog, 'timestamp' | 'jobId' | 'taskId' | 'agentId'>): Promise<void> {
    if (!this.currentJobId || !this.currentTaskId) {
      throw new Error('No active task context for CoT log');
    }
    
    const coTLog: CoTLog = {
      agentId: this.agentId,
      jobId: this.currentJobId,
      taskId: this.currentTaskId,
      ...log,
      timestamp: new Date().toISOString(),
    };
    
    const channel = this.rabbitMQClient.getChannel();
    if (!channel) {
      throw new Error('Channel not available for CoT log');
    }
    channel.publish(
      'logs', 
      `agent.${this.agentId}.logs`, 
      Buffer.from(JSON.stringify(coTLog))
    );
    
    this.logger.debug(`Sent CoT log: ${log.step} for task: ${this.currentTaskId}`);
  }

  async shutdown(): Promise<void> {
    await this.rabbitMQClient.close();
    this.logger.info(`Agent ${this.agentId} shut down`);
  }
}