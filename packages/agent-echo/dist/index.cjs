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
  EchoAgent: () => EchoAgent
});
module.exports = __toCommonJS(index_exports);
var import_agent_template = require("@acme/agent-template");
var EchoAgent = class extends import_agent_template.AgentService {
  constructor(config) {
    super(config.rabbitmq, config.agentId, config.taskQueue);
  }
  async handleTask(task) {
    try {
      this.logger.info(`Handling task: ${task.taskId} for job: ${task.jobId}`);
      await this.sendStatusUpdate({
        status: "in-progress",
        message: "Echo Agent started processing task"
      });
      const result = await this.executeTask(task);
      await this.sendStatusUpdate({
        status: "completed",
        message: "Echo Agent completed task",
        result
      });
      await this.sendCoTLog({
        step: "Task completed",
        details: { result }
      });
    } catch (error) {
      this.logger.error(`Error executing task: ${task.taskId}`, error);
      await this.sendStatusUpdate({
        status: "failed",
        message: `Echo Agent failed to execute task: ${error.message}`,
        error: error.message
      });
    }
  }
  async executeTask(task) {
    this.logger.info(`Executing task: ${task.taskId} for job: ${task.jobId}`);
    return task.parameters;
  }
};
async function main() {
  const config = {
    rabbitmq: {
      url: "amqp://guest:guest@localhost:5672"
      // Replace with your RabbitMQ URL
    },
    agentId: "echo-agent",
    taskQueue: "agent.echo.tasks"
  };
  const agent = new EchoAgent(config);
  await agent.initialize();
  await agent.start();
  console.log("Echo Agent running... Press Ctrl+C to exit");
}
if (process.env.NODE_ENV !== "production") {
  main().catch(console.error);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EchoAgent
});
//# sourceMappingURL=index.cjs.map