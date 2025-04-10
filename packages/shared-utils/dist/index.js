// src/logging.ts
import pino from "pino";
function createLogger(name, context = {}) {
  return pino.default({
    name,
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label })
    },
    base: {
      ...context
    },
    transport: process.env.NODE_ENV !== "production" ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "pid,hostname",
        translateTime: "yyyy-mm-dd HH:MM:ss.l"
      }
    } : void 0
  });
}
function addLogContext(logger, context) {
  return logger.child(context);
}
function createJobLogger(baseLogger, jobId, taskId) {
  return addLogContext(baseLogger, {
    jobId,
    ...taskId ? { taskId } : {}
  });
}

// src/errors.ts
var ManisError = class extends Error {
  constructor(message, code, cause) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
};
var TaskExecutionError = class extends ManisError {
  constructor(message, taskId, jobId, cause) {
    super(message, "TASK_EXECUTION_ERROR", cause);
    this.taskId = taskId;
    this.jobId = jobId;
    this.cause = cause;
  }
};
var ValidationError = class extends ManisError {
  constructor(message, details) {
    super(message, "VALIDATION_ERROR");
    this.details = details;
  }
};
var NotFoundError = class extends ManisError {
  constructor(message, resourceType, resourceId) {
    super(message, "NOT_FOUND_ERROR");
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
};
var ToolExecutionError = class extends ManisError {
  constructor(message, toolName, params, cause) {
    super(message, "TOOL_EXECUTION_ERROR", cause);
    this.toolName = toolName;
    this.params = params;
    this.cause = cause;
  }
};
var CommunicationError = class extends ManisError {
  constructor(message, target, cause) {
    super(message, "COMMUNICATION_ERROR", cause);
    this.target = target;
    this.cause = cause;
  }
};
var TimeoutError = class extends ManisError {
  constructor(message, timeoutMs) {
    super(message, "TIMEOUT_ERROR");
    this.timeoutMs = timeoutMs;
  }
};
var MemoryError = class extends ManisError {
  constructor(message, operation, cause) {
    super(message, "MEMORY_ERROR", cause);
    this.operation = operation;
    this.cause = cause;
  }
};
var CapabilityError = class extends ManisError {
  constructor(message, requiredCapability) {
    super(message, "CAPABILITY_ERROR");
    this.requiredCapability = requiredCapability;
  }
};

// src/retry.ts
var DEFAULT_OPTIONS = {
  maxAttempts: 3,
  initialDelayMs: 1e3,
  maxDelayMs: 1e4,
  jitter: 0.1,
  timeoutMs: 3e4,
  logger: console
};
function calculateDelay(attempt, options) {
  const exponentialDelay = options.initialDelayMs * Math.pow(2, attempt - 1);
  const delay = Math.min(exponentialDelay, options.maxDelayMs);
  if (options.jitter === 0) return delay;
  const jitterAmount = delay * options.jitter;
  return delay + (Math.random() * 2 - 1) * jitterAmount;
}
async function withRetry(fn, options = {}) {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const { maxAttempts, timeoutMs, logger } = finalOptions;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
          }, timeoutMs);
        })
      ]);
      if (attempt > 1) {
        logger.debug(`Succeeded after ${attempt} attempts`);
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        logger.warn(`Failed after ${maxAttempts} attempts`, { error: lastError });
        break;
      }
      const delay = calculateDelay(attempt, finalOptions);
      logger.debug(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
        { error: lastError }
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
function makeRetryable(fn, options = {}) {
  return async (...args) => {
    return withRetry(() => fn(...args), options);
  };
}
var CircuitBreaker = class {
  constructor(threshold = 5, resetTimeoutMs = 3e4) {
    this.threshold = threshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }
  failures = 0;
  lastFailureTime = 0;
  state = "closed";
  async execute(fn) {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }
    try {
      const result = await fn();
      if (this.state === "half-open") {
        this.reset();
      }
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "open";
    }
  }
  reset() {
    this.failures = 0;
    this.state = "closed";
  }
  getState() {
    return this.state;
  }
};

// src/rabbitmq.ts
import amqplib from "amqplib";
var RabbitMQClient = class {
  connection = null;
  channel = null;
  config;
  logger;
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  async connect() {
    try {
      this.connection = await amqplib.connect(this.config.url);
      this.channel = await this.connection.createChannel();
      this.logger.info("Connected to RabbitMQ");
      this.connection.on("close", () => {
        this.logger.warn("RabbitMQ connection closed");
        this.connection = null;
        this.channel = null;
      });
      this.channel?.on("error", (err) => {
        this.logger.error("RabbitMQ channel error", err);
        this.channel = null;
      });
    } catch (err) {
      this.logger.error("Failed to connect to RabbitMQ", err);
      throw err;
    }
  }
  getChannel() {
    if (!this.channel) {
      throw new Error("RabbitMQ channel is not initialized. Call connect() first.");
    }
    return this.channel;
  }
  async declareExchangesAndQueues() {
    try {
      const channel = this.getChannel();
      await channel.assertExchange("tasks", "topic", { durable: true });
      await channel.assertExchange("status", "topic", { durable: true });
      await channel.assertExchange("logs", "topic", { durable: true });
      await channel.assertExchange("capabilities", "topic", { durable: true });
      await channel.assertQueue("agent.websearch.tasks", { durable: true });
      await channel.assertQueue("orchestrator.status", { durable: true });
      await channel.bindQueue("agent.websearch.tasks", "tasks", "websearch.*");
      await channel.bindQueue("orchestrator.status", "status", "orchestrator.*");
      this.logger.info("Exchanges and queues declared successfully");
    } catch (err) {
      this.logger.error("Failed to declare exchanges and queues", err);
      throw err;
    }
  }
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.logger.info("RabbitMQ channel closed");
      }
      if (this.connection) {
        await this.connection.close();
        this.logger.info("RabbitMQ connection closed");
      }
    } catch (err) {
      this.logger.error("Error closing RabbitMQ connection", err);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
};
export {
  CapabilityError,
  CircuitBreaker,
  CommunicationError,
  ManisError,
  MemoryError,
  NotFoundError,
  RabbitMQClient,
  TaskExecutionError,
  TimeoutError,
  ToolExecutionError,
  ValidationError,
  addLogContext,
  createJobLogger,
  createLogger,
  makeRetryable,
  withRetry
};
//# sourceMappingURL=index.js.map