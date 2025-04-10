import pino from 'pino';

export interface LogContext {
  jobId?: string;
  taskId?: string;
  agentId?: string;
  traceId?: string;
  spanId?: string;
}

/**
 * Creates a configured Pino logger instance with the given context
 * @param name The name of the logger (typically service/component name)
 * @param context Additional context to include in all logs
 */
export function createLogger(name: string, context: LogContext = {}) {
  return pino.default({
    name,
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    base: {
      ...context,
    },
    transport: process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          },
        }
      : undefined,
  });
}

/**
 * Type-safe way to add context to an existing logger
 */
export function addLogContext(logger: pino.Logger, context: LogContext) {
  return logger.child(context);
}

/**
 * Utility to create a child logger with job context
 */
export function createJobLogger(baseLogger: pino.Logger, jobId: string, taskId?: string) {
  return addLogContext(baseLogger, {
    jobId,
    ...(taskId ? { taskId } : {}),
  });
}

// Export the Logger type for convenience
export type Logger = pino.Logger;