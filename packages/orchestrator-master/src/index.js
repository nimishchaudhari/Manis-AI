"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_mcp_1 = require("@acme/shared-mcp");
const shared_utils_1 = require("@acme/shared-utils");
const uuid_1 = require("uuid");
class MasterOrchestrator {
    rabbitMQClient;
    jobStatuses;
    logger;
    constructor(config) {
        this.logger = (0, shared_utils_1.createLogger)('master-orchestrator');
        this.rabbitMQClient = new shared_utils_1.RabbitMQClient(config.rabbitmq, this.logger);
        this.jobStatuses = new Map();
        this.start().catch((error) => {
            this.logger.error('Error starting MasterOrchestrator:', error);
        });
    }
    async processUserGoal(goal) {
        const jobId = (0, uuid_1.v4)();
        const taskId = (0, uuid_1.v4)();
        const taskAssignment = {
            jobId,
            taskId,
            taskType: 'example_task',
            description: goal,
            parameters: {},
        };
        const validationResult = shared_mcp_1.TaskAssignmentSchema.safeParse(taskAssignment);
        if (!validationResult.success) {
            throw new Error(`Invalid TaskAssignment: ${validationResult.error}`);
        }
        const channel = this.rabbitMQClient.getChannel();
        await channel.publish('tasks', `task.${taskAssignment.taskType}`, Buffer.from(JSON.stringify(taskAssignment)));
        this.initializeJobStatus(jobId, taskId);
        return jobId;
    }
    initializeJobStatus(jobId, taskId) {
        if (!this.jobStatuses.has(jobId)) {
            this.jobStatuses.set(jobId, []);
        }
        const statusUpdate = {
            jobId,
            taskId,
            status: 'pending',
            timestamp: new Date().toISOString(),
        };
        this.jobStatuses.get(jobId)?.push(statusUpdate);
    }
    async start() {
        try {
            await this.rabbitMQClient.connect();
            const channel = this.rabbitMQClient.getChannel();
            await channel.assertQueue('status-updates');
            await channel.consume('status-updates', (msg) => {
                if (msg) {
                    const statusUpdate = JSON.parse(msg.content.toString());
                    this.logger.info(`Received status update for job ${statusUpdate.jobId}: ${statusUpdate.status}`);
                    this.updateJobStatus(statusUpdate);
                    channel.ack(msg);
                }
            });
        }
        catch (error) {
            this.logger.error('Error starting MasterOrchestrator:', error);
            throw error;
        }
    }
    updateJobStatus(statusUpdate) {
        const validationResult = shared_mcp_1.StatusUpdateSchema.safeParse(statusUpdate);
        if (!validationResult.success) {
            this.logger.error(`Invalid StatusUpdate: ${validationResult.error}`);
            return;
        }
        if (this.jobStatuses.has(statusUpdate.jobId)) {
            this.jobStatuses.get(statusUpdate.jobId)?.push(statusUpdate);
        }
        else {
            this.jobStatuses.set(statusUpdate.jobId, [statusUpdate]);
        }
    }
    getJobStatus(jobId) {
        return this.jobStatuses.get(jobId);
    }
    async stop() {
        await this.rabbitMQClient.close();
    }
}
exports.default = MasterOrchestrator;
