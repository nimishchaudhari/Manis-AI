// src/index.ts
import { AgentService } from "@acme/agent-template";
var EchoAgent = class extends AgentService {
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
export {
  EchoAgent
};
//# sourceMappingURL=index.js.map