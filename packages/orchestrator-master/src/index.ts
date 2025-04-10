import { TaskAssignmentSchema, StatusUpdateSchema, type TaskAssignment, type StatusUpdate } from '@acme/shared-mcp';
import { RabbitMQClient, Logger, createLogger } from '@acme/shared-utils';
import { v4 as uuidv4 } from 'uuid';
import { ConsumeMessage } from 'amqplib';

interface MasterOrchestratorConfig {
  rabbitmq: {
    url: string;
  };
}

class MasterOrchestrator {
  private rabbitMQClient: RabbitMQClient;
  private jobStatuses: Map<string, StatusUpdate[]>;
  private logger: Logger;

  constructor(config: MasterOrchestratorConfig) {
    this.logger = createLogger('master-orchestrator');
    this.rabbitMQClient = new RabbitMQClient(config.rabbitmq, this.logger);
    this.jobStatuses = new Map();
    this.start().catch((error) => {
      this.logger.error('Error starting MasterOrchestrator:', error);
    });
  }

  async processUserGoal(goal: string): Promise<string> {
    const jobId = uuidv4();
    const taskId = uuidv4();
    const taskAssignment: TaskAssignment = {
      jobId,
      taskId,
      taskType: 'example_task',
      description: goal,
      parameters: {},
    };

    const validationResult = TaskAssignmentSchema.safeParse(taskAssignment);
    if (!validationResult.success) {
      throw new Error(`Invalid TaskAssignment: ${validationResult.error}`);
    }

    const channel = this.rabbitMQClient.getChannel();
    await channel.publish(
      'tasks',
      `task.${taskAssignment.taskType}`,
      Buffer.from(JSON.stringify(taskAssignment))
    );
    this.initializeJobStatus(jobId, taskId);
    return jobId;
  }

  private initializeJobStatus(jobId: string, taskId: string): void {
    if (!this.jobStatuses.has(jobId)) {
      this.jobStatuses.set(jobId, []);
    }
    const statusUpdate: StatusUpdate = {
      jobId,
      taskId,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    this.jobStatuses.get(jobId)?.push(statusUpdate);
  }

  async start(): Promise<void> {
    try {
      await this.rabbitMQClient.connect();
      const channel = this.rabbitMQClient.getChannel();
      await channel.assertQueue('status-updates');
      await channel.consume('status-updates', (msg: ConsumeMessage | null) => {
        if (msg) {
          const statusUpdate: StatusUpdate = JSON.parse(msg.content.toString());
          this.logger.info(`Received status update for job ${statusUpdate.jobId}: ${statusUpdate.status}`);
          this.updateJobStatus(statusUpdate);
          channel.ack(msg);
        }
      });
    } catch (error) {
      this.logger.error('Error starting MasterOrchestrator:', error);
      throw error;
    }
  }

  private updateJobStatus(statusUpdate: StatusUpdate): void {
    const validationResult = StatusUpdateSchema.safeParse(statusUpdate);
    if (!validationResult.success) {
      this.logger.error(`Invalid StatusUpdate: ${validationResult.error}`);
      return;
    }
    if (this.jobStatuses.has(statusUpdate.jobId)) {
      this.jobStatuses.get(statusUpdate.jobId)?.push(statusUpdate);
    } else {
      this.jobStatuses.set(statusUpdate.jobId, [statusUpdate]);
    }
  }

  public getJobStatus(jobId: string): StatusUpdate[] | undefined {
    return this.jobStatuses.get(jobId);
  }

  async stop(): Promise<void> {
    await this.rabbitMQClient.close();
  }
}

export default MasterOrchestrator;