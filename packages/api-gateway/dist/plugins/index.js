import fp from 'fastify-plugin';
// Using a mock MasterOrchestrator until it's fully implemented
// import MasterOrchestrator from '@acme/orchestrator-master';
// Mock MasterOrchestrator
class MasterOrchestrator {
    constructor(config) {
        this.config = config;
    }
    config;
    async connect() {
        // Simulate connection
    }
    async processUserGoal(_goal) {
        // In a real implementation, this would create a job and return a job ID
        return `mock-job-${Date.now()}`;
    }
    async getJobStatus(jobId) {
        // Mock job status
        return {
            jobId,
            goal: "Mock goal for testing",
            status: "in-progress",
            timestamp: new Date().toISOString(),
            tasks: [
                {
                    taskId: "mock-task-1",
                    status: "completed",
                    timestamp: new Date().toISOString(),
                }
            ]
        };
    }
}
const fastifyPlugin = async (fastify, _options) => {
    const orchestrator = new MasterOrchestrator({
        rabbitmq: {
            url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        },
        llmServiceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:3001',
        planningTimeout: process.env.PLANNING_TIMEOUT ? parseInt(process.env.PLANNING_TIMEOUT, 10) : 30000,
    });
    // Connect to RabbitMQ
    await orchestrator.connect();
    // Add orchestrator to Fastify instance
    fastify.decorate('orchestrator', orchestrator);
    // Close connection when Fastify closes
    fastify.addHook('onClose', async (_instance) => {
        // Add any cleanup logic when needed
    });
};
export default fp(fastifyPlugin, { name: 'orchestrator' });
