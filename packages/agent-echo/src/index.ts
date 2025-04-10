import { TaskAssignment } from '@acme/shared-mcp';
import { 
  createLogger 
} from '@acme/shared-utils';
import { AgentService, AgentConfig } from '@acme/agent-template';

interface EchoAgentConfig extends AgentConfig {
  agentId: string;
  taskQueue: string;
}

export class EchoAgent extends AgentService {
  constructor(config: EchoAgentConfig) {
    super(
      config, 
      config.agentId, 
      config.taskQueue,
      ['echo'] // This agent's capabilities
    );
  }

  async executeTask(task: TaskAssignment): Promise<unknown> {
    this.logger.info(`Executing echo task: ${task.taskId} for job: ${task.jobId}`);
    
    // Log the start of the task
    await this.sendCoTLog({
      step: 'echo_started',
      details: { 
        parameters: task.parameters,
        description: task.description
      },
    });
    
    // If this task requires calling an external tool, we can use the Tool Manager
    if (task.parameters.useTool === true && this.toolManagerClient) {
      this.logger.info('Using Tool Manager for external tool call');
      
      await this.sendCoTLog({
        step: 'using_tool_manager',
        details: { toolName: 'mock_api' },
      });
      
      try {
        // Call the mock_api tool through the Tool Manager
        const toolResult = await this.executeTool('mock_api', {
          endpoint: '/posts/1',
          method: 'GET'
        });
        
        // Return a combined result
        return {
          echoResult: task.parameters,
          toolResult: toolResult
        };
      } catch (error) {
        this.logger.error('Tool execution failed', error);
        throw error;
      }
    }
    
    // Standard echo behavior - just return the parameters
    await this.sendCoTLog({
      step: 'echo_completed',
      details: { result: task.parameters },
    });
    
    return task.parameters; // Echo back the parameters
  }
}

// Example usage (for local testing)
async function main(): Promise<void> {
  const config: EchoAgentConfig = {
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    },
    toolManager: {
      baseUrl: process.env.TOOL_MANAGER_URL || 'http://localhost:3002',
      timeoutMs: 10000,
      retryOptions: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
      }
    },
    agentId: 'echo-agent',
    taskQueue: 'agent.echo.tasks',
  };

  const logger = createLogger('echo-agent-main');
  const agent = new EchoAgent(config);
  
  try {
    logger.info('Initializing Echo Agent...');
    await agent.initialize();
    
    logger.info('Starting Echo Agent...');
    await agent.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down Echo Agent...');
      await agent.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down Echo Agent...');
      await agent.shutdown();
      process.exit(0);
    });
    
    logger.info('Echo Agent running... Press Ctrl+C to exit');
  } catch (error) {
    logger.error('Failed to start Echo Agent', error);
    process.exit(1);
  }
}

// Auto-start the agent if this is the main script
if (require.main === module) {
  // Use a normal function call instead of console.error
  main().catch((error) => {
    const logger = createLogger('echo-agent-main');
    logger.error('Unhandled error in main', error);
    process.exit(1);
  });
}

export default EchoAgent;
