import { TaskAssignment, StatusUpdate } from '@acme/shared-mcp';
import { RabbitMQClient, Logger, createLogger } from '@acme/shared-utils';
import HybridPlanner from './hybridPlanner';
import * as crypto from 'crypto';
import { ConsumeMessage } from 'amqplib';

interface MasterOrchestratorConfig {
  rabbitmq: {
    url: string;
  };
  llmServiceUrl: string;
  planningTimeout: number;
}

interface JobStatus {
  jobId: string;
  goal: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  tasks: Map<string, StatusUpdate>;
  timestamp: string;
  error?: string;
}

class MasterOrchestrator {
  private config: MasterOrchestratorConfig;
  private rabbitmqClient: RabbitMQClient;
  private hybridPlanner: HybridPlanner;
  private taskStatus: Map<string, StatusUpdate>;
  private jobStatus: Map<string, JobStatus>;
  private logger: Logger;

  constructor(config: MasterOrchestratorConfig) {
    this.config = config;
    this.logger = createLogger('master-orchestrator');
    this.rabbitmqClient = new RabbitMQClient(config.rabbitmq, this.logger);
    this.hybridPlanner = new HybridPlanner({
      llmServiceUrl: config.llmServiceUrl,
      planningTimeout: config.planningTimeout,
    });
    this.taskStatus = new Map();
    this.jobStatus = new Map();
  }

  async connect() {
    await this.rabbitmqClient.connect();

    // Set up exchanges and queues
    const channel = this.rabbitmqClient.getChannel();
    await channel.assertExchange('tasks', 'direct', { durable: true });
    await channel.assertExchange('status', 'direct', { durable: true });
    await channel.assertQueue('status-updates', { durable: true });
    await channel.bindQueue('status-updates', 'status', 'agent.*.status');

    // Start consuming status updates
    await channel.consume(
      'status-updates',
      async (msg: ConsumeMessage | null) => {
        if (msg) {
          try {
            const statusUpdate = JSON.parse(msg.content.toString()) as StatusUpdate;
            await this.handleStatusUpdate(statusUpdate);
            channel.ack(msg);
          } catch (error) {
            this.logger.error('Error processing status update', error);
            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }

  async processUserGoal(goal: string): Promise<string> {
    const jobId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Initialize job status
    this.jobStatus.set(jobId, {
      jobId,
      goal,
      status: 'pending',
      tasks: new Map(),
      timestamp
    });

    try {
      const taskAssignments = await this.hybridPlanner.decomposeGoal(goal);
      
      // Update job status to in-progress
      this.updateJobStatus(jobId, 'in-progress');

      const channel = this.rabbitmqClient.getChannel();
      for (const taskAssignment of taskAssignments) {
        // Ensure taskId and jobId are set
        taskAssignment.jobId = jobId;
        taskAssignment.taskId = taskAssignment.taskId || crypto.randomUUID();

        // Publish task
        // Publish to tasks exchange with routing key based on task type
        await channel.publish(
          'tasks',
          `task.${taskAssignment.taskType}`,
          Buffer.from(JSON.stringify(taskAssignment))
        );

        // Track task status
        const initialStatus: StatusUpdate = {
          jobId,
          taskId: taskAssignment.taskId,
          status: 'pending',
          timestamp
        };
        this.taskStatus.set(taskAssignment.taskId, initialStatus);
        this.jobStatus.get(jobId)?.tasks.set(taskAssignment.taskId, initialStatus);
      }

      return jobId;
    } catch (error: any) {
      this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }

  private async handleStatusUpdate(statusUpdate: StatusUpdate) {
    this.taskStatus.set(statusUpdate.taskId, statusUpdate);

    // Update task status in job
    const job = this.jobStatus.get(statusUpdate.jobId);
    if (job) {
      job.tasks.set(statusUpdate.taskId, statusUpdate);
      this.updateJobStatus(statusUpdate.jobId);
    }
  }

  private updateJobStatus(jobId: string, forcedStatus?: JobStatus['status'], error?: string) {
    const job = this.jobStatus.get(jobId);
    if (!job) return;

    if (forcedStatus) {
      job.status = forcedStatus;
      job.error = error;
      job.timestamp = new Date().toISOString();
      return;
    }

    // Calculate job status based on task statuses
    const taskStatuses = Array.from(job.tasks.values()).map(t => t.status);
    if (taskStatuses.some(s => s === 'failed')) {
      job.status = 'failed';
    } else if (taskStatuses.every(s => s === 'completed')) {
      job.status = 'completed';
    } else if (taskStatuses.some(s => s === 'in-progress')) {
      job.status = 'in-progress';
    }
    job.timestamp = new Date().toISOString();
  }

  public getTaskStatus(taskId: string): StatusUpdate | undefined {
    return this.taskStatus.get(taskId);
  }

  public getJobStatus(jobId: string): Omit<JobStatus, 'tasks'> & { tasks: StatusUpdate[] } | undefined {
    const job = this.jobStatus.get(jobId);
    if (!job) return undefined;

    return {
      jobId: job.jobId,
      goal: job.goal,
      status: job.status,
      timestamp: job.timestamp,
      error: job.error,
      tasks: Array.from(job.tasks.values())
    };
  }
}

export default MasterOrchestrator;