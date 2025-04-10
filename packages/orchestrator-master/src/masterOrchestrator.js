"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_utils_1 = require("@acme/shared-utils");
const hybridPlanner_1 = __importDefault(require("./hybridPlanner"));
const crypto = __importStar(require("crypto"));
class MasterOrchestrator {
    config;
    rabbitmqClient;
    hybridPlanner;
    taskStatus;
    jobStatus;
    logger;
    constructor(config) {
        this.config = config;
        this.logger = (0, shared_utils_1.createLogger)('master-orchestrator');
        this.rabbitmqClient = new shared_utils_1.RabbitMQClient(config.rabbitmq, this.logger);
        this.hybridPlanner = new hybridPlanner_1.default({
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
        await channel.consume('status-updates', async (msg) => {
            if (msg) {
                try {
                    const statusUpdate = JSON.parse(msg.content.toString());
                    await this.handleStatusUpdate(statusUpdate);
                    channel.ack(msg);
                }
                catch (error) {
                    this.logger.error('Error processing status update', error);
                    channel.nack(msg, false, false);
                }
            }
        }, { noAck: false });
    }
    async processUserGoal(goal) {
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
                await channel.publish('tasks', `task.${taskAssignment.taskType}`, Buffer.from(JSON.stringify(taskAssignment)));
                // Track task status
                const initialStatus = {
                    jobId,
                    taskId: taskAssignment.taskId,
                    status: 'pending',
                    timestamp
                };
                this.taskStatus.set(taskAssignment.taskId, initialStatus);
                this.jobStatus.get(jobId)?.tasks.set(taskAssignment.taskId, initialStatus);
            }
            return jobId;
        }
        catch (error) {
            this.updateJobStatus(jobId, 'failed', error.message);
            throw error;
        }
    }
    async handleStatusUpdate(statusUpdate) {
        this.taskStatus.set(statusUpdate.taskId, statusUpdate);
        // Update task status in job
        const job = this.jobStatus.get(statusUpdate.jobId);
        if (job) {
            job.tasks.set(statusUpdate.taskId, statusUpdate);
            this.updateJobStatus(statusUpdate.jobId);
        }
    }
    updateJobStatus(jobId, forcedStatus, error) {
        const job = this.jobStatus.get(jobId);
        if (!job)
            return;
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
        }
        else if (taskStatuses.every(s => s === 'completed')) {
            job.status = 'completed';
        }
        else if (taskStatuses.some(s => s === 'in-progress')) {
            job.status = 'in-progress';
        }
        job.timestamp = new Date().toISOString();
    }
    getTaskStatus(taskId) {
        return this.taskStatus.get(taskId);
    }
    getJobStatus(jobId) {
        const job = this.jobStatus.get(jobId);
        if (!job)
            return undefined;
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
exports.default = MasterOrchestrator;
