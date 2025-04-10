"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AgentService: () => AgentService
});
module.exports = __toCommonJS(index_exports);
var import_shared_utils = require("@acme/shared-utils");
var AgentService = class {
  config;
  logger;
  rabbitMQClient;
  channel = null;
  agentId;
  taskQueue;
  constructor(config, agentId, taskQueue) {
    this.config = config;
    this.logger = (0, import_shared_utils.createLogger)(`agent-${agentId}`);
    this.rabbitMQClient = new import_shared_utils.RabbitMQClient(this.config, this.logger);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentService
});
//# sourceMappingURL=index.cjs.map