import { TaskAssignment, StatusUpdate, CoTLog } from '@acme/shared-mcp';
import { RabbitMQConfig, Logger, createLogger } from '@acme/shared-utils';
import { AgentService } from '@acme/agent-template';

interface EchoAgentConfig {
  rabbitmq: RabbitMQConfig;
  agentId: string;
  taskQueue: string;
}

export class EchoAgent extends AgentService {
  constructor(config: EchoAgentConfig) {
    super(config.rabbitmq, config.agentId, config.taskQueue);
  }

  async handleTask(task: TaskAssignment): Promise<void> {
    try {
      this.logger.info(`Handling task: ${task.taskId} for job: ${task.jobId}`);
      await this.sendStatusUpdate({
        status: 'in-progress',
        message: 'Echo Agent started processing task',
      });

      const result = await this.executeTask(task);

      await this.sendStatusUpdate({
        status: 'completed',
        message: 'Echo Agent completed task',
        result,
      });

      await this.sendCoTLog({
        step: 'Task completed',
        details: { result },
      });
    } catch (error: any) {
      this.logger.error(`Error executing task: ${task.taskId}`, error);
      await this.sendStatusUpdate({
        status: 'failed',
        message: `Echo Agent failed to execute task: ${error.message}`,
        error: error.message,
      });
    }
  }

  async executeTask(task: TaskAssignment): Promise<unknown> {
    this.logger.info(`Executing task: ${task.taskId} for job: ${task.jobId}`);
    return task.parameters; // Echo back the parameters
  }
}

// Example usage (for local testing)
async function main() {
  const config: EchoAgentConfig = {
    rabbitmq: {
      url: 'amqp://guest:guest@localhost:5672', // Replace with your RabbitMQ URL
    },
    agentId: 'echo-agent',
    taskQueue: 'agent.echo.tasks',
  };

  const agent = new EchoAgent(config);
  await agent.initialize();
  await agent.start();

  // Keep the agent running
  console.log('Echo Agent running... Press Ctrl+C to exit');
}

if (process.env.NODE_ENV !== 'production') {
  main().catch(console.error);
}
