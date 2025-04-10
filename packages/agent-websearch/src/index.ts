import { createLogger } from '@acme/shared-utils';
import { WebSearchAgent, WebSearchAgentConfig } from './webSearchAgent.js';

// Example usage (for local testing)
async function main() {
  const config: WebSearchAgentConfig = {
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
    agentId: 'web-search',
    taskQueue: 'agent.web-search.tasks',
    useRealSearchApi: process.env.USE_REAL_SEARCH_API === 'true',
  };

  const logger = createLogger('web-search-agent-main');
  const agent = new WebSearchAgent(config);
  
  try {
    logger.info('Initializing Web Search Agent...');
    await agent.initialize();
    
    logger.info('Starting Web Search Agent...');
    await agent.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down Web Search Agent...');
      await agent.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down Web Search Agent...');
      await agent.shutdown();
      process.exit(0);
    });
    
    logger.info('Web Search Agent running... Press Ctrl+C to exit');
  } catch (error) {
    logger.error('Failed to start Web Search Agent', error);
    process.exit(1);
  }
}

// Auto-start the agent if this is the main script
if (require.main === module) {
  main().catch((error) => {
    // Use logger instead of console
    const logger = createLogger('web-search-agent-main');
    logger.error('Unhandled error in main', error);
    process.exit(1);
  });
}

export { WebSearchAgent };
export default WebSearchAgent;
