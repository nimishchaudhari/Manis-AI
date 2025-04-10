// src/index.ts
import { RabbitMQClient, createLogger } from "@acme/shared-utils";
var AgentService = class {
  config;
  logger;
  rabbitMQClient;
  channel = null;
  agentId;
  taskQueue;
  constructor(config, agentId, taskQueue) {
    this.config = config;
    this.logger = createLogger(`agent-${agentId}`);
    this.rabbitMQClient = new RabbitMQClient(this.config, this.logger);
    this.agentId = agentId;
    this.taskQueue = taskQueue;
  }
  async initialize() {
    await this.rabbitMQClient.connect();
    if (this.channel) {
      this.channel = this.rabbitMQClient.getChannel();
      await this.channel?.assertQueue(this.taskQueue, { durable: true });
    }
    this.logger.info(`Agent ${this.agentId} initialized and listening for tasks on queue: ${this.taskQueue}`);
  }
  async start() {
    if (this.channel) {
      this.channel.consume(this.taskQueue, async (msg) => {
        if (msg) {
          try {
            const task = JSON.parse(msg.content.toString());
            this.logger.info(`Received task: ${task.taskId} for job: ${task.jobId}`);
            await this.handleTask(task);
            this.channel?.ack(msg);
          } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`, error);
            this.channel?.nack(msg, false, false);
          }
        }
      }, { noAck: false });
    }
  }
  async sendStatusUpdate(update) {
    const jobId = "test-job-id";
    const taskId = "test-task-id";
    const statusUpdate = {
      jobId,
      taskId,
      ...update,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const channel = this.rabbitMQClient.getChannel();
    channel.publish("status", `agent.${this.agentId}.status`, Buffer.from(JSON.stringify(statusUpdate)));
    this.logger.info(`Sent status update: ${statusUpdate.status} for task: ${taskId} job: ${jobId}`);
  }
  async sendCoTLog(log) {
    const jobId = "test-job-id";
    const taskId = "test-task-id";
    const coTLog = {
      agentId: this.agentId,
      jobId,
      taskId,
      ...log,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const channel = this.rabbitMQClient.getChannel();
    channel.publish("logs", `agent.${this.agentId}.logs`, Buffer.from(JSON.stringify(coTLog)));
    this.logger.info(`Sent CoT log for task: ${taskId} job: ${jobId}`);
  }
  async shutdown() {
    await this.rabbitMQClient.close();
    this.logger.info(`Agent ${this.agentId} shut down`);
  }
};
export {
  AgentService
};
